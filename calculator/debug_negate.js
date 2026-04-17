// 调试脚本
let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldResetDisplay = false;

function evaluateSimpleExpression(expr) {
    console.log('evaluateSimpleExpression: ' + expr);
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

    console.log('tokens:', JSON.stringify(tokens));

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

    console.log('result:', finalResult);
    return finalResult;
}

function evaluateExpression(expr) {
    let expression = expr.replace(/\s/g, '').replace(/\^/g, 'pow');
    console.log('evaluateExpression input: ' + expression);

    while (expression.includes('(')) {
        const openIndex = expression.lastIndexOf('(');
        const closeIndex = expression.indexOf(')', openIndex);
        if (closeIndex === -1) break;

        const innerExpr = expression.substring(openIndex + 1, closeIndex);
        const innerResult = evaluateSimpleExpression(innerExpr);
        expression = expression.substring(0, openIndex) + innerResult + expression.substring(closeIndex + 1);
        console.log('after inner calc: ' + expression);
    }

    return evaluateSimpleExpression(expression);
}

function inputNumber(num) {
    if (num === '(' || num === ')') {
        if (currentInput === '0') {
            currentInput = num;
        } else {
            currentInput += num;
        }
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
}

function inputOperator(op) {
    console.log('\n--- inputOperator ---');
    console.log('op:', op, 'currentInput:', currentInput, 'previousInput:', previousInput, 'operator:', operator);

    let hasParens = currentInput.includes('(') && currentInput.includes(')');
    let computedResult = null;

    if (hasParens) {
        const result = evaluateExpression(currentInput);
        if (!isNaN(result) && isFinite(result)) {
            computedResult = result;
            currentInput = result.toString();
            console.log('computedResult:', computedResult);
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
    console.log('after logic - previousInput:', previousInput, 'operator:', op);
    operator = op;
    shouldResetDisplay = true;
}

function calculate() {
    console.log('\n--- calculate ---');
    console.log('currentInput:', currentInput, 'previousInput:', previousInput, 'operator:', operator);

    let hasParens = currentInput.includes('(') && currentInput.includes(')');

    if (hasParens) {
        const result = evaluateExpression(currentInput);
        console.log('paren result:', result);
        if (!isNaN(result) && isFinite(result)) {
            currentInput = result.toString();
            console.log('final result:', currentInput);
            return;
        }
    }

    if (operator) {
        const fullExpr = previousInput + operator + currentInput;
        console.log('fullExpr:', fullExpr);
        const result = evaluateSimpleExpression(fullExpr);
        console.log('result:', result);
        if (!isNaN(result) && isFinite(result)) {
            currentInput = result.toString();
            console.log('final result:', currentInput);
            operator = null;
            previousInput = '';
            shouldResetDisplay = true;
            return;
        }
    }
}

function negate() {
    currentInput = (-parseFloat(currentInput)).toString();
    console.log('negate: currentInput =', currentInput);
}

// 测试 -5+3
console.log('\n\n========== 测试 -5+3 ==========');
inputOperator('negate');
inputNumber('5');
console.log('after 5:', currentInput);
inputOperator('+');
console.log('after +:', 'currentInput:', currentInput, 'previousInput:', previousInput);
inputNumber('3');
console.log('after 3:', currentInput);
calculate();
console.log('final:', currentInput);
