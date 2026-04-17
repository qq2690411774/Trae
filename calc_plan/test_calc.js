// 简单的测试脚本
const fs = require('fs');
const vm = require('vm');

// 读取 engine.js 文件
const engineCode = fs.readFileSync('js/engine.js', 'utf8');

// 创建一个上下文并执行 engine.js
const context = vm.createContext({ Math, console, window: {} });
vm.runInContext(engineCode, context);

// 获取 CalculatorEngine 类
const CalculatorEngine = context.CalculatorEngine;
const engine = new CalculatorEngine();

// 测试基础功能
console.log('=== 基础测试 ===');
test('3.2*2.3', '7.36');
test('5+3*4', '17');
test('sin(30)', '0.5');
test('sqrt(144)', '12');
test('5!', '120');
test('pi', '3.14159');
test('10/3', '3.33333333333');
test('(2+3)*4', '20');

test('3.2*23', '73.6');
test('3.2*2.3', '7.36');

function test(expr, expected) {
  try {
    const result = engine.evaluate(expr);
    const passed = Math.abs(parseFloat(result) - parseFloat(expected)) < 0.0001 || result === expected;
    console.log(`${passed ? '✅' : '❌'} ${expr} = ${result} (预期: ${expected})`);
  } catch (error) {
    console.log(`❌ ${expr} → 错误: ${error.message}`);
  }
}

console.log('\n=== 测试完成 ===');