// 测试脚本 - 追踪每一步
let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldResetDisplay = false;
let waitingForPowerOperand = false;
let powerOperand = null;

function formatDisplay(value) { return value; }

function inputNumber(num) {
    console.log(`inputNumber('${num}'): before='${currentInput}'`);
    if (num === '(' || num === ')') {
        if (num === '(') {
            if (currentInput === '0') {
                currentInput = '(';
            } else {
                currentInput += '(';
            }
        } else {
            let openCount = (currentInput.match(/\(/g) || []).length;
            let closeCount = (currentInput.match(/\)/g) || []).length;
            if (openCount > closeCount) {
                currentInput += ')';
            }
        }
        shouldResetDisplay = false;
        console.log(`inputNumber('${num}'): after='${currentInput}' [parens]`);
        return;
    }
    
    if (shouldResetDisplay) {
        currentInput = num;
        shouldResetDisplay = false;
    } else {
        if (currentInput === '0' && num !== '.') {
            currentInput = num;
        } else {
            currentInput += num;
        }
    }
    console.log(`inputNumber('${num}'): after='${currentInput}'`);
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
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasUnclosedParens = openCount > closeCount;
    let computedResult = null;
    
    console.log(`inputOperator('${op}'): before='${currentInput}', hasUnclosedParens=${hasUnclosedParens}, open=${openCount}, close=${closeCount}`);
    
    if (hasUnclosedParens) {
        const result = evaluateExpression(currentInput);
        console.log(`  evaluateExpression('${currentInput}') = ${result}`);
        if (!isNaN(result) && isFinite(result)) {
            computedResult = result;
            currentInput = result.toString();
        }
    }
    
    if (operator) {
        if (computedResult !== null) {
            previousInput = computedResult.toString();
        } else {
            const fullExpr = previousInput + operator + currentInput;
            previousInput = fullExpr;
        }
    } else {
        previousInput = currentInput;
    }
    operator = op;
    shouldResetDisplay = true;
    waitingForPowerOperand = (op === 'pow');
    powerOperand = null;
    console.log(`inputOperator('${op}'): after currentInput='${currentInput}', previous='${previousInput}'`);
}

function calculate() {
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasUnclosedParens = openCount > closeCount;
    
    console.log(`calculate(): currentInput='${currentInput}', hasUnclosedParens=${hasUnclosedParens}`);
    
    if (hasUnclosedParens) {
        const result = evaluateExpression(currentInput);
        console.log(`  evaluateExpression('${currentInput}') = ${result}`);
        if (!isNaN(result) && isFinite(result)) {
            currentInput = result.toString();
            return;
        }
    }
    
    if (operator) {
        const fullExpr = previousInput + operator + currentInput;
        console.log(`  fullExpr = '${fullExpr}'`);
        const result = evaluateSimpleExpression(fullExpr);
        console.log(`  evaluateSimpleExpression = ${result}`);
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

// 手动追踪测试用例
console.log('=== 测试: (2+3)*4 ===');
clearAll();
inputNumber('(');
inputNumber('2');
inputOperator('+');
inputNumber('3');
inputNumber(')');
inputOperator('*');
inputNumber('4');
calculate();
console.log(`最终结果: ${currentInput}`);
