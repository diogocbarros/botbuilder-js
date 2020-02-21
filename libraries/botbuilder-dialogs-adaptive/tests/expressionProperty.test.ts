/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as assert from 'assert';
import { BoolExpression, EnumExpression, IntExpression, NumberExpression, ObjectExpression, StringExpression, ValueExpression } from '../';

describe('expressionProperty tests', () => {
    it('BoolExpression', () => {
        const data = { test: true };

        let val = new BoolExpression('true');
        assert.equal(val.expressionText, 'true');
        let result = val.getValue(data);
        assert.equal(result, true);

        val = new BoolExpression('=true');
        assert.equal(val.expressionText, 'true');
        result = val.getValue(data);
        assert.equal(result, true);

        val = new BoolExpression(true);
        assert.equal(val.expressionText, undefined);
        assert.equal(val.value, true);
        result = val.getValue(data);
        assert.equal(result, true);

        val = new BoolExpression('=test');
        assert.equal(val.expressionText, 'test');
        result = val.getValue(data);
        assert.equal(result, true);

        val = new BoolExpression();
        assert.equal(val.expressionText, undefined);
        assert.equal(val.value, false);
        result = val.getValue(data);
        assert.equal(result, false);
    });

    it('EnumExpression', () => {
        enum TestEnum { One, Two, Three };
        const data = { test: TestEnum.Three };

        let val = new EnumExpression<TestEnum>('=test');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        let result = val.getValue(data);
        assert.equal(result, TestEnum.Three);

        val = new EnumExpression<TestEnum>(TestEnum.Three);
        assert.equal(val.expressionText, undefined);
        assert.equal(val.value, TestEnum.Three);
        result = val.getValue(data);
        assert.equal(result, TestEnum.Three);
    });

    it('IntExpression', () => {
        const data = { test: 13 };

        let val = new IntExpression('test');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        let result = val.getValue(data);
        assert.equal(result, 13);

        val = new IntExpression('=test');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        result = val.getValue(data);
        assert.equal(result, 13);

        val = new IntExpression('13');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        result = val.getValue(data);
        assert.equal(result, 13);

        val = new IntExpression('=13');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        result = val.getValue(data);
        assert.equal(result, 13);

        val = new IntExpression(13);
        assert.equal(val.expressionText, undefined);
        assert.equal(val.value, 13);
        result = val.getValue(data);
        assert.equal(result, 13);
    });

    it('NumberExpression', function() {
        const data = { test: 3.14 };

        let val = new NumberExpression('test');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        let result = val.getValue(data);
        assert.equal(result, 3.14);

        val = new NumberExpression('=test');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        result = val.getValue(data);
        assert.equal(result, 3.14);

        val = new NumberExpression('3.14');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        result = val.getValue(data);
        assert.equal(result, 3.14);

        val = new NumberExpression('=3.14');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        result = val.getValue(data);
        assert.equal(result, 3.14);

        val = new NumberExpression(3.14);
        assert.equal(val.expressionText, undefined);
        assert.equal(val.value, 3.14);
        result = val.getValue(data);
        assert.equal(result, 3.14);
    });

    it('ObjectExpression', () => {
        class Foo { public age: number; public name: string };
        const foo: Foo = { age: 13, name: 'joe' };
        const data = { test: foo };

        let val = new ObjectExpression<Foo>('test');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        let result = val.getValue(data);
        assert.equal(result.age, 13);
        assert.equal(result.name, 'joe');

        val = new ObjectExpression<Foo>('=test');
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        result = val.getValue(data);
        assert.equal(result.age, 13);
        assert.equal(result.name, 'joe');

        val = new ObjectExpression<Foo>(data.test);
        assert.equal(val.expressionText, undefined);
        assert.notEqual(val.value, undefined);
        result = val.getValue(data);
        assert.equal(result.age, 13);
        assert.equal(result.name, 'joe');

        val = new ObjectExpression<Foo>(() => data.test);
        assert.equal(val.value, undefined);
        result = val.getValue(data);
        assert.equal(result.age, 13);
        assert.equal(result.name, 'joe');
    });

    it('StringExpression', () => {
        const data = { test: 'joe' };

        let str = new StringExpression('test');
        assert.equal(str.expressionText, '=`test`');
        assert.equal(str.value, undefined);
        // let result = str.getValue(data);
        // assert.equal(result, 'test');

        str = new StringExpression('=test');
        assert.equal(str.expressionText, '=test');
        assert.equal(str.value, undefined);
        // result = str.getValue(data);
        // assert.equal(result, 'joe');

        str = new StringExpression('Hello ${test}');
        assert.equal(str.expressionText, '=`Hello ${test}`');
        assert.equal(str.value, undefined);
        // result = str.getValue(data);
        // assert.equal(result, 'Hello joe');
    });

    it('ValueExpression', () => {
        const data = { test: { x: 13 } };

        let val = new ValueExpression('test');
        assert.equal(val.expressionText, '=`test`');
        assert.equal(val.value, undefined);
        // let result = val.getValue(data);
        // assert.equal(result, 'test');

        val = new ValueExpression('=test');
        assert.equal(val.expressionText, '=test');
        assert.equal(val.value, undefined);
        let result = val.getValue(data);
        assert.equal(JSON.stringify(result), JSON.stringify(data.test));

        val = new ValueExpression(data.test);
        assert.notEqual(val.expressionText, undefined);
        assert.equal(val.value, undefined);
        // result = val.getValue(data);
        // assert.equal(JSON.stringify(result), JSON.stringify(data.test));

        val = new ValueExpression('Hello ${test.x}');
        assert.equal(val.expressionText, '=`Hello ${test.x}`');
        assert.equal(val.value, undefined);
        // result = val.getValue(data);
        // assert.equal(result, 'Hello 13');
    });
});