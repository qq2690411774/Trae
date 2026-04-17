// 测试8段数码管显示逻辑

// 8段数码管段定义 - 从display.js复制
const DIGIT_SEGMENTS = {
    '0': ['a', 'b', 'c', 'd', 'e', 'f'],
    '1': ['b', 'c'],
    '2': ['a', 'b', 'd', 'e', 'g'],
    '3': ['a', 'b', 'c', 'd', 'g'],
    '4': ['b', 'c', 'f', 'g'],
    '5': ['a', 'c', 'd', 'e', 'f', 'g'],
    '6': ['a', 'c', 'd', 'e', 'f', 'g'],
    '7': ['a', 'b', 'c'],
    '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    '9': ['a', 'b', 'c', 'd', 'f', 'g'],
    '-': ['g'],
    'E': ['a', 'c', 'd', 'e', 'g'],
    'r': ['e', 'g'],
    'o': ['c', 'd', 'e', 'g'],
    '.': ['dp'],
    ' ': []
};

// 段位置映射
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

// 测试每个数字的段定义
function testDigitSegments() {
    console.log('=== 数字段定义测试 ===');
    
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    digits.forEach(digit => {
        const segments = DIGIT_SEGMENTS[digit];
        console.log(`数字 ${digit}: ${segments.join(', ')}`);
        
        // 检查段是否完整
        if (digit === '5' && !segments.includes('e')) {
            console.log('  ❌ 错误: 数字5缺少e段');
        }
        if (digit === '6' && (!segments.includes('e') || !segments.includes('f'))) {
            console.log('  ❌ 错误: 数字6缺少e或f段');
        }
    });
    
    console.log('');
}

// 测试特定数字
function testSpecificNumbers() {
    console.log('=== 特定数字测试 ===');
    
    const testNumbers = ['2', '5', '6', '256'];
    
    testNumbers.forEach(number => {
        console.log(`测试数字: ${number}`);
        
        for (let i = 0; i < number.length; i++) {
            const char = number[i];
            const segments = DIGIT_SEGMENTS[char];
            console.log(`  字符 ${char}: ${segments.join(', ')}`);
        }
        
        console.log('');
    });
}

// 比较数字和字母E的段定义
function compareWithE() {
    console.log('=== 与字母E比较 ===');
    
    const eSegments = DIGIT_SEGMENTS['E'];
    console.log(`字母E的段: ${eSegments.join(', ')}`);
    
    const digit5Segments = DIGIT_SEGMENTS['5'];
    console.log(`数字5的段: ${digit5Segments.join(', ')}`);
    
    const digit6Segments = DIGIT_SEGMENTS['6'];
    console.log(`数字6的段: ${digit6Segments.join(', ')}`);
    
    console.log('');
    
    // 检查差异
    console.log('数字5与E的差异:', digit5Segments.filter(s => !eSegments.includes(s)));
    console.log('数字6与E的差异:', digit6Segments.filter(s => !eSegments.includes(s)));
    
    console.log('');
}

// 运行测试
testDigitSegments();
testSpecificNumbers();
compareWithE();

console.log('=== 测试完成 ===');
