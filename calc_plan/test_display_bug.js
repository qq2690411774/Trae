// 测试数字显示问题

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
    '9': ['a', 'b', 'c', 'd', 'f', 'g'],
    '-': ['g'],
    'E': ['a', 'c', 'd', 'e', 'g'],
    'r': ['e', 'g'],
    'o': ['c', 'd', 'e', 'g'],
    '.': ['dp'],
    ' ': []
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

function formatDisplay(value) {
    if (!value) return '0';

    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) {
        if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-8 && num !== 0)) {
            return num.toExponential(6).replace(/e\+?/, 'E');
        }
    }

    return value.replace(/\*/g, '×').replace(/\//g, '÷');
}

// 测试数字显示
console.log('=== 测试数字显示 ===');

const testNumbers = ['2', '5', '6', '256'];

testNumbers.forEach(number => {
    console.log(`数字: ${number}`);
    console.log(`formatDisplay: ${formatDisplay(number)}`);
    console.log(`toSevenSegmentHTML: ${toSevenSegmentHTML(formatDisplay(number))}`);
    console.log('');
});

// 测试每个字符的段定义
console.log('=== 测试每个字符的段定义 ===');

const testChars = ['2', '5', '6', 'E'];

testChars.forEach(char => {
    console.log(`字符: ${char}`);
    console.log(`段定义: ${DIGIT_SEGMENTS[char] || []}`);
    console.log(`HTML: ${createDigitHTML(char)}`);
    console.log('');
});

console.log('=== 测试完成 ===');
