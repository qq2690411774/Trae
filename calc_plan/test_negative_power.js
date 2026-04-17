// 测试 (-3)^2 的解析
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

// 测试 (-3)^2
const expression = '(-3)^2';
console.log(`测试表达式: ${expression}`);

try {
    const tokens = engine.tokenize(expression);
    console.log('Tokens:');
    tokens.forEach((token, index) => {
        console.log(`  ${index}: ${token.type} = ${token.value}`);
    });
    
    const result = engine.evaluate(expression);
    console.log(`结果: ${result}`);
} catch (error) {
    console.log(`错误: ${error.message}`);
}

// 测试其他负号情况
const testCases = [
    '(-3)',
    '-3',
    '3^2',
    '(-3)*2',
    '2*(-3)'
];

console.log('\n其他测试:');
testCases.forEach(expr => {
    try {
        const result = engine.evaluate(expr);
        console.log(`  ${expr} = ${result}`);
    } catch (error) {
        console.log(`  ${expr} → 错误: ${error.message}`);
    }
});