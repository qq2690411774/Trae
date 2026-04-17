// 测试脚本 - 基于 auto_test.html 中的测试用例
// 使用与 script.js 相同的实现

let currentInput = '0';
let expression = '';  // 累积的完整表达式
let shouldResetDisplay = false;

function formatDisplay(value) {
    if (value === 'Error' || value === 'Infinity' || value === '-Infinity') {
        return value;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
        return value;
    }
    if (value.includes('e')) {
        const exponent = parseInt(value.split('e')[1]);
        if (exponent === 0) {
            return parseFloat(value).toString();
        }
        if (exponent > 0 && exponent <= 6) {
            return num.toFixed(10).replace(/\.?0+$/, '');
        }
        if (exponent < 0 && exponent >= -6) {
            return num.toFixed(10).replace(/\.?0+$/, '');
        }
    }
    if (value.length > 12) {
        const absNum = Math.abs(num);
        if (absNum >= 1e7 || absNum < 1e-6) {
            return num.toExponential(6);
        } else {
            return num.toFixed(10).replace(/\.?0+$/, '');
        }
    }
    return value;
}

function clearAll() {
    currentInput = '0';
    expression = '';
    shouldResetDisplay = false;
}

function inputNumber(num) {
    if (currentInput === 'Error') {
        currentInput = '0';
    }

    if (num === '(' || num === ')') {
        if (shouldResetDisplay) {
            currentInput = num;
            shouldResetDisplay = false;
        } else if (currentInput === '0') {
            currentInput = num;
        } else {
            currentInput += num;
        }
        return;
    }

    // 检查当前是否在输入括号表达式（有左括号但没有右括号）
    let inParens = currentInput.includes('(') && !currentInput.includes(')');

    if (inParens) {
        // 如果在括号内，直接添加数字
        currentInput += num;
        return;
    }

    if (shouldResetDisplay) {
        currentInput = num;
        shouldResetDisplay = false;
    } else if (currentInput === '0' && num !== '0') {
        currentInput = num;
    } else if (currentInput === '0' && num === '0') {
        return;
    } else if (currentInput.replace(/[^0-9]/g, '').length < 12) {
        currentInput += num;
    }
}

function inputDot() {
    // 检查当前是否在输入括号表达式
    let inParens = currentInput.includes('(') && !currentInput.includes(')');

    if (inParens) {
        // 如果在括号内，检查最后一个数字是否已经有小数点
        let parts = currentInput.split(/[\+\-\*\/]/);
        let lastPart = parts[parts.length - 1];
        if (!lastPart.includes('.')) {
            currentInput += '.';
        }
        return;
    }

    if (shouldResetDisplay) {
        currentInput = '0.';
        shouldResetDisplay = false;
    } else if (!currentInput.includes('.')) {
        currentInput += '.';
    }
}

