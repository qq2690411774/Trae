# 简易计算器设计文档

## 1. 文档信息

| 项目名称 | 简易计算器 |
|---------|----------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-04-13 |
| 文档状态 | 已完成 |

## 2. 技术架构

### 2.1 架构概述
简易计算器采用**单页应用(SPA)**架构，使用纯前端技术栈实现，不依赖任何后端服务。整体架构简洁高效，便于部署和维护。

### 2.2 技术栈

```
┌─────────────────────────────────┐
│         HTML5 (结构层)          │
│         CSS3 (表现层)           │
│       JavaScript (行为层)        │
└─────────────────────────────────┘
```

| 层级 | 技术 | 职责 |
|-----|------|------|
| 结构层 | HTML5 | 定义页面结构和语义化标签 |
| 表现层 | CSS3 | 定义样式、布局和视觉效果 |
| 行为层 | JavaScript ES6+ | 处理业务逻辑和用户交互 |

### 2.3 文件结构

```
calculator/
├── index.html      # 主页面结构
├── styles.css      # 样式表
├── script.js       # 业务逻辑
├── SPEC.md         # 产品说明文档
├── requirements.md # 需求文档
└── design.md       # 设计文档
```

## 3. 页面结构设计

### 3.1 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>简易计算器</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="calculator">
        <div class="display">
            <div class="display-history" id="history"></div>
            <div class="display-result" id="result">0</div>
        </div>
        <div class="buttons">
            <!-- 按钮布局 -->
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

### 3.2 布局结构

```
┌─────────────────────────────┐
│        display 历史记录     │
│        display 结果         │
├─────────────────────────────┤
│  [C]  [DEL]  [%]  [/]      │
├─────────────────────────────┤
│  [7]  [8]   [9]  [x]       │
├─────────────────────────────┤
│  [4]  [5]   [6]  [-]       │
├─────────────────────────────┤
│  [1]  [2]   [3]  [+]       │
├─────────────────────────────┤
│  [0]  [.]   [=]            │
└─────────────────────────────┘
```

### 3.3 按钮布局设计

| 行列 | 按钮1 | 按钮2 | 按钮3 | 按钮4 |
|-----|------|------|------|------|
| 第1行 | C | DEL | % | / |
| 第2行 | 7 | 8 | 9 | x |
| 第3行 | 4 | 5 | 6 | - |
| 第4行 | 1 | 2 | 3 | + |
| 第5行 | 0 | . | = | (占2列) |

## 4. 样式设计

### 4.1 整体风格
- **设计风格**：现代简约深色主题
- **圆角风格**：统一使用 12px 圆角
- **阴影效果**：使用 box-shadow 增加层次感
- **渐变背景**：紫色渐变营造科技感

### 4.2 配色方案

