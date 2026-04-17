/**
 * 二次元画板应用
 * 功能：绘画、油漆桶、形状绘制、撤销重做、保存下载
 */

// ====================================
// DOM 元素引用
// ====================================
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// 颜色选择器
const lineColorPicker = document.getElementById('lineColorPicker');
const fillColorPicker = document.getElementById('fillColorPicker');

// 画笔设置
const brushSize = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const brushHardness = document.getElementById('brushHardness');
const brushHardnessValue = document.getElementById('brushHardnessValue');

// 填充模式
const fillMode = document.getElementById('fillMode');

// 工具按钮
const brushBtn = document.getElementById('brushBtn');
const eraserBtn = document.getElementById('eraserBtn');
const bucketBtn = document.getElementById('bucketBtn');

// 形状按钮
const freeDrawBtn = document.getElementById('freeDrawBtn');
const rectBtn = document.getElementById('rectBtn');
const ellipseBtn = document.getElementById('ellipseBtn');

// 操作按钮
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const downloadBtn = document.getElementById('downloadBtn');

// 状态文本
const statusText = document.getElementById('statusText');

// ====================================
// 应用状态
// ====================================
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let startX = 0;
let startY = 0;

// 当前工具和形状
let currentTool = 'brush';
let currentShape = 'free';

// 颜色设置
let currentLineColor = '#000000';
let currentFillColor = '#7ec8f5';

// 画笔设置
let currentSize = 5;
let currentHardness = 100;

// 填充模式
let currentFillMode = 'none';

// 临时快照（用于形状预览）
let snapshot = null;

// 撤销/重做历史
let history = [];
let historyStep = -1;
const MAX_HISTORY = 50;

// ====================================
// 初始化画布
// ====================================
function initCanvas() {
    const wrapper = document.querySelector('.canvas-wrapper');
    const maxWidth = wrapper.clientWidth - 40;
    const maxHeight = wrapper.clientHeight - 40;
    
    canvas.width = Math.max(800, Math.min(1000, maxWidth));
    canvas.height = Math.max(600, Math.min(800, maxHeight));
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 保存初始状态到历史
    saveToHistory();
    
    updateStatus('就绪 - 开始创作吧！✨');
}

// ====================================
// 坐标获取
// ====================================
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches && e.touches.length > 0) {
        return [
            (e.touches[0].clientX - rect.left) * scaleX,
            (e.touches[0].clientY - rect.top) * scaleY
        ];
    }
    
    return [
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
    ];
}

// ====================================
// 绘画事件处理
// ====================================
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getCoordinates(e);
    [startX, startY] = [lastX, lastY];
    
    // 保存当前状态用于形状预览
    if (currentShape !== 'free') {
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    // 油漆桶工具立即执行填充
    if (currentTool === 'bucket') {
        floodFill(Math.floor(lastX), Math.floor(lastY), hexToRgb(currentFillColor));
        isDrawing = false;
        saveToHistory();
        return;
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    e.preventDefault();
    const [x, y] = getCoordinates(e);
    
    if (currentShape === 'free') {
        // 自由绘制模式
        if (currentTool === 'eraser') {
            drawLine(lastX, lastY, x, y, 'white', currentSize, 100);
        } else {
            drawLine(lastX, lastY, x, y, currentLineColor, currentSize, currentHardness);
        }
    } else {
        // 形状绘制模式 - 恢复快照并重新绘制
        ctx.putImageData(snapshot, 0, 0);
        drawShape(currentShape, startX, startY, x, y);
    }
    
    [lastX, lastY] = [x, y];
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        snapshot = null;
        // 保存到历史
        saveToHistory();
    }
}

// ====================================
// 绘画函数
// ====================================
function drawLine(x1, y1, x2, y2, color, size, hardness) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    
    // 根据硬度设置阴影模糊
    const blurAmount = (100 - hardness) / 100 * size;
    if (blurAmount > 0) {
        ctx.shadowBlur = blurAmount;
        ctx.shadowColor = color;
    } else {
        ctx.shadowBlur = 0;
    }
    
    ctx.stroke();
}

