let augendValue = 0;
let addendValue = 0;

function initLights() {
    const augendBits = document.getElementById('augend-bits');
    const addendBits = document.getElementById('addend-bits');
    const sumBits = document.getElementById('sum-bits');
    
    for (let i = 0; i < 8; i++) {
        const bitIndex = 7 - i;
        
        const light1 = document.createElement('div');
        light1.className = 'bit-light';
        light1.id = `augend-bit-${bitIndex}`;
        light1.addEventListener('click', () => toggleBit('augend', bitIndex));
        light1.style.cursor = 'pointer';
        augendBits.appendChild(light1);
        
        const light2 = document.createElement('div');
        light2.className = 'bit-light';
        light2.id = `addend-bit-${bitIndex}`;
        light2.addEventListener('click', () => toggleBit('addend', bitIndex));
        light2.style.cursor = 'pointer';
        addendBits.appendChild(light2);
        
        const light3 = document.createElement('div');
        light3.className = 'bit-light';
        light3.id = `sum-bit-${bitIndex}`;
        sumBits.appendChild(light3);
    }
    
    updateDisplay();
}

function toggleBit(type, bitIndex) {
    if (type === 'augend') {
        augendValue ^= (1 << bitIndex);
    } else if (type === 'addend') {
        addendValue ^= (1 << bitIndex);
    }
    updateDisplay();
}

function updateLights(elementId, value) {
    for (let i = 0; i < 8; i++) {
        const light = document.getElementById(`${elementId}-bit-${i}`);
        const bit = (value >> i) & 1;
        if (bit) {
            light.classList.add('on');
        } else {
            light.classList.remove('on');
        }
    }
}

function updateDisplay() {
    const sum = augendValue + addendValue;
    
    document.getElementById('augend-decimal').textContent = augendValue;
    document.getElementById('addend-decimal').textContent = addendValue;
    document.getElementById('sum-decimal').textContent = sum;
    
    updateLights('augend', augendValue);
    updateLights('addend', addendValue);
    updateLights('sum', sum);
}

document.addEventListener('DOMContentLoaded', () => {
    initLights();
});