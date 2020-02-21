/**
 * @module botbuilder-lg
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// tslint:disable-next-line: no-submodule-imports
import { ANTLRInputStream } from 'antlr4ts/ANTLRInputStream';
// tslint:disable-next-line: no-submodule-imports
import { CommonTokenStream } from 'antlr4ts/CommonTokenStream';
import { ErrorListener } from './errorListener';
import { LGFileLexer } from './generated/LGFileLexer';
import { FileContext, ImportDefinitionContext, LGFileParser, ParagraphContext, TemplateDefinitionContext } from './generated/LGFileParser';
import { LGImport } from './lgImport';
import { LGTemplate } from './lgTemplate';
import { LGFile } from './lgFile';
import { StaticChecker } from './staticChecker';
import { LGExtensions } from './lgExtensions';
import { LGException } from './lgException';
import * as path from 'path';
import * as fs from 'fs';
import { Diagnostic, DiagnosticSeverity } from './diagnostic';
import { Position } from './position';
import { ParserRuleContext } from 'antlr4ts';
import { Range } from './range';


export declare type ImportResolverDelegate = (source: string, resourceId: string) => { content: string; id: string };

/**
 * LG Parser
 */
export class LGParser {

    /**
    * parse a file and return LG file.
    * @param filePath LG absolute file path..
    * @param importResolver resolver to resolve LG import id to template text.
    * @returns new lg file.
    */
    public static parseFile(filePath: string, importResolver: ImportResolverDelegate): LGFile {
        const fullPath = LGExtensions.normalizePath(filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');

        return LGParser.parseText(content, fullPath, importResolver);
    }

    /**
     * Parser to turn lg content into a LGFile.
     * @param content ext content contains lg templates.
     * @param id id is the identifier of content. If importResolver is null, id must be a full path string. 
     * @param importResolver resolver to resolve LG import id to template text.
     * @returns entity.
     */
    public static parseText(content: string, id: string = '', importResolver: ImportResolverDelegate = null): LGFile {
        importResolver = importResolver? importResolver : LGParser.defaultFileResolver;
        let lgFile = new LGFile();
        lgFile.content = content;
        lgFile.id = id;
        lgFile.importResolver = importResolver;
        let diagnostics: Diagnostic[] = [];
        try{
            const parsedResult = LGParser.antlrParse(content, id);
            lgFile.templates = parsedResult.templates;
            lgFile.imports = parsedResult.imports;
            diagnostics = diagnostics.concat(parsedResult.invalidTemplateErrors);
            lgFile.references = this.getReferences(lgFile, importResolver);
            const semanticErrors = new StaticChecker(lgFile).check();
            diagnostics = diagnostics.concat(semanticErrors);
        } catch (err)
        {
            if (err instanceof LGException) {
                diagnostics = diagnostics.concat(err.getDiagnostic());
            } else {
                diagnostics.push(this.buildDiagnostic(err.Message, undefined, id));
            }
        }

        lgFile.diagnostics = diagnostics;

        return lgFile;
    }

    /// <summary>
    /// Parser to turn lg content into a <see cref="LGFile"/> based on the original LGFile.
    /// </summary>
    /// <param name="content">Text content contains lg templates.</param>
    /// <param name="lgFile">original LGFile.</param>
    /// <returns>new <see cref="LGFile"/> entity.</returns>
    public static parseTextWithRef(content: string, lgFile: LGFile): LGFile {
        if (!lgFile)
        {
            throw Error(`LGFile`);
        }

        const id = 'inline content';
        let newLgFile = new LGFile();
        newLgFile.content = content;
        newLgFile.id = id;
        newLgFile.importResolver = lgFile.importResolver;
        let diagnostics: Diagnostic[] = [];
        try
        {
            const antlrResult = this.antlrParse(content, id);
            const templates = antlrResult.templates;
            const imports = antlrResult.imports; 
            const invalidTemplateErrors = antlrResult.invalidTemplateErrors;
            newLgFile.templates = templates;
            newLgFile.imports = imports;
            diagnostics = diagnostics.concat(invalidTemplateErrors);

            newLgFile.references = this.getReferences(newLgFile, newLgFile.importResolver)
                .concat(lgFile.references)
                .concat([ lgFile ]);

            var semanticErrors = new StaticChecker(newLgFile).check();
            diagnostics = diagnostics.concat(semanticErrors);
        }
        catch (err)
        {
            if (err instanceof LGException) {
                diagnostics = diagnostics.concat(err.getDiagnostic());
            } else {
                diagnostics.push(this.buildDiagnostic(err.Message, undefined, id));
            }
        }

        newLgFile.diagnostics = diagnostics;

        return newLgFile;
    }

    public static defaultFileResolver(sourceId: string, resourceId: string): {content: string; id: string} {
        let importPath = LGExtensions.normalizePath(resourceId);
        if (!path.isAbsolute(importPath)) {
            // get full path for importPath relative to path which is doing the import.
            importPath = LGExtensions.normalizePath(path.join(path.dirname(sourceId), importPath));
        }
        if (!fs.existsSync(importPath) || !fs.statSync(importPath).isFile()) {
            throw Error(`Could not find file: ${ importPath }`);
        }
        const content: string = fs.readFileSync(importPath, 'utf-8');
        
        return { content, id: importPath };
    }

    private static antlrParse(text: string, id: string = ''): { templates: LGTemplate[]; imports: LGImport[]; invalidTemplateErrors: Diagnostic[]} {
        const fileContext: FileContext = this.getFileContentContext(text, id);
        const templates: LGTemplate[] = this.extractLGTemplates(fileContext, text, id);
        const imports: LGImport[] = this.extractLGImports(fileContext, id);
        const invalidTemplateErrors: Diagnostic[] = this.getInvalidTemplateErrors(fileContext, id);

        return { templates, imports, invalidTemplateErrors};
    }

    private static getReferences(file: LGFile, importResolver: ImportResolverDelegate): LGFile[] {
        var resourcesFound = new Set<LGFile>();
        this.resolveImportResources(file, resourcesFound, importResolver);

        resourcesFound.delete(file);
        return Array.from(resourcesFound);
    }

    private static resolveImportResources(start: LGFile, resourcesFound: Set<LGFile>, importResolver: ImportResolverDelegate): void
    {
        var resourceIds = start.imports.map(lg => lg.id);
        resourcesFound.add(start);

        for (const id of resourceIds)
        {
            try
            {
                const result = importResolver(start.id, id);
                const content = result.content;
                const path = result.id;
                const notExsit = Array.from(resourcesFound).filter(u => u.id === path).length === 0;
                if (notExsit)
                {
                    var childResource = LGParser.parseText(content, path, importResolver);
                    this.resolveImportResources(childResource, resourcesFound, importResolver);
                }
            }
            catch (err)
            {
                if (err instanceof LGException) {
                    throw err;
                } else {
                    throw new LGException(err.message, [ this.buildDiagnostic(err.message, undefined, start.id) ]);
                }
            }
        }
    }

    private static buildDiagnostic(message: string, context: ParserRuleContext = undefined, source: string = undefined): Diagnostic {
        message = message === undefined ? '' : message;
        const startPosition: Position = context === undefined?  new Position(0, 0) : new Position(context.start.line, context.start.charPositionInLine);
        const endPosition: Position = context === undefined?  new Position(0, 0) : new Position(context.stop.line, context.stop.charPositionInLine + context.stop.text.length);
        return new Diagnostic(new Range(startPosition, endPosition), message, DiagnosticSeverity.Error, source);
    }

    private static getInvalidTemplateErrors(fileContext: FileContext, id: string): Diagnostic[] {
        let errorTemplates = [];
        if (fileContext !== undefined) {
            for (const parag of fileContext.paragraph()) {
                const errTem =parag.errorTemplate();
                if (errTem) {
                    errorTemplates = errorTemplates.concat(errTem);
                }
            }
        }

        return errorTemplates.map(u => this.buildDiagnostic("error context.", u, id));
    }
 
    private static getFileContentContext(text: string, source: string): FileContext {
        if (!text) {
            return undefined;
        }

        const input: ANTLRInputStream = new ANTLRInputStream(text);
        const lexer: LGFileLexer = new LGFileLexer(input);
        const tokens: CommonTokenStream = new CommonTokenStream(lexer);
        const parser: LGFileParser = new LGFileParser(tokens);
        parser.removeErrorListeners();
        parser.addErrorListener(new ErrorListener(source));
        parser.buildParseTree = true;

        return parser.file();
    }

    private static extractLGTemplates(file: FileContext, lgfileContent: string, source: string = ''): LGTemplate[] {
        if (!file) {
            return [];
        }

        const templates: TemplateDefinitionContext[] = file.paragraph()
            .map((x: ParagraphContext): TemplateDefinitionContext => x.templateDefinition())
            .filter((x: TemplateDefinitionContext): boolean => x !== undefined);

        return templates.map((x: TemplateDefinitionContext): LGTemplate => new LGTemplate(x, lgfileContent, source));
    }

    private static extractLGImports(file: FileContext, source: string = ''): LGImport[] {
        if (!file) {
            return [];
        }

        const imports: ImportDefinitionContext[] = file.paragraph()
            .map((x: ParagraphContext): ImportDefinitionContext => x.importDefinition())
            .filter((x: ImportDefinitionContext): boolean => x !== undefined);

        return imports.map((x: ImportDefinitionContext): LGImport => new LGImport(x, source));
    }
}
