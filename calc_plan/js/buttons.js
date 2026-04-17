class ButtonHandler {
    constructor(calculator) {
        this.calculator = calculator;
        this.buttons = document.querySelectorAll('.btn');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleButtonClick(button);
            });
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    handleButtonClick(button) {
        const action = button.dataset.action;
        const value = button.dataset.value;

        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 100);

        switch (action) {
            case 'number':
            case 'decimal':
                this.calculator.inputDigit(value);
                break;

            case 'operator':
                this.calculator.inputOperator(value);
                break;

            case 'equals':
                this.calculator.calculate();
                break;

            case 'ac':
                this.calculator.allClear();
                break;

            case 'del':
                this.calculator.deleteLast();
                break;

            case 'shift':
                this.calculator.toggleShift();
                break;

            case 'alpha':
                this.calculator.toggleAlpha();
                break;

            case 'sin':
                this.calculator.inputFunction('sin');
                break;

            case 'cos':
                this.calculator.inputFunction('cos');
                break;

            case 'tan':
                this.calculator.inputFunction('tan');
                break;

            case 'asin':
                this.calculator.inputFunction('asin');
                break;

            case 'acos':
                this.calculator.inputFunction('acos');
                break;

            case 'atan':
                this.calculator.inputFunction('atan');
                break;

            case 'log':
                this.calculator.inputFunction('log');
                break;

            case 'ln':
                this.calculator.inputFunction('ln');
                break;

            case 'sqrt':
                this.calculator.inputFunction('sqrt');
                break;

            case 'square':
                this.calculator.inputOperator('^2');
                break;

            case 'cube':
                this.calculator.inputOperator('^3');
                break;

            case 'power':
                this.calculator.inputOperator('^');
                break;

            case 'factorial':
                this.calculator.inputOperator('!');
                break;

            case 'open-paren':
            case 'open-paren2':
            case 'open-paren3':
                this.calculator.inputParenthesis('(');
                break;

            case 'close-paren':
            case 'close-paren2':
                this.calculator.inputParenthesis(')');
                break;

            case 'pi':
                this.calculator.inputConstant('π');
                break;

            case 'ans':
                this.calculator.inputConstant('Ans');
                break;

            case 'percent':
                this.calculator.inputOperator('/100*');
                break;

            case 'exp-btn':
                this.calculator.inputScientificNotation();
                break;

            case 'sto':
                this.calculator.storeVariable();
                break;

            case 'rcl':
                this.calculator.recallVariable();
                break;

            case 'mplus':
                this.calculator.memoryPlus();
                break;

            default:
                console.log(`Action not implemented: ${action}`);
        }
    }

    handleKeyPress(e) {
        const keyMap = {
            '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
            '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
            '.': '.', '+': '+', '-': '-', '*': '*', '/': '/',
            'Enter': '=', '=': '=', 'Escape': 'ac',
            'Backspace': 'del', 'Delete': 'ac',
            '(': '(', ')': ')'
        };

        if (keyMap[e.key]) {
            e.preventDefault();

            if (/^[0-9.]$/.test(keyMap[e.key])) {
                this.calculator.inputDigit(keyMap[e.key]);
            } else if (keyMap[e.key] === '=') {
                this.calculator.calculate();
            } else if (keyMap[e.key] === 'ac' || keyMap[e.key] === 'del') {
                if (keyMap[e.key] === 'ac') {
                    this.calculator.allClear();
                } else {
                    this.calculator.deleteLast();
                }
            } else if (/[+\-*/()]/.test(keyMap[e.key])) {
                this.calculator.inputOperator(keyMap[e.key]);
            }
        }
    }
}

window.ButtonHandler = ButtonHandler;
