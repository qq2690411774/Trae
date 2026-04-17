// 测试计算引擎
const fs = require('fs');

// 读取 engine.js 文件并提取 CalculatorEngine 类
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

// 测试用例
const testCases = [
    ['3.2*2.3', '7.36'],
    ['3.2*23', '73.6'],
    ['2.5+3.7', '6.2'],
    ['10/2.5', '4'],
    ['sin(30)', '0.5'],
    ['5+3*4', '17'],
    ['(2+3)*4', '20'],
    ['sqrt(144)', '12'],
    ['5!', '120'],
    ['pi', '3.14159'],
    ['10/3', '3.33333333333']
];

console.log('=== 计算引擎测试 ===');
let passed = 0;
let failed = 0;

testCases.forEach(([expr, expected]) => {
    try {
        const result = engine.evaluate(expr);
        const isPassed = Math.abs(parseFloat(result) - parseFloat(expected)) < 0.0001;
        
        if (isPassed) {
            console.log(`✅ ${expr} = ${result} (预期: ${expected})`);
            passed++;
        } else {
            console.log(`❌ ${expr} = ${result} (预期: ${expected})`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ ${expr} → 错误: ${error.message}`);
        failed++;
    }
});

console.log(`\n=== 测试结果 ===`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总测试: ${testCases.length}`);
console.log(`通过率: ${((passed / testCases.length) * 100).toFixed(2)}%`);