# 英文单词学习应用 - Neon数据库版本

这是一个使用Vercel内置Neon数据库的英文单词学习应用。

## 功能特点

- 📚 主题管理：创建、删除学习主题
- 📝 单词管理：添加、删除英文单词和中文翻译
- 🔊 语音播放：支持英文单词发音
- 🧠 测验模式：测试学习效果
- 🌐 自动翻译：集成翻译API
- 💾 数据备份：支持导入导出功能
- 🗄️ 云端存储：使用Neon PostgreSQL数据库

## 部署到Vercel（使用Neon数据库）

### 步骤1：准备Neon数据库

1. 访问 [Neon Console](https://console.neon.tech/)
2. 创建免费账户
3. 创建新项目
4. 获取连接字符串（Connection String）

### 步骤2：部署到Vercel

#### 方法A：使用Vercel CLI（推荐）

```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 在项目目录中登录
vercel login

# 3. 部署项目
vercel

# 4. 设置环境变量
vercel env add DATABASE_URL
# 粘贴您的Neon连接字符串

# 5. 重新部署以应用环境变量
vercel --prod
```

#### 方法B：使用GitHub + Vercel网站

1. 将代码推送到GitHub仓库
2. 访问 [vercel.com](https://vercel.com)
3. 点击"New Project"
4. 导入您的GitHub仓库
5. 在项目设置中添加环境变量：
   - 名称：`DATABASE_URL`
   - 值：您的Neon连接字符串
6. 点击"Deploy"

### 步骤3：验证部署

1. 访问您的Vercel应用URL
2. 应用会自动创建数据库表和示例数据
3. 测试添加新主题和单词功能

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 设置环境变量：
```bash
export DATABASE_URL="your_neon_connection_string"
```

3. 启动开发服务器：
```bash
npm run dev
```

## API接口

### 主题管理
- `GET /api/topics` - 获取所有主题
- `POST /api/topics` - 创建新主题
- `DELETE /api/topics/:id` - 删除主题

### 单词管理
- `GET /api/words/:topicId` - 获取主题的单词列表
- `POST /api/words` - 添加新单词
- `DELETE /api/words/:id` - 删除单词

## 数据库结构

应用会自动创建以下表：

### topics表
- `id`: 主题ID（主键）
- `name`: 主题名称
- `created_at`: 创建时间

### words表
- `id`: 单词ID（主键）
- `topic_id`: 主题ID（外键）
- `en`: 英文单词
- `zh`: 中文翻译
- `created_at`: 创建时间

## 技术栈

- 前端：HTML, CSS, JavaScript (原生)
- 后端：Node.js, Vercel Serverless Functions
- 数据库：Neon PostgreSQL
- 部署：Vercel

## 环境变量

- `DATABASE_URL`: Neon数据库连接字符串（必需）

## 注意事项

1. 确保Neon连接字符串正确配置
2. 首次部署后，应用会自动创建数据库表和示例数据
3. 翻译功能使用免费的MyMemory API，有使用限制
4. 语音功能需要现代浏览器支持

## 故障排除

如果遇到问题：

1. 检查Neon连接字符串是否正确
2. 确认Vercel环境变量已正确设置
3. 查看Vercel函数日志获取详细错误信息
4. 确保Neon数据库允许来自Vercel的连接

## 许可证

MIT License