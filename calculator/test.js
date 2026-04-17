function runTests() {
    let passed = 0;
    let failed = 0;
    const results = [];

    function test(name, actual, expected) {
        if (Math.abs(actual - expected) < 0.0001) {
            passed++;
            results.push(`✓ ${name}: ${actual} (预期: ${expected})`);
        } else {
            failed++;
            results.push(`✗ ${name}: 实际=${actual}, 预期=${expected}`);
        }
    }

    function evaluateSimpleExpression(expr) {
        expr = expr.replace(/\s/g, '');

        let result = 0;
        let currentNum = '';
        let currentOp = '+';
        let expectNumber = true;

        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];

            if (expectNumber) {
                if (char === '-' || (char >= '0' && char <= '.') || char === 'e') {
                    currentNum += char;
                    expectNumber = false;
                }
            } else {
                if ((char >= '0' && char <= '.') || char === 'e') {
                    currentNum += char;
                } else if (char === '+' || char === '-' || char === '*' || char === '/' || char === '%') {
                    if (currentNum !== '') {
                        let num = parseFloat(currentNum);
                        if (isNaN(num)) {
                            return NaN;
                        }
                        result = applyOperation(result, num, currentOp);
                        currentNum = '';
                    }
                    currentOp = char;
                    expectNumber = true;
                }
            }
        }

        if (currentNum !== '') {
            let num = parseFloat(currentNum);
            if (isNaN(num)) {
                return NaN;
            }
            result = applyOperation(result, num, currentOp);
        }

        return result;
    }

    function evaluateExpression(expr) {
        let expression = expr.replace(/\s/g, '');

        while (expression.includes('(')) {
            const openIndex = expression.lastIndexOf('(');
            const closeIndex = expression.indexOf(')', openIndex);
            if (closeIndex === -1) break;

            const innerExpr = expression.substring(openIndex + 1, closeIndex);
            const innerResult = evaluateSimpleExpression(innerExpr);
            expression = expression.substring(0, openIndex) + innerResult + expression.substring(closeIndex + 1);
        }

        return evaluateSimpleExpression(expression);
    }

    function applyOperation(a, b, op) {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b !== 0 ? a / b : NaN;
            case '%': return a % b;
            default: return b;
        }
    }

    results.push('=== 基础运算测试 ===');
    test('简单加法: 2+5', evaluateSimpleExpression('2+5'), 7);
    test('简单减法: 10-3', evaluateSimpleExpression('10-3'), 7);
    test('简单乘法: 3*4', evaluateSimpleExpression('3*4'), 12);
    test('简单除法: 10/2', evaluateSimpleExpression('10/2'), 5);
    test('多个运算: 2+3*4', evaluateSimpleExpression('2+3*4'), 14);
    test('浮点数: 1.5+2.5', evaluateSimpleExpression('1.5+2.5'), 4);
    test('负数: -5+3', evaluateSimpleExpression('-5+3'), -2);

    results.push('\n=== 括号表达式测试 ===');
    test('括号: (2+5)', evaluateExpression('(2+5)'), 7);
    test('括号: (3+5)+(6+2)', evaluateExpression('(3+5)+(6+2)'), 16);
    test('括号: (6+2*3)', evaluateExpression('(6+2*3)'), 12);
    test('嵌套括号: ((2+3))', evaluateExpression('((2+3))'), 5);
    test('复杂嵌套: (3+5)+(6+2*3)', evaluateExpression('(3+5)+(6+2*3)'), 16);
    test('括号乘法: (2+3)*4', evaluateExpression('(2+3)*4'), 20);
    test('括号除法: 20/(2+3)', evaluateExpression('20/(2+3)'), 4);

    results.push('\n=== 测试结果 ===');
    results.push(`通过: ${passed}, 失败: ${failed}`);

    return results.join('\n');
}

console.log(runTests());