// ====================================
// 形状绘制
// ====================================
function drawShape(shape, x1, y1, x2, y2) {
    const width = x2 - x1;
    const height = y2 - y1;
    
    ctx.shadowBlur = 0;
    
    const shouldStroke = currentFillMode === 'stroke' || currentFillMode === 'both';
    const shouldFill = currentFillMode === 'fill' || currentFillMode === 'both';
    
    if (shape === 'rect') {
        if (shouldFill) {
            ctx.fillStyle = currentFillColor;
            ctx.fillRect(x1, y1, width, height);
        }
        if (shouldStroke) {
            ctx.strokeStyle = currentLineColor;
            ctx.lineWidth = currentSize;
            ctx.strokeRect(x1, y1, width, height);
        }
    } else if (shape === 'ellipse') {
        const centerX = x1 + width / 2;
        const centerY = y1 + height / 2;
        const radiusX = Math.abs(width) / 2;
        const radiusY = Math.abs(height) / 2;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        
        if (shouldFill) {
            ctx.fillStyle = currentFillColor;
            ctx.fill();
        }
        if (shouldStroke) {
            ctx.strokeStyle = currentLineColor;
            ctx.lineWidth = currentSize;
            ctx.stroke();
        }
    }
    
    updateStatus(`${shape === 'rect' ? '矩形' : '椭圆形'} - ${getFillModeText()}`);
}

// ====================================
// 油漆桶填充
// ====================================
function floodFill(x, y, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    const startPos = (y * width + x) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];
    
    // 如果颜色相同，不填充
    if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b) {
        return;
    }
    
    const tolerance = 10;
    const stack = [[x, y]];
    
    function matchesStartColor(pos) {
        const r = data[pos];
        const g = data[pos + 1];
        const b = data[pos + 2];
        return Math.abs(r - startR) <= tolerance &&
               Math.abs(g - startG) <= tolerance &&
               Math.abs(b - startB) <= tolerance;
    }
    
    while (stack.length > 0) {
        const [cx, cy] = stack.pop();
        const pos = (cy * width + cx) * 4;
        
        if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
        if (!matchesStartColor(pos)) continue;
        
        data[pos] = fillColor.r;
        data[pos + 1] = fillColor.g;
        data[pos + 2] = fillColor.b;
        data[pos + 3] = 255;
        
        stack.push([cx + 1, cy]);
        stack.push([cx - 1, cy]);
        stack.push([cx, cy + 1]);
        stack.push([cx, cy - 1]);
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// ====================================
// 工具函数
// ====================================
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function updateStatus(message) {
    statusText.textContent = message;
}

function getFillModeText() {
    const modes = {
        none: '无填充',
        stroke: '线条',
        fill: '填充',
        both: '线条 + 填充'
    };
    return modes[currentFillMode] || '';
}

// ====================================
// 撤销/重做功能
// ====================================
function saveToHistory() {
    // 删除当前步骤之后的历史记录
    if (historyStep < history.length - 1) {
        history = history.slice(0, historyStep + 1);
    }
    
    // 保存当前状态
    history.push(canvas.toDataURL());
    
    // 限制历史记录数量
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyStep++;
    }
    
    updateUndoRedoButtons();
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        loadFromHistory(history[historyStep]);
        updateStatus('已撤销 ↩️');
        updateUndoRedoButtons();
    } else if (historyStep === 0) {
        // 回到初始状态
        historyStep = -1;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updateStatus('已撤销到初始状态 ↩️');
        updateUndoRedoButtons();
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        loadFromHistory(history[historyStep]);
        updateStatus('已重做 ↪️');
        updateUndoRedoButtons();
    }
}

function loadFromHistory(dataURL) {
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
}

function updateUndoRedoButtons() {
    undoBtn.disabled = historyStep < 0;
    redoBtn.disabled = historyStep >= history.length - 1;
    
    undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
    redoBtn.style.opacity = redoBtn.disabled ? '0.5' : '1';
}

