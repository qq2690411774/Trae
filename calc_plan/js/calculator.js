class Calculator {
    constructor() {
        this.engine = new CalculatorEngine();
        this.display = new DisplayManager();
        this.buttonHandler = new ButtonHandler(this);

        this.shiftMode = false;
        this.alphaMode = false;
        this.waitingForVariable = false;
        this.lastOperator = null;

        this.init();
    }

    init() {
        this.display.clear();
        this.updateModeIndicator();

        console.log('Calculator initialized');
    }

    inputDigit(digit) {
        if (this.waitingForVariable) return;

        this.display.clearError();
        this.display.appendValue(digit);
    }

    inputOperator(operator) {
        if (this.waitingForVariable) return;

        this.display.clearError();

        const currentInput = this.display.getCurrentInput();
        const currentExpression = this.display.currentExpression;

        if (operator === '!' && currentInput !== '0') {
            const expr = currentInput + '!';
            try {
                const result = this.engine.evaluate(expr);
                this.display.setResult(result);
                this.engine.setLastAnswer(parseFloat(result));
            } catch (e) {
                this.display.showError(e.message);
            }
            return;
        }

        if (operator === '^2' || operator === '^3') {
            const base = currentInput;
            const exp = operator.replace('^', '');
            const expr = `${base}^${exp}`;
            try {
                const result = this.engine.evaluate(expr);
                this.display.setResult(result);
                this.engine.setLastAnswer(parseFloat(result));
            } catch (e) {
                this.display.showError(e.message);
            }
            return;
        }

        // 处理负号的特殊情况
        if (operator === '-' && (currentInput === '0' || currentInput === '')) {
            this.display.currentInput = '-';
            this.display.updateDisplay();
            return;
        }

        if (currentInput !== '0' || currentInput === '0.') {
            this.display.setExpression(currentExpression + currentInput + operator);
            this.display.currentInput = '';
        } else if (currentExpression) {
            this.display.setExpression(currentExpression.slice(0, -1) + operator);
        }
        this.display.updateDisplay();
    }

    inputFunction(funcName) {
        if (this.waitingForVariable) return;

        this.display.clearError();

        const currentInput = this.display.getCurrentInput();
        const currentExpression = this.display.currentExpression;
        
        let funcExpr = '';

        switch (funcName) {
            case 'sin':
                funcExpr = 'sin(';
                break;
            case 'cos':
                funcExpr = 'cos(';
                break;
            case 'tan':
                funcExpr = 'tan(';
                break;
            case 'asin':
                funcExpr = 'asin(';
                break;
            case 'acos':
                funcExpr = 'acos(';
                break;
            case 'atan':
                funcExpr = 'atan(';
                break;
            case 'log':
                funcExpr = 'log(';
                break;
            case 'ln':
                funcExpr = 'ln(';
                break;
            case 'sqrt':
                funcExpr = 'sqrt(';
                break;
            default:
                funcExpr = funcName + '(';
        }

        if (currentInput !== '0' || currentInput === '0.') {
            // 如果当前有输入，将其作为函数参数
            this.display.setExpression(currentExpression + currentInput + funcExpr);
            this.display.currentInput = '';
        } else {
            // 如果当前没有输入，直接添加函数
            this.display.setExpression(currentExpression + funcExpr);
            // 保持 currentInput 为 '0'，这样用户可以直接输入数字作为参数
        }
        this.display.updateDisplay();
    }

    inputParenthesis(paren) {
        if (this.waitingForVariable) return;

        this.display.clearError();

        const currentInput = this.display.getCurrentInput();
        const currentExpression = this.display.currentExpression;

        if (paren === '(') {
            // 如果当前有输入，先将其添加到表达式中
            if (currentInput !== '0' || currentInput === '0.') {
                this.display.setExpression(currentExpression + currentInput + '(');
                this.display.currentInput = '';
            } else {
                // 如果当前没有输入，直接添加左括号到表达式
                this.display.setExpression(currentExpression + '(');
            }
        } else if (paren === ')') {
            // 右括号总是添加到表达式中
            // 即使 currentInput 是 '0'，也要添加，因为用户可能刚输入了 0
            if (currentInput !== '0' || currentInput === '0.' || currentExpression.endsWith('(')) {
                this.display.setExpression(currentExpression + currentInput + ')');
                this.display.currentInput = '';
            } else {
                this.display.setExpression(currentExpression + ')');
            }
        }

        this.display.updateDisplay();
    }

    inputConstant(constant) {
        if (this.waitingForVariable) return;

        this.display.clearError();

        let value = '';
        switch (constant) {
            case 'π':
                value = String(Math.PI).slice(0, 7);
                break;
            case 'Ans':
                value = String(this.engine.lastAnswer || 0);
                break;
            default:
                value = constant;
        }

        this.display.appendValue(value);
    }

    inputScientificNotation() {
        if (this.waitingForVariable) return;

        this.display.clearError();
        const current = this.display.getCurrentInput();
        if (current && !current.includes('e')) {
            this.display.appendValue('e');
        }
    }

    calculate() {
        if (this.waitingForVariable) return;

        try {
            const expression = this.display.getFullExpression();

            if (!expression || expression === '0') {
                return;
            }

            console.log('Evaluating:', expression);

            const result = this.engine.evaluate(expression);

            this.display.setExpression(expression + '=');
            this.display.setResult(result);

            this.engine.setLastAnswer(parseFloat(result));

            this.display.blink();

        } catch (error) {
            console.error('Calculation error:', error);
            this.display.showError(error.message || 'Error');
        }
    }

    allClear() {
        this.shiftMode = false;
        this.alphaMode = false;
        this.waitingForVariable = false;
        this.display.clear();
        this.updateModeIndicator();
        this.clearShiftAlphaButtons();
    }

    deleteLast() {
        if (this.waitingForVariable) return;

        this.display.clearError();
        this.display.clearEntry();
    }

    toggleShift() {
        this.shiftMode = !this.shiftMode;
        this.alphaMode = false;
        this.updateModeIndicator();
        this.toggleButtonState('.btn-shift', this.shiftMode);
        this.toggleButtonState('.btn-alpha', false);
    }

    toggleAlpha() {
        this.alphaMode = !this.alphaMode;
        this.shiftMode = false;
        this.updateModeIndicator();
        this.toggleButtonState('.btn-alpha', this.alphaMode);
        this.toggleButtonState('.btn-shift', false);
    }

    storeVariable() {
        this.waitingForVariable = true;
        this.display.setModeIndicator('STO?');
    }

    recallVariable() {
        this.waitingForVariable = true;
        this.display.setModeIndicator('RCL?');
    }

    memoryPlus() {
        try {
            const currentValue = parseFloat(this.display.getCurrentInput()) || 0;
            this.engine.addMemory(currentValue);
            this.display.setModeIndicator('M+');
            setTimeout(() => this.updateModeIndicator(), 1000);
        } catch (e) {
            this.display.showError(e.message);
        }
    }

    updateModeIndicator() {
        let modes = [];
        if (this.shiftMode) modes.push('S');
        if (this.alphaMode) modes.push('A');
        modes.push(this.engine.angleMode);

        this.display.setModeIndicator(modes.join(' '));
    }

    toggleButtonState(selector, active) {
        document.querySelectorAll(selector).forEach(btn => {
            if (active) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    clearShiftAlphaButtons() {
        this.toggleButtonState('.btn-shift', false);
        this.toggleButtonState('.btn-alpha', false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new Calculator();
});
