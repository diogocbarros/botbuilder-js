
/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ExpressionEngine, Expression } from 'botframework-expressions';

export class ExpressionProperty<T> {
    private _expression: Expression;

    public constructor(value?: any) {
        this.setValue(value);
    }

    public value: T;

    public expressionText: string;

    public toString(): string {
        if (this.expressionText) {
            if (this.expressionText.startsWith('=')) {
                return this.expressionText;
            } else {
                return `=${ this.expressionText }`;
            }
        }

        if (this.value == undefined || this.value == null) {
            return undefined;
        }
        return this.value.toString();
    }

    public toExpression(): Expression {
        if (this._expression) {
            return this._expression;
        }

        if (this.expressionText) {
            const expressionText = this.expressionText.startsWith('=') ? this.expressionText.substr(1) : this.expressionText;
            this._expression = new ExpressionEngine().parse(expressionText);
            return this._expression;
        }

        if (this.value == undefined || this.value == null) {
            this._expression = new ExpressionEngine().parse('');
            return this._expression;
        }

        if (typeof this.value == 'string' || typeof this.value == 'number' || typeof this.value == 'boolean') {
            this._expression = new ExpressionEngine().parse(this.value.toString());
            return this._expression;
        }

        this._expression = new ExpressionEngine().parse(`json(${ JSON.stringify(this.value) })`);
        return this._expression;
    }

    public getValue(data: any): T {
        if (!this._expression && this.expressionText) {
            const expressionText = this.expressionText.startsWith('=') ? this.expressionText.substr(1) : this.expressionText;
            this._expression = new ExpressionEngine().parse(expressionText);
        }

        if (this._expression) {
            const { value, error } = this._expression.tryEvaluate(data);
            if (error) {
                return undefined;
            }
            return value as T;
        }

        return this.value as T;
    }

    public setValue(value: any): void {
        if (typeof value == 'string') {
            const expressionText = value.startsWith('=') ? value.substr(1) : value;
            this.value = undefined;
            this._expression = new ExpressionEngine().parse(expressionText);
            this.expressionText = expressionText;
            return;
        }

        if (value instanceof Expression) {
            this.value = undefined;
            this._expression = value;
            this.expressionText = value.toString();
            return;
        }

        this.value = value as T;
    }
}