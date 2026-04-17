// 调试测试 - 模拟完整测试流程

let currentInput = '0';
let expression = '';
let shouldResetDisplay = false;

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
        console.log(`inputNumber('${num}'): currentInput = '${currentInput}'`);
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
    console.log(`inputNumber('${num}'): currentInput = '${currentInput}'`);
}

function inputOperator(op) {
    if (expression === '') {
        expression = currentInput;
    } else if (!shouldResetDisplay) {
        expression += currentInput;
    }
    expression += op;
    shouldResetDisplay = true;
    console.log(`inputOperator('${op}'): expression = '${expression}', shouldResetDisplay = ${shouldResetDisplay}`);
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

function scientificFunc(func) {
    console.log(`scientificFunc('${func}'): currentInput = '${currentInput}'`);
    console.log(`  includes '(': ${currentInput.includes('(')}`);
    console.log(`  includes ')': ${currentInput.includes(')')}`);

    if (currentInput.includes('(') && currentInput.includes(')')) {
        const result = evaluateExpression(currentInput);
        console.log(`  evaluated to: ${result}`);
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
        case 'sqrt': result = current >= 0 ? Math.sqrt(current) : NaN; break;
        default: return;
    }

    currentInput = result.toString();
    shouldResetDisplay = true;
    console.log(`  final result: ${currentInput}`);
}

// 模拟测试用例 [29] sin((2*30))=sin(60)
console.log('=== 模拟测试 [29] sin((2*30))=sin(60) ===');
clearAll();
inputNumber('(');
inputNumber('2');
inputOperator('*');
inputNumber('3');
inputNumber('0');
inputNumber(')');
scientificFunc('sin');
console.log('Final currentInput:', currentInput);
console.log('Expected: ~0.866');
console.log('');

// 模拟测试用例 [30] sqrt((4+12))=4
console.log('=== 模拟测试 [30] sqrt((4+12))=4 ===');
clearAll();
inputNumber('(');
inputNumber('4');
inputOperator('+');
inputNumber('1');
inputNumber('2');
inputNumber(')');
scientificFunc('sqrt');
console.log('Final currentInput:', currentInput);
console.log('Expected: 4');
