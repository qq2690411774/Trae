// 测试实际的display.js文件

// 模拟DOM元素
const mockDocument = {
    getElementById: function(id) {
        return {
            textContent: '',
            innerHTML: '',
            style: { opacity: '1' },
            classList: { add: function() {}, remove: function() {} }
        };
    },
    querySelector: function() {
        return { classList: { add: function() {}, remove: function() {} } };
    }
};

// 模拟window对象
const mockWindow = {
    DisplayManager: null
};

// 读取并执行display.js
const fs = require('fs');
const displayJsContent = fs.readFileSync('./js/display.js', 'utf8');

// 执行display.js内容
eval(displayJsContent);

// 测试DisplayManager
function testDisplayManager() {
    console.log('=== 测试实际的DisplayManager ===');
    
    const display = new DisplayManager();
    
    // 测试数字256
    display.appendValue('2');
    console.log('输入2后:', display.currentInput);
    
    display.appendValue('5');
    console.log('输入5后:', display.currentInput);
    
    display.appendValue('6');
    console.log('输入6后:', display.currentInput);
    
    console.log('=== 测试完成 ===');
}

// 测试toSevenSegmentHTML函数
function testToSevenSegmentHTML() {
    console.log('=== 测试toSevenSegmentHTML函数 ===');
    
    const testCases = ['2', '5', '6', '256'];
    
    testCases.forEach(testCase => {
        const result = toSevenSegmentHTML(testCase);
        console.log(`输入: ${testCase}`);
        console.log(`输出: ${result}`);
        console.log('');
    });
    
    console.log('=== 测试完成 ===');
}

// 测试DIGIT_SEGMENTS
function testDigitSegments() {
    console.log('=== 测试DIGIT_SEGMENTS ===');
    
    console.log('DIGIT_SEGMENTS:', DIGIT_SEGMENTS);
    console.log('');
    
    const testChars = ['2', '5', '6', 'E'];
    testChars.forEach(char => {
        console.log(`字符 ${char}:`, DIGIT_SEGMENTS[char]);
    });
    
    console.log('=== 测试完成 ===');
}

// 运行测试
testDigitSegments();
testToSevenSegmentHTML();
