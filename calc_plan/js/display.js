class DisplayManager {
    constructor() {
        this.expressionEl = document.getElementById('expression');
        this.resultEl = document.getElementById('result');
        this.modeIndicatorEl = document.getElementById('modeIndicator');
        this.displayContainer = document.querySelector('.display-container');

        this.currentInput = '';
        this.currentExpression = '';
        this.lastResult = null;
    }

    clear() {
        this.currentInput = '0';
        this.currentExpression = '';
        this.lastResult = null;
        this.updateDisplay();
        this.clearError();
    }

    clearEntry() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    appendValue(value) {
        if (this.currentInput === '0' && value !== '.') {
            this.currentInput = value;
        } else if (value === '.' && this.currentInput.includes('.')) {
            return;
        } else if (value === '.' && (this.currentInput === '' || this.currentInput === '0')) {
            this.currentInput = '0.';
        } else {
            this.currentInput += value;
        }

        if (this.currentInput.length > 24) {
            this.currentInput = this.currentInput.slice(0, 24);
        }

        this.updateDisplay();
    }

    setExpression(expr) {
        this.currentExpression = expr;
        this.updateDisplay();
    }

    setResult(result) {
        this.lastResult = result;
        this.currentInput = String(result);
        this.updateDisplay();
    }

    getResult() {
        return this.lastResult;
    }

    getCurrentInput() {
        return this.currentInput;
    }

    getFullExpression() {
        if (this.currentExpression) {
            return this.currentExpression + this.currentInput;
        }
        return this.currentInput;
    }

    updateDisplay() {
        if (this.resultEl) {
            const formatted = this.formatDisplay(this.currentInput);
            this.resultEl.textContent = formatted;
        }

        if (this.expressionEl) {
            this.expressionEl.textContent = this.formatExpression(this.currentExpression);
        }
    }

    formatDisplay(value) {
        if (!value) return '0';

        const num = parseFloat(value);
        if (!isNaN(num) && isFinite(num)) {
            if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-8 && num !== 0)) {
                return num.toExponential(6).replace(/e\+?/, 'E');
            }
        }

        return value.replace(/\*/g, '×').replace(/\//g, '÷');
    }

    formatExpression(expr) {
        if (!expr) return '';

        return expr
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/sqrt/g, '√')
            .replace(/pi/g, 'π')
            .slice(-50);
    }

    showError(message) {
        this.displayContainer.classList.add('error');
        this.resultEl.textContent = message || 'Error';
    }

    clearError() {
        this.displayContainer.classList.remove('error');
    }

    setModeIndicator(text) {
        if (this.modeIndicatorEl) {
            this.modeIndicatorEl.textContent = text || '';
        }
    }

    blink() {
        this.resultEl.style.opacity = '0.5';
        setTimeout(() => {
            this.resultEl.style.opacity = '1';
        }, 100);
    }
}

window.DisplayManager = DisplayManager;