// 8段数码管测试脚本

// 8段数码管段定义
const DIGIT_SEGMENTS = {
    '0': ['a', 'b', 'c', 'd', 'e', 'f'],
    '1': ['b', 'c'],
    '2': ['a', 'b', 'd', 'e', 'g'],
    '3': ['a', 'b', 'c', 'd', 'g'],
    '4': ['b', 'c', 'f', 'g'],
    '5': ['a', 'c', 'd', 'f', 'g'],
    '6': ['a', 'c', 'd', 'e', 'f', 'g'],
    '7': ['a', 'b', 'c'],
    '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    '9': ['a', 'b', 'c', 'd', 'f', 'g']
};

function createDigitHTML(char) {
    if (char === '-' || char === '−') {
        return `<div class="minus-sign on"></div>`;
    }
    if (char === ' ') {
        return `<div class="digit-space"></div>`;
    }
    if (char === '.') {
        return `<div class="digit"><div class="segment segment-dp on"></div></div>`;
    }
    if (char === '+') {
        return `<div class="digit"><div class="segment segment-g on"></div></div>`;
    }
    
    const segments = DIGIT_SEGMENTS[char.toUpperCase()] || [];
    if (segments.length === 0) {
        return `<div class="digit"></div>`;
    }
    
    let html = '<div class="digit">';
    const segmentPositions = {
        'a': 'segment-a',
        'b': 'segment-b', 
        'c': 'segment-c',
        'd': 'segment-d',
        'e': 'segment-e',
        'f': 'segment-f',
        'g': 'segment-g',
        'dp': 'segment-dp'
    };
    
    for (const seg of segments) {
        const className = segmentPositions[seg];
        if (className) {
            html += `<div class="segment ${className} on"></div>`;
        }
    }
    html += '</div>';
    return html;
}

function toSevenSegmentHTML(str) {
    if (!str) return '';
    
    const result = [];
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        
        if (char === '.' && i > 0) {
            result[result.length - 1] = result[result.length - 1].replace('</div>', '<div class="segment segment-dp on"></div></div>');
            continue;
        }
        
        result.push(createDigitHTML(char));
    }
    return result.join('');
}

// 测试所有数字
function testAllDigits() {
    console.log('=== 8段数码管数字测试 ===');
    
    for (let i = 0; i <= 9; i++) {
        const digit = i.toString();
        const html = createDigitHTML(digit);
        const expectedSegments = DIGIT_SEGMENTS[digit].join(',');
        
        console.log(`数字 ${digit}:`);
        console.log(`  预期段: ${expectedSegments}`);
        console.log(`  HTML: ${html}`);
        console.log('');
    }
    
    console.log('=== 测试完成 ===');
}

// 测试多位数
function testMultiDigit() {
    console.log('=== 多位数测试 ===');
    
    const testNumbers = ['123', '456', '789', '0.5', '-7', '1.23E4'];
    
    testNumbers.forEach(number => {
        const html = toSevenSegmentHTML(number);
        console.log(`数字 ${number}:`);
        console.log(`  HTML: ${html}`);
        console.log('');
    });
    
    console.log('=== 测试完成 ===');
}

// 运行测试
testAllDigits();
testMultiDigit();

console.log('测试脚本运行完成！');
console.log('请在浏览器中打开 test_digits.html 查看可视化效果。');