| 元素 | 颜色值 | 说明 |
|-----|--------|------|
| 页面背景 | linear-gradient(135deg, #667eea 0%, #764ba2 100%) | 紫蓝渐变 |
| 计算器背景 | #1a1a2e | 深蓝黑色 |
| 显示屏背景 | #16213e | 稍浅的深蓝 |
| 数字按钮背景 | #1f2937 | 深灰色 |
| 数字按钮文字 | #ffffff | 白色 |
| 运算符按钮背景 | #4b5563 | 中灰色 |
| 运算符按钮文字 | #fbbf24 | 金色/橙色 |
| 等号按钮背景 | #fbbf24 | 金色/橙色 |
| 等号按钮文字 | #1a1a2e | 深色 |
| 历史记录文字 | #888888 | 灰色 |

### 4.3 字体设计

| 元素 | 字体 | 大小 | 字重 |
|-----|------|------|------|
| 页面标题 | Segoe UI, Tahoma, Geneva, Verdana, sans-serif | - | - |
| 显示屏结果 | Segoe UI | 42px | 300 (Light) |
| 显示屏历史 | Segoe UI | 14px | - |
| 按钮文字 | - | 22px | - |

### 4.4 间距系统

| 元素 | 数值 | 说明 |
|-----|------|------|
| 计算器内边距 | 20px | padding |
| 按钮间距 | 12px | gap |
| 按钮高度 | 60px | height |
| 按钮圆角 | 12px | border-radius |
| 显示屏圆角 | 12px | border-radius |
| 显示屏内边距 | 20px | padding |
| 显示屏最小高度 | 100px | min-height |

### 4.5 交互效果

#### 悬停效果 (hover)
```css
.btn:hover {
    background: #374151;  /* 变亮 */
    transform: scale(1.02);  /* 轻微放大 */
}
```

#### 按下效果 (active)
```css
.btn:active {
    transform: scale(0.98);  /* 轻微缩小 */
}
```

#### 运算符悬停
```css
.btn.operator:hover {
    background: #6b7280;  /* 比默认稍亮 */
}
```

#### 等号悬停
```css
.btn.equals:hover {
    background: #f59e0b;  /* 变深 */
}
```

## 5. 组件设计

### 5.1 计算器容器组件

```css
.calculator {
    background: #1a1a2e;      /* 深色背景 */
    border-radius: 16px;       /* 大圆角 */
    padding: 20px;              /* 内边距 */
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);  /* 阴影 */
    width: 320px;               /* 固定宽度 */
}
```

### 5.2 显示屏组件

```css
.display {
    background: #16213e;           /* 深蓝背景 */
    border-radius: 12px;           /* 圆角 */
    padding: 20px;                 /* 内边距 */
    margin-bottom: 20px;           /* 底部间距 */
    min-height: 100px;             /* 最小高度 */
    display: flex;                 /* 弹性布局 */
    flex-direction: column;         /* 垂直排列 */
    justify-content: flex-end;      /* 底部对齐 */
    text-align: right;             /* 右对齐 */
}
```

### 5.3 按钮组件

#### 基础按钮
```css
.btn {
    height: 60px;           /* 高度 */
    border: none;           /* 无边框 */
    border-radius: 12px;    /* 圆角 */
    font-size: 22px;        /* 字号 */
    cursor: pointer;        /* 指针 */
    transition: all 0.15s ease;  /* 过渡 */
    background: #1f2937;   /* 背景色 */
    color: #fff;            /* 文字色 */
}
```

#### 运算符按钮
```css
.btn.operator {
    background: #4b5563;     /* 中灰背景 */
    color: #fbbf24;          /* 橙色文字 */
}
```

#### 等号按钮
```css
.btn.equals {
    background: #fbbf24;     /* 橙色背景 */
    color: #1a1a2e;          /* 深色文字 */
    font-weight: 600;        /* 粗体 */
}
```

## 6. JavaScript 设计

### 6.1 状态管理

```javascript
// 全局状态变量
let currentInput = '0';      // 当前输入值
let previousInput = '';      // 前一个输入值
let operator = null;        // 当前运算符
let shouldResetDisplay = false;  // 是否应重置显示
```

### 6.2 核心函数

#### 6.2.1 数字输入函数
```javascript
function inputNumber(num) {
    // 参数：num - 要输入的数字字符串('0'-'9')
    // 返回值：无（直接更新显示）
    // 逻辑：
    // 1. 如果应重置显示，替换当前输入
    // 2. 如果当前是'0'且输入非'0'，替换
    // 3. 如果当前是'0'且输入'0'，无效
    // 4. 如果位数小于12位，追加输入
}
```

#### 6.2.2 运算符输入函数
```javascript
function inputOperator(op) {
    // 参数：op - 运算符字符串
    // 返回值：无
    // 逻辑：
    // 1. 如果已有运算符且不应重置，先计算
    // 2. 保存当前输入为前一个输入
    // 3. 设置当前运算符
    // 4. 设置应重置显示标志
}
```

#### 6.2.3 计算函数
```javascript
function calculate() {
    // 参数：无
    // 返回值：无（直接更新显示）
    // 逻辑：
    // 1. 如果没有运算符或应重置，直接返回
    // 2. 解析前一个和当前输入为数字
    // 3. 根据运算符执行计算
    // 4. 处理除零错误
    // 5. 更新显示和状态
}
```

### 6.3 计算逻辑流程图

```
开始计算
    ↓
检查运算符是否存在 ─否→ 结束
    ↓是
检查是否应重置显示 ─是→ 结束
    ↓否
    ↓
解析 previousInput 和 currentInput
    ↓
根据 operator 执行对应运算
    ↓
检查除数是否为0 ─是→ 显示"Error"，结束
    ↓否
    ↓
计算结果并转换为字符串
    ↓
更新历史记录显示
    ↓
更新 currentInput
    ↓
重置运算符和 previousInput
    ↓
设置 shouldResetDisplay = true
    ↓
更新显示
    ↓
结束
```

### 6.4 DOM 操作

```javascript
// 获取 DOM 元素
const resultDisplay = document.getElementById('result');
const historyDisplay = document.getElementById('history');

// 更新显示函数
function updateDisplay() {
    // 长度超过12位使用科学计数法
    resultDisplay.textContent = currentInput.length > 12
        ? parseFloat(currentInput).toExponential(6)
        : currentInput;
}
```

## 7. 响应式设计

### 7.1 适配策略
- 计算器使用固定宽度 320px
- 在小屏幕上居中显示
- 使用 `min-height: 100vh` 确保垂直居中

### 7.2 断点设置
- 主要适配 320px 及以上宽度
- 无需媒体查询，当前设计已适配移动端

## 8. 无障碍设计

### 8.1 语义化标签
- 使用 `<button>` 标签定义按钮
- 使用 `<div>` 定义容器

### 8.2 可访问性
- 按钮有 `cursor: pointer` 提示可点击
- 使用 `onclick` 属性绑定事件
- 足够的颜色对比度

## 9. 性能优化

### 9.1 代码优化
- 使用 `textContent` 而非 `innerHTML` 更新文本
- 避免不必要的 DOM 操作
- 使用 CSS transition 而非 JavaScript 动画

### 9.2 加载优化
- 文件体积小，加载速度快
- 无外部依赖，减少 HTTP 请求
- CSS 和 JS 文件可并行加载

## 10. 浏览器兼容

### 10.1 兼容性测试

| 浏览器 | 版本 | 兼容性 |
|--------|------|--------|
| Chrome | 最新版 | ✅ 完全支持 |
| Firefox | 最新版 | ✅ 完全支持 |
| Edge | 最新版 | ✅ 完全支持 |
| Safari | 最新版 | ✅ 完全支持 |
| IE | - | ❌ 不支持 |

### 10.2 使用的现代特性
- CSS Grid (display: grid)
- CSS Flexbox (display: flex)
- CSS 渐变 (linear-gradient)
- ES6 箭头函数
- ES6 const/let

## 11. 安全性

### 11.1 XSS 防护
- 使用 `textContent` 而非 `innerHTML` 设置文本
- 不执行任何用户输入作为代码

### 11.2 输入验证
- 数字位数限制（最多12位）
- 小数点唯一性检查
- 除零错误处理

## 12. 错误处理

### 12.1 除零错误
```javascript
case '/':
    if (current === 0) {
        currentInput = 'Error';
        updateDisplay();
        return;
    }
    result = prev / current;
    break;
```

### 12.2 溢出处理
- 数字过长时使用 `toExponential(6)` 转换
- 超 JavaScript 数值范围显示 Infinity

### 12.3 边界条件
- 首位零输入处理
- 多小数点输入防护
- 运算符连续使用处理
