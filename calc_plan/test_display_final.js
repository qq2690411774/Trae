// 测试8段数码管显示 - 直接读取文件内容

const fs = require('fs');

// 读取display.js文件内容
const displayJsContent = fs.readFileSync('./js/display.js', 'utf8');

// 提取DIGIT_SEGMENTS定义
function extractDigitSegments() {
    const match = displayJsContent.match(/const DIGIT_SEGMENTS = \{(.*?)\};[\s\S]*?function createDigitHTML/ms);
    if (match) {
        const segmentsStr = match[1];
        // 转换为JavaScript对象
        const segmentsObj = eval('({' + segmentsStr + '})');
        return segmentsObj;
    }
    return null;
}

// 测试
const DIGIT_SEGMENTS = extractDigitSegments();

if (DIGIT_SEGMENTS) {
    console.log('=== 提取的DIGIT_SEGMENTS ===');
    console.log(DIGIT_SEGMENTS);
    console.log('');
    
    console.log('=== 测试数字256 ===');
    const testNumber = '256';
    
    for (let i = 0; i < testNumber.length; i++) {
        const char = testNumber[i];
        const segments = DIGIT_SEGMENTS[char];
        console.log(`数字 ${char}: ${segments.join(', ')}`);
    }
    
    console.log('');
    console.log('=== 与字母E比较 ===');
    console.log(`字母E: ${DIGIT_SEGMENTS['E'].join(', ')}`);
    console.log(`数字5: ${DIGIT_SEGMENTS['5'].join(', ')}`);
    console.log(`数字6: ${DIGIT_SEGMENTS['6'].join(', ')}`);
    
} else {
    console.log('无法提取DIGIT_SEGMENTS');
}
