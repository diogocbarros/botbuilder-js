/**
 * @module adaptive-expressions
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { ParseTree } from 'antlr4ts/tree/ParseTree';
import * as LRUCache from 'lru-cache';
import { CommonRegexLexer, CommonRegexParser } from './generated';
import { RegexErrorListener } from './regexErrorListener';

// tslint:disable-next-line: completed-docs
/**
 * Convert PCRE regex string to RegExp
 * PCRE ref: http://www.pcre.org/.
 * PCRE antlr g4 file: CommonRegex.g4.
 */
export class CommonRegex {
    private static regexCache: LRUCache<string, RegExp> = new LRUCache<string, RegExp>(15);

    /**
     * Create RegExp object from PCRE pattern string.
     * @param pattern PCRE pattern string.
     * @returns RegExp object.
     */
    public static CreateRegex(pattern: string): RegExp {

        let result: RegExp;
        if (pattern && this.regexCache.has(pattern)) {
            result = this.regexCache.get(pattern);
        } else {
            if (!pattern || !this.isCommonRegex(pattern)) {
                throw new Error(`A regular expression parsing error occurred.`);
            }

            result = this.getRegExpFromString(pattern);
            this.regexCache.set(pattern, result);
        }

        return result;
    }

    private static getRegExpFromString(pattern: string): RegExp {
        const flags: string[] = ['(?i)', '(?m)', '(?s)'];
        let flag = '';
        flags.forEach((e: string): void => {
            if (pattern.includes(e)) {
                flag += e.substr(2, 1);
                pattern = pattern.replace(e, '');
            }
        });

        let regexp: RegExp;
        if (flag) {
            regexp = new RegExp(`${ pattern }`, flag);
        } else {
            regexp = new RegExp(`${ pattern }`);
        }

        return regexp;
    }

    private static isCommonRegex(pattern: string): boolean {
        try {
            this.antlrParse(pattern);
        } catch (Exception) {
            return false;
        }

        return true;
    }

    private static antlrParse(pattern: string): ParseTree {
        const inputStream: ANTLRInputStream = new ANTLRInputStream(pattern);
        const lexer: CommonRegexLexer = new CommonRegexLexer(inputStream);
        const tokenStream: CommonTokenStream = new CommonTokenStream(lexer);
        const parser: CommonRegexParser = new CommonRegexParser(tokenStream);
        parser.removeErrorListeners();
        // tslint:disable-next-line: no-use-before-declare
        parser.addErrorListener(RegexErrorListener.Instance);
        parser.buildParseTree = true;

        return parser.parse();
    }
}