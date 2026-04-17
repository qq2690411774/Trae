// 测试 tokenize 方法
const fs = require('fs');

// 读取 engine.js 文件
const engineCode = fs.readFileSync('js/engine.js', 'utf8');

// 模拟浏览器环境
const globalContext = {
    Math: Math,
    window: {},
    console: console
};

// 执行 engine.js 代码
Function('Math', 'window', 'console', engineCode)(globalContext.Math, globalContext.window, globalContext.console);

// 获取 CalculatorEngine 类
const CalculatorEngine = globalContext.window.CalculatorEngine;
const engine = new CalculatorEngine();

// 测试 tokenize 方法
const testExpressions = [
    '3.2*2.3',
    '5+3*4',
    '(2+3)*4',
    '2.5+3.7'
];

console.log('=== Tokenize 测试 ===');
testExpressions.forEach(expr => {
    console.log(`\n表达式: ${expr}`);
    try {
        const tokens = engine.tokenize(expr);
        tokens.forEach((token, index) => {
            console.log(`  ${index}: ${token.type} = ${token.value}`);
        });
        
        // 测试解析
        console.log('  解析结果:', engine.evaluate(expr));
    } catch (error) {
        console.log('  错误:', error.message);
    }
});