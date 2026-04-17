/**
 * 简单的 Express 服务器
 * 用于部署画板应用到 Railway
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件服务
app.use(express.static(__dirname));

// 所有路由都返回 index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🎨 画板服务器运行在 http://localhost:${PORT}`);
    console.log(`📌 准备部署到 Railway...`);
});
