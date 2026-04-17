// 追踪 (2+5) 问题
let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldResetDisplay = false;

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

function inputNumber(num) {
    console.log(`inputNumber('${num}'): START currentInput='${currentInput}', shouldResetDisplay=${shouldResetDisplay}`);
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
            console.log(`  ) case: open=${openCount}, close=${closeCount}`);
            if (openCount > closeCount) {
                currentInput += ')';
            } else {
                // 如果当前没有未闭合括号，检查 previousInput 是否有
                let prevOpenCount = (previousInput.match(/\(/g) || []).length;
                let prevCloseCount = (previousInput.match(/\)/g) || []).length;
                console.log(`  ) case: previousInput has unclosed? open=${prevOpenCount}, close=${prevCloseCount}`);
                if (prevOpenCount > prevCloseCount && operator) {
                    // 需要合并 previousInput 和 currentInput
                    currentInput = previousInput + currentInput + ')';
                    previousInput = '';
                    operator = null;
                } else {
                    currentInput += ')';
                }
            }
        }
        shouldResetDisplay = false;
        console.log(`inputNumber('${num}'): END currentInput='${currentInput}'`);
        return;
    }
    
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasUnclosedParens = openCount > closeCount;
    
    if (shouldResetDisplay && !hasUnclosedParens) {
        currentInput = num;
        shouldResetDisplay = false;
    } else {
        if (currentInput === '0' && num !== '.') {
            currentInput = num;
        } else {
            currentInput += num;
        }
    }
    console.log(`inputNumber('${num}'): END currentInput='${currentInput}'`);
}

function inputOperator(op) {
    console.log(`inputOperator('${op}'): currentInput='${currentInput}', previousInput='${previousInput}', operator='${operator}'`);
    
    if (operator) {
        const fullExpr = previousInput + operator + currentInput;
        previousInput = fullExpr;
    } else {
        previousInput = currentInput;
    }
    
    operator = op;
    shouldResetDisplay = true;
    console.log(`inputOperator('${op}'): END previousInput='${previousInput}', operator='${operator}'`);
}

function calculate() {
    console.log(`calculate(): currentInput='${currentInput}', previousInput='${previousInput}', operator='${operator}'`);
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasUnclosedParens = openCount > closeCount;
    
    if (hasUnclosedParens) {
        const result = evaluateExpression(currentInput);
        if (!isNaN(result) && isFinite(result)) {
            currentInput = result.toString();
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

console.log('=== (2+5) ===');
inputNumber('(');
inputNumber('2');
inputOperator('+');
inputNumber('5');
inputNumber(')');
calculate();
console.log(`最终结果: ${currentInput}`);
