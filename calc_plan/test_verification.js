// 测试 sin(cos(0)) 输入修复

// 模拟 DisplayManager 类
class TestDisplayManager {
    constructor() {
        this.currentExpression = '';
        this.currentInput = '0';
    }
    
    getCurrentInput() {
        return this.currentInput;
    }
    
    getFullExpression() {
        return this.currentExpression + this.currentInput;
    }
    
    setExpression(expr) {
        this.currentExpression = expr;
    }
    
    setResult(result) {
        this.currentInput = result;
        this.currentExpression = '';
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
    }
    
    clearError() {}
    
    showError(error) {
        this.currentInput = 'Error';
    }
    
    updateDisplay() {}
    
    clear() {
        this.currentExpression = '';
        this.currentInput = '0';
    }
}

// 模拟 Calculator 类
class TestCalculator {
    constructor() {
        this.display = new TestDisplayManager();
    }
    
    allClear() {
        this.display.clear();
    }
    
    inputFunction(funcName) {
        const currentInput = this.display.getCurrentInput();
        const currentExpression = this.display.currentExpression;
        
        let funcExpr = funcName + '(';
        
        if (currentInput !== '0' || currentInput === '0.') {
            this.display.setExpression(currentExpression + currentInput + funcExpr);
            this.display.currentInput = '';
        } else {
            this.display.setExpression(currentExpression + funcExpr);
        }
    }
    
    inputDigit(digit) {
        this.display.appendValue(digit);
    }
    
    inputParenthesis(paren) {
        const currentInput = this.display.getCurrentInput();
        const currentExpression = this.display.currentExpression;
        
        if (paren === '(') {
            if (currentInput !== '0' || currentInput === '0.') {
                this.display.setExpression(currentExpression + currentInput + '(');
                this.display.currentInput = '';
            } else {
                this.display.setExpression(currentExpression + '(');
            }
        } else if (paren === ')') {
            // 修复：即使 currentInput 是 '0'，也要添加
            if (currentInput !== '0' || currentInput === '0.' || currentExpression.endsWith('(')) {
                this.display.setExpression(currentExpression + currentInput + ')');
                this.display.currentInput = '';
            } else {
                this.display.setExpression(currentExpression + ')');
            }
        }
    }
    
    calculate() {
        // 简化的计算逻辑
        const expr = this.display.getFullExpression();
        console.log('计算表达式:', expr);
        this.display.setResult('0.84147'); // 模拟结果
    }
}

// 测试 sin(cos(0)) 输入
console.log('=== 测试 sin(cos(0)) 输入 ===');

const calculator = new TestCalculator();

console.log('1. 清空显示:');
console.log('   表达式:', calculator.display.currentExpression);
console.log('   输入:', calculator.display.currentInput);

console.log('\n2. 输入 sin:');
calculator.inputFunction('sin');
console.log('   表达式:', calculator.display.currentExpression);
console.log('   输入:', calculator.display.currentInput);

console.log('\n3. 输入 cos:');
calculator.inputFunction('cos');
console.log('   表达式:', calculator.display.currentExpression);
console.log('   输入:', calculator.display.currentInput);

console.log('\n4. 输入 0:');
calculator.inputDigit('0');
console.log('   表达式:', calculator.display.currentExpression);
console.log('   输入:', calculator.display.currentInput);

console.log('\n5. 输入 ):');
calculator.inputParenthesis(')');
console.log('   表达式:', calculator.display.currentExpression);
console.log('   输入:', calculator.display.currentInput);

console.log('\n6. 输入 ):');
calculator.inputParenthesis(')');
console.log('   表达式:', calculator.display.currentExpression);
console.log('   输入:', calculator.display.currentInput);

console.log('\n7. 计算:');
calculator.calculate();
console.log('   表达式:', calculator.display.currentExpression);
console.log('   输入:', calculator.display.currentInput);

console.log('\n=== 测试完成 ===');
console.log('修复前：输入 0 后，表达式会是 sin(cos()，缺少 0');
console.log('修复后：输入 0 后，表达式会是 sin(cos(0)，包含 0');