function evaluateSimpleExpression(expr) {
    expr = expr.replace(/\s/g, '');
    let tokens = [];
    let currentNum = '';
    let expectNumber = true;

    for (let i = 0; i < expr.length; i++) {
        const char = expr[i];
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

        if (char === ')') {
            if (currentNum !== '') {
                tokens.push({ type: 'number', value: parseFloat(currentNum) });
                currentNum = '';
            }
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

    // 处理幂运算 (左结合，如测试期望的 (2^3)^2 = 64)
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

    // 处理乘除
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

    // 处理加减
    let finalResult = numbers[0];
    for (let i = 0; i < operators.length; i++) {
        switch (operators[i]) {
            case '+': finalResult += numbers[i + 1]; break;
            case '-': finalResult -= numbers[i + 1]; break;
            case '%': finalResult %= numbers[i + 1]; break;
        }
    }

    return finalResult;
}

function evaluateExpression(expr) {
    let expression = expr.replace(/\s/g, '').replace(/\^/g, 'pow');

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

function inputOperator(op) {
    // 检查当前是否在输入括号表达式
    let inParens = currentInput.includes('(') && !currentInput.includes(')');

    if (inParens) {
        // 如果在括号内，直接将运算符添加到当前输入
        currentInput += op;
        return;
    }

    // 将当前输入添加到表达式中
    if (expression === '') {
        expression = currentInput;
    } else if (!shouldResetDisplay) {
        expression += currentInput;
    }

    // 添加运算符
    expression += op;
    shouldResetDisplay = true;
}

function calculate() {
    // 构建完整表达式
    let fullExpr;
    if (expression === '') {
        // 如果表达式为空，检查当前输入是否有括号
        if (currentInput.includes('(') && currentInput.includes(')')) {
            fullExpr = currentInput;
        } else {
            return; // 没有可计算的
        }
    } else {
        fullExpr = expression + currentInput;
    }

    const result = evaluateExpression(fullExpr);

    if (!isNaN(result) && isFinite(result)) {
        currentInput = result.toString();
        expression = '';
        shouldResetDisplay = true;
    } else {
        currentInput = 'Error';
        expression = '';
        shouldResetDisplay = true;
    }
}

function scientificFunc(func) {
    // 如果当前输入包含括号表达式，先计算它
    if (currentInput.includes('(') && currentInput.includes(')')) {
        const result = evaluateExpression(currentInput);
        if (!isNaN(result) && isFinite(result)) {
            currentInput = result.toString();
        } else {
            currentInput = 'Error';
            return;
        }
    }

    const current = parseFloat(currentInput);
    let result;

    if (currentInput === 'Error' || isNaN(current)) {
        return;
    }

    switch(func) {
        case 'sin': result = Math.sin(current * Math.PI / 180); break;
        case 'cos': result = Math.cos(current * Math.PI / 180); break;
        case 'tan': result = Math.tan(current * Math.PI / 180); break;
        case 'asin': result = Math.asin(current) * 180 / Math.PI; break;
        case 'acos': result = Math.acos(current) * 180 / Math.PI; break;
        case 'atan': result = Math.atan(current) * 180 / Math.PI; break;
        case 'sqrt': result = current >= 0 ? Math.sqrt(current) : NaN; break;
        case 'square': result = current * current; break;
        case 'cube': result = current * current * current; break;
        case 'log': result = Math.log10(current); break;
        case 'ln': result = Math.log(current); break;
        case 'abs': result = Math.abs(current); break;
        case 'inv': result = current !== 0 ? 1 / current : NaN; break;
        case 'factorial':
            if (current < 0 || !Number.isInteger(current)) { result = NaN; }
            else if (current <= 1) { result = 1; }
            else { result = 1; for(let i = 2; i <= current; i++) result *= i; }
            break;
        case 'pi': currentInput = '3.1415926536'; shouldResetDisplay = true; return;
        case 'e': currentInput = '2.71828182846'; shouldResetDisplay = true; return;
        case 'negate':
            if (currentInput === '0') {
                currentInput = '-';
                shouldResetDisplay = false;
            } else {
                currentInput = (-parseFloat(currentInput)).toString();
                shouldResetDisplay = true;
            }
            return;
        default: return;
    }

    currentInput = result.toString();
    shouldResetDisplay = true;
}

// 测试用例
const testCases = [
    // 基础四则运算
    { name: '2+5=7', fn: () => { inputNumber('2'); inputOperator('+'); inputNumber('5'); calculate(); }, expected: '7' },
    { name: '10-3=7', fn: () => { inputNumber('1'); inputNumber('0'); inputOperator('-'); inputNumber('3'); calculate(); }, expected: '7' },
    { name: '3*4=12', fn: () => { inputNumber('3'); inputOperator('*'); inputNumber('4'); calculate(); }, expected: '12' },
    { name: '10/2=5', fn: () => { inputNumber('1'); inputNumber('0'); inputOperator('/'); inputNumber('2'); calculate(); }, expected: '5' },

    // 运算符优先级
    { name: '2+3*4=14', fn: () => { inputNumber('2'); inputOperator('+'); inputNumber('3'); inputOperator('*'); inputNumber('4'); calculate(); }, expected: '14' },
    { name: '10-2*3=4', fn: () => { inputNumber('1'); inputNumber('0'); inputOperator('-'); inputNumber('2'); inputOperator('*'); inputNumber('3'); calculate(); }, expected: '4' },
    { name: '3+10/2=8', fn: () => { inputNumber('3'); inputOperator('+'); inputNumber('1'); inputNumber('0'); inputOperator('/'); inputNumber('2'); calculate(); }, expected: '8' },
    { name: '2*3/2=3', fn: () => { inputNumber('2'); inputOperator('*'); inputNumber('3'); inputOperator('/'); inputNumber('2'); calculate(); }, expected: '3' },

    // 幂运算
    { name: '2^3=8', fn: () => { inputNumber('2'); inputOperator('pow'); inputNumber('3'); calculate(); }, expected: '8' },
    { name: '2*3^2=18', fn: () => { inputNumber('2'); inputOperator('*'); inputNumber('3'); inputOperator('pow'); inputNumber('2'); calculate(); }, expected: '18' },
    { name: '2+3^2=11', fn: () => { inputNumber('2'); inputOperator('+'); inputNumber('3'); inputOperator('pow'); inputNumber('2'); calculate(); }, expected: '11' },
    { name: '2^3^2=64', fn: () => { inputNumber('2'); inputOperator('pow'); inputNumber('3'); inputOperator('pow'); inputNumber('2'); calculate(); }, expected: '64' },

    // 括号表达式
    { name: '(2+5)=7', fn: () => { inputNumber('('); inputNumber('2'); inputOperator('+'); inputNumber('5'); inputNumber(')'); calculate(); }, expected: '7' },
    { name: '(2+3)*4=20', fn: () => { inputNumber('('); inputNumber('2'); inputOperator('+'); inputNumber('3'); inputNumber(')'); inputOperator('*'); inputNumber('4'); calculate(); }, expected: '20' },
    { name: '(2+1)^3=27', fn: () => { inputNumber('('); inputNumber('2'); inputOperator('+'); inputNumber('1'); inputNumber(')'); inputOperator('pow'); inputNumber('3'); calculate(); }, expected: '27' },

    // 负数和小数
    { name: '-5+3=-2', fn: () => { scientificFunc('negate'); inputNumber('5'); inputOperator('+'); inputNumber('3'); calculate(); }, expected: '-2' },
    { name: '1.5+2.5=4', fn: () => { inputNumber('1'); inputDot(); inputNumber('5'); inputOperator('+'); inputNumber('2'); inputDot(); inputNumber('5'); calculate(); }, expected: '4' },

    // 混合复杂
    { name: '3+2^3+5*8=51', fn: () => { inputNumber('3'); inputOperator('+'); inputNumber('2'); inputOperator('pow'); inputNumber('3'); inputOperator('+'); inputNumber('5'); inputOperator('*'); inputNumber('8'); calculate(); }, expected: '51' },
    { name: '(3+2)^3=125', fn: () => { inputNumber('('); inputNumber('3'); inputOperator('+'); inputNumber('2'); inputNumber(')'); inputOperator('pow'); inputNumber('3'); calculate(); }, expected: '125' },

    // 科学函数
    { name: 'sin(30)=0.5', fn: () => { inputNumber('3'); inputNumber('0'); scientificFunc('sin'); }, expected: '0.5' },
    { name: 'cos(60)=0.5', fn: () => { inputNumber('6'); inputNumber('0'); scientificFunc('cos'); }, expected: '0.5' },
    { name: 'tan(45)=1', fn: () => { inputNumber('4'); inputNumber('5'); scientificFunc('tan'); }, expected: '1' },
    { name: 'asin(0.5)=30', fn: () => { inputNumber('0.5'); scientificFunc('asin'); }, expected: '30' },
    { name: 'sqrt(16)=4', fn: () => { inputNumber('1'); inputNumber('6'); scientificFunc('sqrt'); }, expected: '4' },
    { name: 'sqrt(2)=1.414', fn: () => { inputNumber('2'); scientificFunc('sqrt'); }, expected: '1.41421356237' },
    { name: 'square(4)=16', fn: () => { inputNumber('4'); scientificFunc('square'); }, expected: '16' },
    { name: 'log(100)=2', fn: () => { inputNumber('1'); inputNumber('0'); inputNumber('0'); scientificFunc('log'); }, expected: '2' },
    { name: 'factorial(5)=120', fn: () => { inputNumber('5'); scientificFunc('factorial'); }, expected: '120' },

    // 括号+科学函数组合
    { name: 'sin((2*30))=sin(60)', fn: () => { inputNumber('('); inputNumber('2'); inputOperator('*'); inputNumber('3'); inputNumber('0'); inputNumber(')'); scientificFunc('sin'); }, expected: '0.86602540378' },
    { name: 'sqrt((4+12))=4', fn: () => { inputNumber('('); inputNumber('4'); inputOperator('+'); inputNumber('1'); inputNumber('2'); inputNumber(')'); scientificFunc('sqrt'); }, expected: '4' },
    { name: '(3+4)^2=49', fn: () => { inputNumber('('); inputNumber('3'); inputOperator('+'); inputNumber('4'); inputNumber(')'); inputOperator('pow'); inputNumber('2'); calculate(); }, expected: '49' },

    // 复杂嵌套括号表达式
    { name: '(2+3*2)*(5-2*2)=8', fn: () => { inputNumber('('); inputNumber('2'); inputOperator('+'); inputNumber('3'); inputOperator('*'); inputNumber('2'); inputNumber(')'); inputOperator('*'); inputNumber('('); inputNumber('5'); inputOperator('-'); inputNumber('2'); inputOperator('*'); inputNumber('2'); inputNumber(')'); calculate(); }, expected: '8' },
];

// 运行测试
function runAllTests() {
    let passed = 0;
    let failed = 0;
    const failedTests = [];

    console.log('='.repeat(80));
    console.log('计算器自动测试 - 共 ' + testCases.length + ' 个测试');
    console.log('='.repeat(80));

    testCases.forEach((test, i) => {
        clearAll();
        test.fn();

        let display = currentInput;
        let expected = test.expected;
        let actual = parseFloat(display);
        let exp = parseFloat(expected);
        let success = Math.abs(actual - exp) < 0.0001;

        if (success) {
            passed++;
            console.log(`✓ PASS [${i+1}] ${test.name}`);
        } else {
            failed++;
            console.log(`✗ FAIL [${i+1}] ${test.name}`);
            console.log(`   期望值: ${expected}`);
            console.log(`   实际值: ${display}`);
            failedTests.push({
                index: i+1,
                name: test.name,
                expected: expected,
                actual: display
            });
        }
    });

    console.log('='.repeat(80));
    console.log(`测试结果: 通过 ${passed}/${testCases.length}, 失败 ${failed}`);
    console.log('='.repeat(80));

    if (failed > 0) {
        console.log('\n失败的测试详情:');
        failedTests.forEach(t => {
            console.log(`  [${t.index}] ${t.name}: 期望 ${t.expected}, 实际 ${t.actual}`);
        });
    }

    return { passed, failed, total: testCases.length, failedTests };
}

// 导出函数以便外部调用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testCases };
}

// 如果直接运行此文件
if (require.main === module) {
    runAllTests();
}
