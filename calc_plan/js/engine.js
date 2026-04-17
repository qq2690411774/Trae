class CalculatorEngine {
    constructor() {
        this.angleMode = 'DEG';
        this.memory = {};
        this.lastAnswer = 0;
        this.variables = { A: 0, B: 0, C: 0, E: 0, F: 0, X: 0, Y: 0, M: 0 };
        this.precision = 12;
    }

    evaluate(expression) {
        try {
            const tokens = this.tokenize(expression);
            if (tokens.length === 0) return '0';

            let pos = 0;
            const result = this.parseExpression(tokens, pos);

            if (result.pos < tokens.length) {
                throw new Error('Invalid expression');
            }

            return this.formatResult(result.value);
        } catch (error) {
            throw new Error(error.message || 'Error');
        }
    }

    tokenize(expr) {
        const tokens = [];
        let i = 0;

        while (i < expr.length) {
            const char = expr[i];

            if (/\s/.test(char)) {
                i++;
                continue;
            }

            if (/[0-9]/.test(char)) {
                let num = '';
                while (i < expr.length && /[0-9.]/.test(expr[i])) {
                    num += expr[i++];
                }
                
                if (i < expr.length && (expr[i] === 'e' || expr[i] === 'E')) {
                    num += expr[i++];
                    if (i < expr.length && (expr[i] === '+' || expr[i] === '-')) {
                        num += expr[i++];
                    }
                    while (i < expr.length && /[0-9]/.test(expr[i])) {
                        num += expr[i++];
                    }
                }
                
                tokens.push({ type: 'NUMBER', value: parseFloat(num) });
                continue;
            }

            if (/[a-zA-Zπ]/.test(char)) {
                let word = '';
                while (i < expr.length && /[a-zA-Zπ]/.test(expr[i])) {
                    word += expr[i++];
                }

                const funcMap = {
                    'sin': 'SIN', 'cos': 'COS', 'tan': 'TAN',
                    'asin': 'ASIN', 'acos': 'ACOS', 'atan': 'ATAN',
                    'sinh': 'SINH', 'cosh': 'COSH', 'tanh': 'TANH',
                    'log': 'LOG', 'ln': 'LN', 'sqrt': 'SQRT',
                    'abs': 'ABS', 'exp': 'EXP_FUNC',
                    'pi': 'PI', 'π': 'PI',
                    'Ans': 'ANS'
                };

                if (funcMap[word]) {
                    tokens.push({ type: funcMap[word], value: word });
                } else if (word.length === 1 && /[A-FXYM]/.test(word)) {
                    tokens.push({ type: 'VARIABLE', value: word });
                } else {
                    throw new Error(`Unknown function: ${word}`);
                }
                continue;
            }

            const operatorMap = {
                '+': 'PLUS', '-': 'MINUS', '*': 'MUL', '/': 'DIV',
                '^': 'POWER', '(': 'LPAREN', ')': 'RPAREN',
                ',': 'COMMA', '!': 'FACTORIAL'
            };

            if (operatorMap[char]) {
                tokens.push({ type: operatorMap[char], value: char });
                i++;
                continue;
            }

            throw new Error(`Invalid character: ${char}`);
        }

        return tokens;
    }

    parseExpression(tokens, pos) {
        let left = this.parseTerm(tokens, pos);

        while (left.pos < tokens.length &&
               (tokens[left.pos].type === 'PLUS' || tokens[left.pos].type === 'MINUS')) {
            const op = tokens[left.pos];
            left.pos++;
            const right = this.parseTerm(tokens, left.pos);

            if (op.type === 'PLUS') {
                left.value = this.preciseAdd(left.value, right.value);
            } else {
                left.value = this.preciseSubtract(left.value, right.value);
            }
            left.pos = right.pos;
        }

        return left;
    }

    parseTerm(tokens, pos) {
        let left = this.parsePower(tokens, pos);

        while (left.pos < tokens.length &&
               (tokens[left.pos].type === 'MUL' || tokens[left.pos].type === 'DIV')) {
            const op = tokens[left.pos];
            left.pos++;
            const right = this.parsePower(tokens, left.pos);

            if (op.type === 'MUL') {
                left.value = this.preciseMultiply(left.value, right.value);
            } else {
                if (right.value === 0) {
                    throw new Error('Division by zero');
                }
                left.value = this.preciseDivide(left.value, right.value);
            }
            left.pos = right.pos;
        }

        return left;
    }

    parsePower(tokens, pos) {
        let base = this.parseUnary(tokens, pos);

        if (base.pos < tokens.length && tokens[base.pos].type === 'POWER') {
            base.pos++;
            const exp = this.parsePower(tokens, base.pos);
            base.value = Math.pow(base.value, exp.value);
            base.pos = exp.pos;
        }

        return base;
    }

    parseUnary(tokens, pos) {
        if (pos < tokens.length && tokens[pos].type === 'MINUS') {
            pos++;
            const operand = this.parseFactorial(tokens, pos);
            return { value: -operand.value, pos: operand.pos };
        }

        if (pos < tokens.length && tokens[pos].type === 'PLUS') {
            pos++;
            return this.parseFactorial(tokens, pos);
        }

        return this.parseFactorial(tokens, pos);
    }

    parseFactorial(tokens, pos) {
        let result = this.parsePrimary(tokens, pos);

        while (result.pos < tokens.length && tokens[result.pos].type === 'FACTORIAL') {
            result.pos++;
            result.value = this.factorial(result.value);
        }

        return result;
    }

    parsePrimary(tokens, pos) {
        if (pos >= tokens.length) {
            throw new Error('Unexpected end of expression');
        }

        const token = tokens[pos];

        if (token.type === 'NUMBER') {
            return { value: token.value, pos: pos + 1 };
        }

        if (token.type === 'LPAREN') {
            pos++;
            const result = this.parseExpression(tokens, pos);

            if (result.pos >= tokens.length || tokens[result.pos].type !== 'RPAREN') {
                throw new Error('Missing closing parenthesis');
            }

            result.pos++;
            return result;
        }

        if (['SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN',
             'SINH', 'COSH', 'TANH',
             'LOG', 'LN', 'SQRT', 'ABS', 'EXP_FUNC'].includes(token.type)) {
            pos++;

            if (pos >= tokens.length || tokens[pos].type !== 'LPAREN') {
                throw new Error(`Missing opening parenthesis after ${token.value}`);
            }
            pos++;

            const args = [];
            const argResult = this.parseExpression(tokens, pos);
            args.push(argResult.value);  // 只取value，不要整个对象
            pos = argResult.pos;

            while (pos < tokens.length && tokens[pos].type === 'COMMA') {
                pos++;
                const arg = this.parseExpression(tokens, pos);
                args.push(arg.value);  // 同样只取value
                pos = arg.pos;
            }

            if (pos >= tokens.length || tokens[pos].type !== 'RPAREN') {
                throw new Error('Missing closing parenthesis');
            }
            pos++;

            const value = this.executeFunction(token.type, args);
            return { value, pos };
        }

        if (token.type === 'PI') {
            return { value: Math.PI, pos: pos + 1 };
        }

        if (token.type === 'ANS') {
            return { value: this.lastAnswer, pos: pos + 1 };
        }

        if (token.type === 'VARIABLE') {
            return { value: this.getVariable(token.value), pos: pos + 1 };
        }

        throw new Error(`Unexpected token: ${token.value}`);
    }

    executeFunction(funcType, args) {
        const val = args[0];

        switch (funcType) {
            case 'SIN':
                return Math.sin(this.toRadians(val));
            case 'COS':
                return Math.cos(this.toRadians(val));
            case 'TAN':
                if (Math.abs(this.toRadians(val) % (Math.PI / 2)) < 0.000001 &&
                    Math.abs(this.toRadians(val) % Math.PI) > 0.000001) {
                    throw new Error('Math error (tan)');
                }
                return Math.tan(this.toRadians(val));
            case 'ASIN':
                if (val < -1 || val > 1) throw new Error('Domain error');
                return this.toDegrees(Math.asin(val));
            case 'ACOS':
                if (val < -1 || val > 1) throw new Error('Domain error');
                return this.toDegrees(Math.acos(val));
            case 'ATAN':
                return this.toDegrees(Math.atan(val));

            case 'SINH':
                return (Math.exp(val) - Math.exp(-val)) / 2;
            case 'COSH':
                return (Math.exp(val) + Math.exp(-val)) / 2;
            case 'TANH':
                const e = Math.exp(2 * val);
                return (e - 1) / (e + 1);

            case 'LOG':
                if (val <= 0) throw new Error('Domain error');
                return Math.log10(val);
            case 'LN':
                if (val <= 0) throw new Error('Domain error');
                return Math.log(val);
            case 'SQRT':
                if (val < 0) throw new Error('Domain error');
                return Math.sqrt(val);
            case 'ABS':
                return Math.abs(val);
            case 'EXP_FUNC':
                return Math.exp(val);
            default:
                throw new Error(`Unknown function: ${funcType}`);
        }
    }

    preciseAdd(a, b) {
        const precision = Math.pow(10, this.precision);
        return Math.round((a + b) * precision) / precision;
    }

    preciseSubtract(a, b) {
        const precision = Math.pow(10, this.precision);
        return Math.round((a - b) * precision) / precision;
    }

    preciseMultiply(a, b) {
        const precision = Math.pow(10, this.precision);
        return Math.round((a * b) * precision) / precision;
    }

    preciseDivide(a, b) {
        if (b === 0) throw new Error('Division by zero');
        const precision = Math.pow(10, this.precision);
        return Math.round((a / b) * precision) / precision;
    }

    factorial(n) {
        n = Math.round(n);
        if (n < 0) throw new Error('Domain error');
        if (n === 0 || n === 1) return 1;
        if (n > 170) throw new Error('Overflow');

        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    permutation(n, r) {
        n = Math.round(n);
        r = Math.round(r);
        if (r > n) throw new Error('Domain error');
        return this.factorial(n) / this.factorial(n - r);
    }

    combination(n, r) {
        n = Math.round(n);
        r = Math.round(r);
        if (r > n) throw new Error('Domain error');
        return this.factorial(n) / (this.factorial(r) * this.factorial(n - r));
    }

    toRadians(degrees) {
        if (this.angleMode === 'DEG') {
            return degrees * Math.PI / 180;
        }
        return degrees;
    }

    toDegrees(radians) {
        if (this.angleMode === 'DEG') {
            return radians * 180 / Math.PI;
        }
        return radians;
    }

    getVariable(name) {
        return this.variables[name] || 0;
    }

    setVariable(name, value) {
        this.variables[name] = value;
    }

    formatResult(value) {
        if (!isFinite(value)) {
            throw new Error('Math error');
        }

        if (isNaN(value)) {
            throw new Error('Invalid result');
        }

        if (Math.abs(value) < 1e-10 && value !== 0) {
            return value.toExponential(6);
        }

        if (Math.abs(value) >= 1e12) {
            return value.toExponential(6);
        }

        if (Math.abs(value) >= 100000000 && Number.isInteger(value)) {
            return value.toExponential(6);
        }

        const str = parseFloat(value.toPrecision(this.precision)).toString();

        if (str.includes('.') && str.split('.')[1].length > 11) {
            return parseFloat(str).toExponential(6);
        }

        return str;
    }

    setAngleMode(mode) {
        this.angleMode = mode;
    }

    setMemory(key, value) {
        this.memory[key] = value;
    }

    getMemory(key) {
        return this.memory[key] || 0;
    }

    addMemory(value) {
        this.memory['default'] = (this.memory['default'] || 0) + value;
    }

    setLastAnswer(value) {
        this.lastAnswer = value;
    }
}

window.CalculatorEngine = CalculatorEngine;
// Version 2.0 - Updated with high precision, hyperbolic functions, and improved error handling
