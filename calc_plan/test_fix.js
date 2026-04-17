// 测试 sin(cos(0)) 修复
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

// 测试 sin(cos(0))
const testCases = [
    'sin(cos(0))',
    'cos(sin(0))',
    'sin(0)',
    'cos(0)',
    'sin(cos(sin(0)))'
];

console.log('=== 测试 sin(cos(0)) 修复 ===');
testCases.forEach(expr => {
    try {
        const result = engine.evaluate(expr);
        console.log(`✅ ${expr} = ${result}`);
    } catch (error) {
        console.log(`❌ ${expr} → 错误: ${error.message}`);
    }
});

// 测试计算引擎
console.log('\n=== 测试计算引擎 ===');
try {
    console.log('60/(54/6) =', engine.evaluate('60/(54/6)'));
    console.log('2^(log(100)) =', engine.evaluate('2^(log(100))'));
} catch (error) {
    console.log('计算引擎错误:', error.message);
}

console.log('\n=== 测试完成 ===');