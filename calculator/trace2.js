// 追踪括号问题
let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldResetDisplay = false;

function inputNumber(num) {
    console.log(`inputNumber('${num}'): START currentInput='${currentInput}'`);
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
            }
        }
        shouldResetDisplay = false;
        console.log(`inputNumber('${num}'): END currentInput='${currentInput}'`);
        return;
    }
    
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasUnclosedParens = openCount > closeCount;
    
    if (shouldResetDisplay) {
        if (hasUnclosedParens) {
            console.log(`  hasUnclosedParens=true, NOT resetting`);
        } else {
            currentInput = num;
            shouldResetDisplay = false;
            console.log(`inputNumber('${num}'): END currentInput='${currentInput}' [reset]`);
            return;
        }
    }
    
    if (currentInput === '0' && num !== '.') {
        currentInput = num;
    } else {
        currentInput += num;
    }
    console.log(`inputNumber('${num}'): END currentInput='${currentInput}'`);
}

function inputOperator(op) {
    let openCount = (currentInput.match(/\(/g) || []).length;
    let closeCount = (currentInput.match(/\)/g) || []).length;
    let hasUnclosedParens = openCount > closeCount;
    console.log(`inputOperator('${op}'): START currentInput='${currentInput}', hasUnclosedParens=${hasUnclosedParens}`);
    
    if (operator) {
        const fullExpr = previousInput + operator + currentInput;
        previousInput = fullExpr;
    } else {
        previousInput = currentInput;
    }
    operator = op;
    shouldResetDisplay = true;
    console.log(`inputOperator('${op}'): END currentInput='${currentInput}', previousInput='${previousInput}'`);
}

function calculate() {
    console.log(`calculate(): START currentInput='${currentInput}', previousInput='${previousInput}', operator='${operator}'`);
    if (operator) {
        const fullExpr = previousInput + operator + currentInput;
        console.log(`  fullExpr='${fullExpr}'`);
        let result = eval(fullExpr);
        console.log(`  result=${result}`);
        currentInput = result.toString();
        operator = null;
        previousInput = '';
    }
    console.log(`calculate(): END currentInput='${currentInput}'`);
}

console.log('=== (2+3)*4 ===');
inputNumber('(');
inputNumber('2');
inputOperator('+');
inputNumber('3');
inputNumber(')');
inputOperator('*');
inputNumber('4');
calculate();
console.log(`最终: ${currentInput}`);
