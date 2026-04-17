// 测试脚本 - 简化版
let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldResetDisplay = false;
let waitingForPowerOperand = false;
let powerOperand = null;

function inputNumber(num) {
    if (num === '(' || num === ')') {
        if (num === '(') {
            if (currentInput === '0') {
                currentInput = '(';
            } else {
                currentInput += '(';
            }
        } else {
            currentInput += ')';
        }
        shouldResetDisplay = false;
        return;
    }
    
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasUnclosedParens = openCount > closeCount;
    
    if (shouldResetDisplay && !hasUnclosedParens) {
        if (currentInput === '-0') {
            currentInput = '-' + num;
        } else {
            currentInput = num;
        }
        shouldResetDisplay = false;
    } else {
        if (currentInput === '0' && num !== '.') {
            currentInput = num;
        } else if (currentInput === '-0' && num !== '.') {
            currentInput = '-' + num;
        } else {
            currentInput += num;
        }
    }
}

function inputDot() {
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
    
    for (let i = 0; i < operators.length; i++) {
        if (operators[i] === '*' || operators[i] === '/') {
            let a = numbers[i];
            let b = numbers[i + 1];
            let result = operators[i] === '*' ? a * b : (b === 0 ? NaN : a / b);
            numbers[i] = result;
            numbers.splice(i + 1, 1);
            operators.splice(i, 1);
            i--;
        }
    }
    
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
    // 检查是否有完整闭合的括号表达式
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasBalancedParens = openCount > 0 && openCount === closeCount;
    let hasUnclosedParens = openCount > closeCount;
    
    if (hasBalancedParens) {
        // 有完整闭合的括号表达式，先评估
        const result = evaluateExpression(currentInput);
        if (!isNaN(result) && isFinite(result)) {
            currentInput = result.toString();
        }
    } else if (hasUnclosedParens) {
        // 有未闭合括号，把操作符追加到 currentInput
        currentInput += op;
        
        operator = op;
        shouldResetDisplay = false;
        waitingForPowerOperand = (op === 'pow');
        powerOperand = null;
        return;
    }
    
    if (operator) {
        previousInput = previousInput + operator + currentInput;
    } else {
        previousInput = currentInput;
    }
    
    operator = op;
    shouldResetDisplay = true;
    waitingForPowerOperand = (op === 'pow');
    powerOperand = null;
}

function calculate() {
    // 首先检查 currentInput 中是否有完整的括号表达式需要评估
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasBalancedParens = openCount > 0 && openCount === closeCount;
    
    // 如果有完整闭合的括号表达式在 currentInput 中
    if (hasBalancedParens) {
        const result = evaluateExpression(currentInput);
        if (!isNaN(result) && isFinite(result)) {
            currentInput = result.toString();
            operator = null;
            previousInput = '';
            shouldResetDisplay = true;
            return;
        }
    }
    
    if (operator) {
        const fullExpr = previousInput + operator + currentInput;
        const result = evaluateSimpleExpression(fullExpr);
        if (!isNaN(result) && isFinite(result)) {
            currentInput = result.toString();
            operator = null;
            previousInput = '';
            shouldResetDisplay = true;
            return;
        }
    }
}

function scientificFunc(func) {
    if ((currentInput.includes('(') || currentInput.includes(')')) && currentInput.includes(')') && currentInput.includes('(')) {
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
        case 'negate': 
            currentInput = current === 0 ? '-0' : (-current).toString();
            shouldResetDisplay = true;
            return;
        default: return;
    }
    
    currentInput = result.toString();
    shouldResetDisplay = true;
}

function clearAll() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldResetDisplay = false;
    waitingForPowerOperand = false;
    powerOperand = null;
}

function runTest(name, fn, expected) {
    clearAll();
    fn();
    let actual = parseFloat(currentInput);
    let exp = parseFloat(expected);
    let success = Math.abs(actual - exp) < 0.0001;
    console.log(`${success ? '✓' : '✗'} ${name}: expected=${expected}, actual=${currentInput}`);
    return success;
}

console.log('=== 测试开始 ===\n');

