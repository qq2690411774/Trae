const evaluateSimpleExpression = function(expr) {
    expr = expr.replace(/\s/g, '');

    let tokens = [];
    let currentNum = '';
    let expectNumber = true;

    for (let i = 0; i < expr.length; i++) {
        const char = expr[i];

        // 检查是否是 pow 运算符
        if (expr.substring(i, i + 3) === 'pow') {
            if (currentNum !== '') {
                tokens.push({ type: 'number', value: parseFloat(currentNum) });
                currentNum = '';
            }
            tokens.push({ type: 'operator', value: 'pow' });
            i += 2;
            expectNumber = true;
            continue;
        }

        if (expectNumber) {
            if (char === '-' || (char >= '0' && char <= '9') || char === '.') {
                currentNum += char;
                expectNumber = false;
            }
        } else {
            if ((char >= '0' && char <= '9') || char === '.') {
                currentNum += char;
            } else if (char === '+' || char === '-' || char === '*' || char === '/' || char === '%') {
                if (currentNum !== '') {
                    tokens.push({ type: 'number', value: parseFloat(currentNum) });
                    currentNum = '';
                }
                tokens.push({ type: 'operator', value: char });
                expectNumber = true;
            }
        }
    }

    if (currentNum !== '') {
        tokens.push({ type: 'number', value: parseFloat(currentNum) });
    }

    if (tokens.length === 0) return 0;
    if (tokens.length === 1 && tokens[0].type === 'number') return tokens[0].value;

    let numbers = [];
    let operators = [];

    for (let token of tokens) {
        if (token.type === 'number') {
            numbers.push(token.value);
        } else {
            operators.push(token.value);
        }
    }

    // 第一遍：处理幂运算 (^) - 最高优先级
    for (let i = 0; i < operators.length; i++) {
        if (operators[i] === 'pow') {
            let a = numbers[i];
            let b = numbers[i + 1];
            let result = Math.pow(a, b);
            numbers[i] = result;
            numbers.splice(i + 1, 1);
            operators.splice(i, 1);
            i--;
        }
    }

    // 第二遍：处理乘除模
    for (let i = 0; i < operators.length; i++) {
        if (operators[i] === '*' || operators[i] === '/') {
            let a = numbers[i];
            let b = numbers[i + 1];
            let result;
            if (operators[i] === '*') {
                result = a * b;
            } else {
                if (b === 0) return NaN;
                result = a / b;
            }
            numbers[i] = result;
            numbers.splice(i + 1, 1);
            operators.splice(i, 1);
            i--;
        }
    }

    // 第三遍：处理加减
    let finalResult = numbers[0];
    for (let i = 0; i < operators.length; i++) {
        switch (operators[i]) {
            case '+': finalResult += numbers[i + 1]; break;
            case '-': finalResult -= numbers[i + 1]; break;
            case '%': finalResult %= numbers[i + 1]; break;
        }
    }

    return finalResult;
};

const evaluateExpression = function(expr) {
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
};

const tests = [
    // 基础四则运算
    { name: '简单加法: 2+5', actual: evaluateSimpleExpression('2+5'), expected: 7 },
    { name: '简单减法: 10-3', actual: evaluateSimpleExpression('10-3'), expected: 7 },
    { name: '简单乘法: 3*4', actual: evaluateSimpleExpression('3*4'), expected: 12 },
    { name: '简单除法: 10/2', actual: evaluateSimpleExpression('10/2'), expected: 5 },

    // 运算符优先级
    { name: '乘优先于加: 2+3*4', actual: evaluateSimpleExpression('2+3*4'), expected: 14 },
    { name: '乘优先于减: 10-2*3', actual: evaluateSimpleExpression('10-2*3'), expected: 4 },
    { name: '除优先于加: 3+10/2', actual: evaluateSimpleExpression('3+10/2'), expected: 8 },
    { name: '连续乘除: 2*3/2', actual: evaluateSimpleExpression('2*3/2'), expected: 3 },

    // 幂运算
    { name: '简单幂: 2^3', actual: evaluateSimpleExpression('2pow3'), expected: 8 },
    { name: '幂优先于乘: 2*3^2', actual: evaluateSimpleExpression('2*3pow2'), expected: 18 },
    { name: '幂优先于加: 2+3^2', actual: evaluateSimpleExpression('2+3pow2'), expected: 11 },
    { name: '连续幂: 2^3^2', actual: evaluateSimpleExpression('2pow3pow2'), expected: 64 },  // 左结合: (2^3)^2 = 8^2 = 64

    // 括号表达式
    { name: '括号: (2+5)', actual: evaluateExpression('(2+5)'), expected: 7 },
    { name: '括号乘法: (2+3)*4', actual: evaluateExpression('(2+3)*4'), expected: 20 },
    { name: '括号内幂: (2+1)^3', actual: evaluateExpression('(2+1)pow3'), expected: 27 },

    // 负数和小数
    { name: '负数: -5+3', actual: evaluateSimpleExpression('-5+3'), expected: -2 },
    { name: '小数: 1.5+2.5', actual: evaluateSimpleExpression('1.5+2.5'), expected: 4 },
    { name: '负数运算: -2*3', actual: evaluateSimpleExpression('-2*3'), expected: -6 },

    // 连续运算
    { name: '连续加: 1+2+3', actual: evaluateSimpleExpression('1+2+3'), expected: 6 },
    { name: '连续乘: 2*3*4', actual: evaluateSimpleExpression('2*3*4'), expected: 24 },

    // 混合复杂运算
    { name: '混合: 3+2^3+5*8', actual: evaluateSimpleExpression('3+2pow3+5*8'), expected: 51 },  // 应该是 3 + 8 + 40 = 51
    { name: '复杂优先级: 2+3*4-10/2', actual: evaluateSimpleExpression('2+3*4-10/2'), expected: 9 },
    { name: '括号幂: (3+2)^3', actual: evaluateExpression('(3+2)pow3'), expected: 125 },

    // 取模运算
    { name: '取模: 10%3', actual: evaluateSimpleExpression('10%3'), expected: 1 },
    { name: '乘除模: 10%3*2', actual: evaluateSimpleExpression('10%3*2'), expected: 2 },
];