// ====================================
// 工具切换
// ====================================
function setTool(tool) {
    currentTool = tool;
    brushBtn.classList.toggle('active', tool === 'brush');
    eraserBtn.classList.toggle('active', tool === 'eraser');
    bucketBtn.classList.toggle('active', tool === 'bucket');
    
    const toolNames = { brush: '画笔', eraser: '橡皮擦', bucket: '油漆桶' };
    updateStatus(`${toolNames[tool]} 工具 - 准备就绪`);
}

function setShape(shape) {
    currentShape = shape;
    freeDrawBtn.classList.toggle('active', shape === 'free');
    rectBtn.classList.toggle('active', shape === 'rect');
    ellipseBtn.classList.toggle('active', shape === 'ellipse');
    
    const shapeNames = { free: '自由绘制', rect: '矩形', ellipse: '椭圆形' };
    updateStatus(`${shapeNames[shape]} - ${getFillModeText()}`);
}

// ====================================
// 操作功能
// ====================================
function clearCanvas() {
    if (confirm('确定要清除画布吗？此操作不可撤销。')) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
        updateStatus('画布已清除 ✨');
    }
}

function saveToLocalStorage() {
    try {
        const dataURL = canvas.toDataURL('image/png');
        localStorage.setItem('canvasDrawing', dataURL);
        localStorage.setItem('canvasSavedTime', new Date().toLocaleString('zh-CN'));
        updateStatus('已保存到本地存储 💾');
        alert('绘画已保存！');
    } catch (error) {
        updateStatus('保存失败：存储空间可能已满');
        alert('保存失败，可能是存储空间已满。');
    }
}

function downloadCanvas() {
    try {
        const link = document.createElement('a');
        link.download = `绘画-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        updateStatus('图片已下载 📥');
    } catch (error) {
        updateStatus('下载失败');
        alert('下载失败，请重试。');
    }
}

// ====================================
// 事件监听
// ====================================

// 颜色选择器
lineColorPicker.addEventListener('input', (e) => {
    currentLineColor = e.target.value;
    updateStatus(`线条颜色已更新 🎨`);
});

fillColorPicker.addEventListener('input', (e) => {
    currentFillColor = e.target.value;
    updateStatus(`填充颜色已更新 🎨`);
});

// 画笔设置
brushSize.addEventListener('input', (e) => {
    currentSize = e.target.value;
    brushSizeValue.textContent = currentSize;
    updateStatus(`画笔大小：${currentSize}px`);
});

brushHardness.addEventListener('input', (e) => {
    currentHardness = e.target.value;
    brushHardnessValue.textContent = currentHardness;
    const hardnessText = currentHardness == 100 ? '清晰' : (currentHardness == 0 ? '羽化' : '');
    updateStatus(`画笔硬度：${currentHardness}${hardnessText ? ' (' + hardnessText + ')' : ''}`);
});

// 填充模式
fillMode.addEventListener('change', (e) => {
    currentFillMode = e.target.value;
    setShape(currentShape);
});

// 工具按钮
brushBtn.addEventListener('click', () => setTool('brush'));
eraserBtn.addEventListener('click', () => setTool('eraser'));
bucketBtn.addEventListener('click', () => setTool('bucket'));

// 形状按钮
freeDrawBtn.addEventListener('click', () => setShape('free'));
rectBtn.addEventListener('click', () => setShape('rect'));
ellipseBtn.addEventListener('click', () => setShape('ellipse'));

// 操作按钮
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
clearBtn.addEventListener('click', clearCanvas);
saveBtn.addEventListener('click', saveToLocalStorage);
downloadBtn.addEventListener('click', downloadCanvas);

// 画布事件
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// 触摸事件
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl+Z 撤销
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    // Ctrl+Y 重做
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
    }
});

// 窗口大小调整
window.addEventListener('resize', () => {
    const imageData = canvas.toDataURL();
    initCanvas();
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
    updateStatus('画布已调整大小');
});

// ====================================
// 应用初始化
// ====================================
initCanvas();

// 加载上次保存的作品
const savedData = localStorage.getItem('canvasDrawing');
if (savedData) {
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveToHistory();
        updateStatus('已加载上次保存的绘画 - 可以继续创作 ✨');
    };
    img.src = savedData;
}
