# 🚀 Railway 部署指南

## 📋 项目说明

这是一个二次元风格的在线画板应用，支持以下功能：
- ✏️ 自由绘画
- 🔲 基本形状（矩形、椭圆形）
- 🪣 油漆桶填充
- ↩️ 撤销/重做（Ctrl+Z / Ctrl+Y）
- 💾 保存和下载
- 📱 响应式设计

## 🎯 部署步骤

### 方法一：通过 GitHub 部署（推荐）

#### 1. 将代码推送到 GitHub

```bash
# 在项目目录下执行
git init
git add .
git commit -m "Initial commit - 二次元画板应用"

# 在 GitHub 上创建新仓库，然后执行
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

#### 2. 部署到 Railway

1. 访问 [Railway](https://railway.app/)
2. 登录账号（可以使用 GitHub 账号登录）
3. 点击 **"New Project"**
4. 选择 **"Deploy from GitHub repo"**
5. 选择你刚才推送的仓库
6. Railway 会自动检测 `package.json` 并部署

#### 3. 配置环境变量（可选）

在 Railway 面板中：
- 点击项目
- 点击 **"Variables"**
- 可以设置 `PORT`（默认 3000，Railway 会自动分配）

#### 4. 获取访问地址

部署成功后，Railway 会提供一个公网访问地址：
- 点击 **"Settings"**
- 找到 **"Domains"** 部分
- 点击 **"Generate Domain"**
- 获得类似 `https://your-app-production.up.railway.app` 的地址

### 方法二：直接部署（无需 GitHub）

#### 1. 安装 Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. 登录 Railway

```bash
railway login
```

#### 3. 初始化项目

```bash
railway init
```

#### 4. 创建新服务

```bash
railway new
```

#### 5. 部署

```bash
railway up
```

#### 6. 设置公网访问

```bash
railway domain
```

## ✅ 部署验证

部署完成后，您可以通过以下方式验证：

1. 访问 Railway 提供的域名
2. 测试绘画功能
3. 测试撤销/重做功能
4. 测试响应式布局

## 📝 注意事项

1. **免费额度**：Railway 提供免费额度，超出后需要付费
2. **休眠策略**：免费账户的应用可能会在空闲时休眠
3. **存储限制**：LocalStorage 数据存储在用户浏览器，不是服务器端
4. **自定义域名**：可以在 Railway 中绑定自己的域名

## 🔧 故障排除

### 部署失败

检查以下几点：
- `package.json` 文件是否存在
- `server.js` 文件是否正确
- 是否有 `node_modules` 目录（应该被 .gitignore 忽略）

### 页面无法访问

- 检查 Railway 项目是否正在运行
- 查看 Railway 控制台的日志
- 确认域名已正确生成

### 功能异常

- 打开浏览器开发者工具查看错误
- 确保浏览器支持 HTML5 Canvas
- 清除浏览器缓存后重试

## 📞 支持

如有问题，请查看：
- [Railway 官方文档](https://docs.railway.app/)
- [Railway Discord 社区](https://discord.gg/railway)

---

**祝您部署成功！🎨✨**