let passed = 0;
let failed = 0;

console.log('=== 基础四则运算 ===');
for (let i = 0; i < 4; i++) {
    const t = tests[i];
    if (Math.abs(t.actual - t.expected) < 0.0001) {
        console.log(`✓ ${t.name}: ${t.actual}`);
        passed++;
    } else {
        console.log(`✗ ${t.name}: 实际=${t.actual}, 预期=${t.expected}`);
        failed++;
    }
}

console.log('\n=== 运算符优先级 ===');
for (let i = 4; i < 8; i++) {
    const t = tests[i];
    if (Math.abs(t.actual - t.expected) < 0.0001) {
        console.log(`✓ ${t.name}: ${t.actual}`);
        passed++;
    } else {
        console.log(`✗ ${t.name}: 实际=${t.actual}, 预期=${t.expected}`);
        failed++;
    }
}

console.log('\n=== 幂运算 ===');
for (let i = 8; i < 12; i++) {
    const t = tests[i];
    if (Math.abs(t.actual - t.expected) < 0.0001) {
        console.log(`✓ ${t.name}: ${t.actual}`);
        passed++;
    } else {
        console.log(`✗ ${t.name}: 实际=${t.actual}, 预期=${t.expected}`);
        failed++;
    }
}

console.log('\n=== 括号表达式 ===');
for (let i = 12; i < 15; i++) {
    const t = tests[i];
    if (Math.abs(t.actual - t.expected) < 0.0001) {
        console.log(`✓ ${t.name}: ${t.actual}`);
        passed++;
    } else {
        console.log(`✗ ${t.name}: 实际=${t.actual}, 预期=${t.expected}`);
        failed++;
    }
}

console.log('\n=== 负数和小数 ===');
for (let i = 15; i < 18; i++) {
    const t = tests[i];
    if (Math.abs(t.actual - t.expected) < 0.0001) {
        console.log(`✓ ${t.name}: ${t.actual}`);
        passed++;
    } else {
        console.log(`✗ ${t.name}: 实际=${t.actual}, 预期=${t.expected}`);
        failed++;
    }
}

console.log('\n=== 连续运算 ===');
for (let i = 18; i < 20; i++) {
    const t = tests[i];
    if (Math.abs(t.actual - t.expected) < 0.0001) {
        console.log(`✓ ${t.name}: ${t.actual}`);
        passed++;
    } else {
        console.log(`✗ ${t.name}: 实际=${t.actual}, 预期=${t.expected}`);
        failed++;
    }
}

console.log('\n=== 混合复杂运算 ===');
for (let i = 20; i < 23; i++) {
    const t = tests[i];
    if (Math.abs(t.actual - t.expected) < 0.0001) {
        console.log(`✓ ${t.name}: ${t.actual}`);
        passed++;
    } else {
        console.log(`✗ ${t.name}: 实际=${t.actual}, 预期=${t.expected}`);
        failed++;
    }
}

console.log('\n=== 取模运算 ===');
for (let i = 23; i < 24; i++) {
    const t = tests[i];
    if (Math.abs(t.actual - t.expected) < 0.0001) {
        console.log(`✓ ${t.name}: ${t.actual}`);
        passed++;
    } else {
        console.log(`✗ ${t.name}: 实际=${t.actual}, 预期=${t.expected}`);
        failed++;
    }
}

console.log('\n=== 测试结果 ===');
console.log(`通过: ${passed}, 失败: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
