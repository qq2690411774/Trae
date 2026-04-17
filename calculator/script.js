let currentInput = '0';
let expression = '';  // 累积的完整表达式
let shouldResetDisplay = false;
let currentMode = 'basic';

const resultDisplay = document.getElementById('result');
const historyDisplay = document.getElementById('history');

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

function updateDisplay() {
    let displayValue = formatDisplay(currentInput);
    resultDisplay.textContent = displayValue;
}

function updateHistory() {
    historyDisplay.textContent = expression;
}

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('basicMode').classList.toggle('active', mode === 'basic');
    document.getElementById('scientificMode').classList.toggle('active', mode === 'scientific');
    document.getElementById('basicButtons').style.display = mode === 'basic' ? 'grid' : 'none';
    document.getElementById('scientificButtons').style.display = mode === 'scientific' ? 'grid' : 'none';
    clearAll();
}

function inputNumber(num) {
    if (currentInput === 'Error') {
        currentInput = '0';
    }

    if (num === '(' || num === ')') {
        if (num === '(') {
            if (shouldResetDisplay) {
                currentInput = '(';
                shouldResetDisplay = false;
            } else if (currentInput === '0') {
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
        updateDisplay();
        return;
    }

    // 检查当前是否在输入括号表达式（有左括号但没有右括号）
    let inParens = currentInput.includes('(') && !currentInput.includes(')');

    if (inParens) {
        // 如果在括号内，直接添加数字
        currentInput += num;
        updateDisplay();
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
    } else if (currentInput === '0' && num !== '0') {
        currentInput = num;
    } else if (currentInput === '-0' && num !== '0') {
        currentInput = '-' + num;
    } else if (currentInput.replace(/[^0-9]/g, '').length < 12) {
        currentInput += num;
    }
    updateDisplay();
}

function inputDot() {
    if (shouldResetDisplay) {
        currentInput = '0.';
        shouldResetDisplay = false;
    } else if (!currentInput.includes('.')) {
        currentInput += '.';
    }
    updateDisplay();
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
        updateDisplay();
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
    updateHistory();
}

function calculate() {
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasBalancedParens = openCount > 0 && openCount === closeCount;
    
    let fullExpr;
    if (hasBalancedParens) {
        fullExpr = currentInput;
    } else if (expression === '') {
        return;
    } else {
        fullExpr = expression + currentInput;
    }

    const result = evaluateExpression(fullExpr);

    if (!isNaN(result) && isFinite(result)) {
        historyDisplay.textContent = fullExpr + ' =';
        currentInput = result.toString();
        expression = '';
        shouldResetDisplay = true;
        updateDisplay();
    } else {
        currentInput = 'Error';
        expression = '';
        shouldResetDisplay = true;
        updateDisplay();
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
            updateDisplay();
            return;
        }
    }

    const current = parseFloat(currentInput);
    let result;

    if (currentInput === 'Error' || isNaN(current)) {
        return;
    }

    switch (func) {
        case 'sin':
            result = Math.sin(current * Math.PI / 180);
            break;
        case 'cos':
            result = Math.cos(current * Math.PI / 180);
            break;
        case 'tan':
            if (Math.abs(current % 180) === 90) {
                currentInput = 'Error';
                updateDisplay();
                return;
            }
            result = Math.tan(current * Math.PI / 180);
            break;
        case 'asin':
            result = Math.asin(current) * 180 / Math.PI;
            break;
        case 'acos':
            if (current < -1 || current > 1) {
                currentInput = 'Error';
                updateDisplay();
                return;
            }
            result = Math.acos(current) * 180 / Math.PI;
            break;
        case 'atan':
            result = Math.atan(current) * 180 / Math.PI;
            break;
        case 'log':
            if (current <= 0) {
                currentInput = 'Error';
                updateDisplay();
                return;
            }
            result = Math.log10(current);
            break;
        case 'ln':
            if (current <= 0) {
                currentInput = 'Error';
                updateDisplay();
                return;
            }
            result = Math.log(current);
            break;
        case 'sqrt':
            if (current < 0) {
                currentInput = 'Error';
                updateDisplay();
                return;
            }
            result = Math.sqrt(current);
            break;
        case 'square':
            result = current * current;
            break;
        case 'cube':
            result = current * current * current;
            break;
        case 'pow':
            inputOperator('pow');
            return;
        case 'pi':
            currentInput = Math.PI.toString();
            shouldResetDisplay = true;
            updateDisplay();
            return;
        case 'e':
            currentInput = Math.E.toString();
            shouldResetDisplay = true;
            updateDisplay();
            return;
        case 'factorial':
            if (current < 0 || !Number.isInteger(current)) {
                currentInput = 'Error';
                updateDisplay();
                return;
            }
            if (current > 170) {
                currentInput = 'Infinity';
                updateDisplay();
                return;
            }
            result = 1;
            for (let i = 2; i <= current; i++) {
                result *= i;
            }
            break;
        case 'abs':
            result = Math.abs(current);
            break;
        case 'inv':
            if (current === 0) {
                currentInput = 'Error';
                updateDisplay();
                return;
            }
            result = 1 / current;
            break;
        case 'negate':
            if (currentInput === '0') {
                currentInput = '-0';
                shouldResetDisplay = false;
            } else if (currentInput === '-0') {
                currentInput = '0';
            } else {
                currentInput = (-parseFloat(currentInput)).toString();
            }
            updateDisplay();
            return;
        default:
            return;
    }

    historyDisplay.textContent = `${func}(${currentInput}) =`;
    currentInput = result.toString();
    shouldResetDisplay = true;
    updateDisplay();
}

function clearAll() {
    currentInput = '0';
    expression = '';
    shouldResetDisplay = false;
    historyDisplay.textContent = '';
    updateDisplay();
}

function deleteLast() {
    if (shouldResetDisplay) {
        return;
    }
    if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
        currentInput = '0';
    } else {
        currentInput = currentInput.slice(0, -1);
    }
    updateDisplay();
}

document.addEventListener('keydown', function(event) {
    const key = event.key;
    if (key >= '0' && key <= '9') {
        inputNumber(key);
    } else if (key === '.') {
        inputDot();
    } else if (key === '+') {
        inputOperator('+');
    } else if (key === '-') {
        inputOperator('-');
    } else if (key === '*') {
        inputOperator('*');
    } else if (key === '/') {
        event.preventDefault();
        inputOperator('/');
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
    } else if (key === 'Escape') {
        clearAll();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === '%') {
        inputOperator('%');
    } else if (key === '(') {
        inputNumber('(');
    } else if (key === ')') {
        inputNumber(')');
    }
});
