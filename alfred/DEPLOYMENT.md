# Railway 部署指南

## 准备工作

### 1. 安装必要工具
- **Node.js**：已在项目目录中 (`nodejs/` 文件夹)
- **Railway CLI**：通过 npm 安装

### 2. 环境变量配置
在 Railway 控制台中需要配置以下环境变量：
- `OPENAI_API_KEY`：OpenAI API 密钥
- `ZHIPU_API_KEY`：智谱 AI API 密钥

## 部署步骤

### 1. 登录 Railway
```bash
# 打开命令提示符或 PowerShell
# 进入项目目录
cd c:\D\users\Trae\alfred

# 设置 PATH 环境变量
$env:PATH = "c:\D\users\Trae\alfred\nodejs;$env:PATH"

# 登录 Railway
railway login
# 会打开浏览器，按照提示完成登录
```

### 2. 初始化项目
```bash
# 初始化 Railway 项目
railway init
# 选择 "Create new project"
# 为项目命名，例如 "alfred-execution-decision"
```

### 3. 部署项目
```bash
# 部署项目
railway up
# 等待部署完成
```

### 4. 配置环境变量
1. 访问 [Railway 控制台](https://railway.app)
2. 选择你的项目
3. 进入 "Variables" 标签页
4. 添加以下环境变量：
   - `OPENAI_API_KEY`：你的 OpenAI API 密钥
   - `ZHIPU_API_KEY`：你的智谱 AI API 密钥

### 5. 配置域名
1. 在 Railway 控制台中，进入 "Settings" 标签页
2. 为前端和后端服务配置域名
3. 确保前端服务能够正确代理 API 请求到后端

## 项目配置说明

### 后端配置
- **Procfile**：定义了后端服务的启动命令
- **requirements.txt**：包含所有 Python 依赖
- **railway.json**：配置了后端服务的构建和启动命令

### 前端配置
- **.env**：配置了 API 基础 URL
- **api.js**：使用环境变量来配置 API 基础 URL
- **vite.config.js**：开发环境的代理配置

## 验证部署

### 1. 检查部署状态
```bash
railway status
```

### 2. 访问应用
- 前端：通过 Railway 提供的前端域名访问
- 后端 API：通过 Railway 提供的后端域名访问

### 3. 测试功能
- 访问前端页面
- 测试场景执行
- 测试模型切换
- 验证 API 密钥配置

## 故障排查

### 常见问题
1. **部署失败**：检查 Railway 控制台的日志
2. **API 连接失败**：检查环境变量配置
3. **CORS 错误**：确保后端 CORS 配置正确
4. **构建错误**：检查依赖安装是否成功

### 日志查看
```bash
railway logs
```

## 注意事项

1. **环境变量安全**：不要将 API 密钥提交到代码仓库
2. **构建缓存**：如果构建失败，尝试清除缓存
3. **资源限制**：Railway 免费计划有资源限制，注意监控使用情况
4. **域名配置**：确保域名正确指向服务

## 后续维护

1. **代码更新**：推送代码到 Git 仓库后，Railway 会自动部署
2. **环境变量更新**：在 Railway 控制台中更新
3. **监控**：使用 Railway 控制台监控服务状态
4. **缩放**：根据需要调整服务资源

---

部署完成后，你的 alfred_ 执行决策层项目将在 Railway 上运行，可以通过分配的域名访问。