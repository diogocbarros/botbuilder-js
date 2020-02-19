/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Expression } from 'botframework-expressions';
import { ExpressionProperty } from '../expressionProperty';

export class IntExpression extends ExpressionProperty<number> {
    public constructor(value?: number | string | Expression) {
        if (value == undefined || value == null) {
            super(0);
        } else {
            super(value);
        }
    }
}