let tests = [
    { name: '2+5=7', fn: () => { inputNumber('2'); inputOperator('+'); inputNumber('5'); calculate(); }, expected: '7' },
    { name: '10-3=7', fn: () => { inputNumber('1'); inputNumber('0'); inputOperator('-'); inputNumber('3'); calculate(); }, expected: '7' },
    { name: '3*4=12', fn: () => { inputNumber('3'); inputOperator('*'); inputNumber('4'); calculate(); }, expected: '12' },
    { name: '10/2=5', fn: () => { inputNumber('1'); inputNumber('0'); inputOperator('/'); inputNumber('2'); calculate(); }, expected: '5' },
    { name: '2+3*4=14', fn: () => { inputNumber('2'); inputOperator('+'); inputNumber('3'); inputOperator('*'); inputNumber('4'); calculate(); }, expected: '14' },
    { name: '10-2*3=4', fn: () => { inputNumber('1'); inputNumber('0'); inputOperator('-'); inputNumber('2'); inputOperator('*'); inputNumber('3'); calculate(); }, expected: '4' },
    { name: '3+10/2=8', fn: () => { inputNumber('3'); inputOperator('+'); inputNumber('1'); inputNumber('0'); inputOperator('/'); inputNumber('2'); calculate(); }, expected: '8' },
    { name: '2*3/2=3', fn: () => { inputNumber('2'); inputOperator('*'); inputNumber('3'); inputOperator('/'); inputNumber('2'); calculate(); }, expected: '3' },
    { name: '2^3=8', fn: () => { inputNumber('2'); inputOperator('pow'); inputNumber('3'); calculate(); }, expected: '8' },
    { name: '2*3^2=18', fn: () => { inputNumber('2'); inputOperator('*'); inputNumber('3'); inputOperator('pow'); inputNumber('2'); calculate(); }, expected: '18' },
    { name: '2+3^2=11', fn: () => { inputNumber('2'); inputOperator('+'); inputNumber('3'); inputOperator('pow'); inputNumber('2'); calculate(); }, expected: '11' },
    { name: '2^3^2=64', fn: () => { inputNumber('2'); inputOperator('pow'); inputNumber('3'); inputOperator('pow'); inputNumber('2'); calculate(); }, expected: '64' },
    { name: '(2+5)=7', fn: () => { inputNumber('('); inputNumber('2'); inputOperator('+'); inputNumber('5'); inputNumber(')'); calculate(); }, expected: '7' },
    { name: '(2+3)*4=20', fn: () => { inputNumber('('); inputNumber('2'); inputOperator('+'); inputNumber('3'); inputNumber(')'); inputOperator('*'); inputNumber('4'); calculate(); }, expected: '20' },
    { name: '(2+1)^3=27', fn: () => { inputNumber('('); inputNumber('2'); inputOperator('+'); inputNumber('1'); inputNumber(')'); inputOperator('pow'); inputNumber('3'); calculate(); }, expected: '27' },
    { name: '-5+3=-2', fn: () => { scientificFunc('negate'); inputNumber('5'); inputOperator('+'); inputNumber('3'); calculate(); }, expected: '-2' },
    { name: '1.5+2.5=4', fn: () => { inputNumber('1'); inputDot(); inputNumber('5'); inputOperator('+'); inputNumber('2'); inputDot(); inputNumber('5'); calculate(); }, expected: '4' },
    { name: '3+2^3+5*8=51', fn: () => { inputNumber('3'); inputOperator('+'); inputNumber('2'); inputOperator('pow'); inputNumber('3'); inputOperator('+'); inputNumber('5'); inputOperator('*'); inputNumber('8'); calculate(); }, expected: '51' },
    { name: '(3+2)^3=125', fn: () => { inputNumber('('); inputNumber('3'); inputOperator('+'); inputNumber('2'); inputNumber(')'); inputOperator('pow'); inputNumber('3'); calculate(); }, expected: '125' },
    { name: 'sin(30)=0.5', fn: () => { inputNumber('3'); inputNumber('0'); scientificFunc('sin'); }, expected: '0.5' },
    { name: 'cos(60)=0.5', fn: () => { inputNumber('6'); inputNumber('0'); scientificFunc('cos'); }, expected: '0.5' },
    { name: 'tan(45)=1', fn: () => { inputNumber('4'); inputNumber('5'); scientificFunc('tan'); }, expected: '1' },
    { name: 'asin(0.5)=30', fn: () => { inputNumber('0.5'); scientificFunc('asin'); }, expected: '30' },
    { name: 'sqrt(16)=4', fn: () => { inputNumber('1'); inputNumber('6'); scientificFunc('sqrt'); }, expected: '4' },
    { name: 'sqrt(2)=1.414', fn: () => { inputNumber('2'); scientificFunc('sqrt'); }, expected: '1.41421356237' },
    { name: 'square(4)=16', fn: () => { inputNumber('4'); scientificFunc('square'); }, expected: '16' },
    { name: 'log(100)=2', fn: () => { inputNumber('1'); inputNumber('0'); inputNumber('0'); scientificFunc('log'); }, expected: '2' },
    { name: 'factorial(5)=120', fn: () => { inputNumber('5'); scientificFunc('factorial'); }, expected: '120' },
    { name: 'sin((2*30))=sin(60)', fn: () => { inputNumber('('); inputNumber('2'); inputOperator('*'); inputNumber('3'); inputNumber('0'); inputNumber(')'); scientificFunc('sin'); }, expected: '0.86602540378' },
    { name: 'sqrt((4+12))=4', fn: () => { inputNumber('('); inputNumber('4'); inputOperator('+'); inputNumber('1'); inputNumber('2'); inputNumber(')'); scientificFunc('sqrt'); }, expected: '4' },
    { name: '(3+4)^2=49', fn: () => { inputNumber('('); inputNumber('3'); inputOperator('+'); inputNumber('4'); inputNumber(')'); inputOperator('pow'); inputNumber('2'); calculate(); }, expected: '49' },
];

let passed = 0, failed = 0;
tests.forEach(t => {
    if (runTest(t.name, t.fn, t.expected)) {
        passed++;
    } else {
        failed++;
    }
});

console.log(`\n=== 测试结果: 通过 ${passed}/${tests.length}, 失败 ${failed} ===`);
