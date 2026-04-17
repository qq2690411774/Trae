// 测试HTML输出

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
    '9': ['a', 'b', 'c', 'd', 'f', 'g']
};

function createDigitHTML(char) {
    const segments = DIGIT_SEGMENTS[char] || [];
    let html = '<div class="digit">';
    
    const segmentPositions = {
        'a': 'segment-a',
        'b': 'segment-b', 
        'c': 'segment-c',
        'd': 'segment-d',
        'e': 'segment-e',
        'f': 'segment-f',
        'g': 'segment-g'
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

// 测试数字256
console.log('=== 数字256的HTML输出 ===');
const digits = ['2', '5', '6'];
digits.forEach(digit => {
    console.log(`数字 ${digit}:`);
    console.log(createDigitHTML(digit));
    console.log('');
});
