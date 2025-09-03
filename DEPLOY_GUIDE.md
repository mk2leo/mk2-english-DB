# 详细部署指南 - 使用Neon数据库

## 第一步：创建Neon数据库

### 1.1 注册Neon账户
1. 访问 [https://console.neon.tech/](https://console.neon.tech/)
2. 点击"Sign Up"注册账户
3. 可以使用GitHub账户快速注册

### 1.2 创建新项目
1. 登录后点击"Create Project"
2. 输入项目名称（例如：vocab-app）
3. 选择免费套餐（Free tier）
4. 选择离您最近的区域
5. 点击"Create Project"

### 1.3 获取连接字符串
1. 项目创建完成后，进入项目仪表板
2. 点击"Connection Details"
3. 复制"Connection String"，格式如下：
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

## 第二步：部署到Vercel

### 2.1 使用Vercel CLI部署

```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 在项目目录中登录Vercel
vercel login

# 3. 部署项目
vercel

# 4. 设置环境变量
vercel env add DATABASE_URL
# 粘贴您的Neon连接字符串

# 5. 重新部署以应用环境变量
vercel --prod
```

### 2.2 使用GitHub + Vercel网站部署

1. **推送代码到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **在Vercel中部署**
   - 访问 [https://vercel.com](https://vercel.com)
   - 点击"New Project"
   - 选择"Import Git Repository"
   - 选择您的GitHub仓库
   - 点击"Import"

3. **配置环境变量**
   - 在项目设置中找到"Environment Variables"
   - 添加新变量：
     - Name: `DATABASE_URL`
     - Value: 您的Neon连接字符串
   - 点击"Save"

4. **部署**
   - 点击"Deploy"按钮
   - 等待部署完成

## 第三步：验证部署

### 3.1 检查部署状态
1. 访问您的Vercel应用URL
2. 应该能看到英文单词学习应用界面
3. 应用会自动创建示例数据

### 3.2 测试功能
1. **测试主题管理**
   - 点击"新增"按钮添加新主题
   - 测试删除主题功能

2. **测试单词管理**
   - 添加新的英文单词
   - 测试自动翻译功能
   - 测试删除单词功能

3. **测试测验功能**
   - 点击"开始测验"
   - 完成测验并查看分数

## 第四步：监控和维护

### 4.1 查看日志
1. 在Vercel仪表板中点击"Functions"
2. 查看API调用日志
3. 检查是否有错误信息

### 4.2 数据库监控
1. 在Neon控制台中查看数据库使用情况
2. 监控连接数和查询性能

## 常见问题解决

### Q1: 部署后显示"加载数据失败"
**解决方案：**
1. 检查`DATABASE_URL`环境变量是否正确设置
2. 确认Neon连接字符串格式正确
3. 检查Vercel函数日志获取详细错误信息

### Q2: 无法添加新主题或单词
**解决方案：**
1. 检查Neon数据库连接是否正常
2. 确认数据库表是否已正确创建
3. 查看浏览器控制台是否有JavaScript错误

### Q3: 翻译功能不工作
**解决方案：**
1. 这是正常的，翻译API有使用限制
2. 可以手动输入中文翻译
3. 或者考虑集成其他翻译服务

### Q4: 如何更新代码
**解决方案：**
1. 修改本地代码
2. 推送到GitHub：`git push`
3. Vercel会自动重新部署

## 环境变量说明

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | Neon数据库连接字符串 | `postgresql://user:pass@host/db?sslmode=require` |

## 数据库表结构

应用会自动创建以下表结构：

```sql
-- 主题表
CREATE TABLE topics (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 单词表
CREATE TABLE words (
    id VARCHAR(50) PRIMARY KEY,
    topic_id VARCHAR(50) NOT NULL,
    en VARCHAR(100) NOT NULL,
    zh VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);
```

## 性能优化建议

1. **数据库连接**
   - Neon提供连接池，无需手动管理
   - 每次API调用都会自动建立连接

2. **缓存策略**
   - 前端会缓存已加载的数据
   - 切换主题时会重新加载数据

3. **错误处理**
   - 所有API调用都有错误处理
   - 用户会看到友好的错误提示

## 安全注意事项

1. **环境变量**
   - 不要在代码中硬编码数据库连接字符串
   - 使用Vercel环境变量管理敏感信息

2. **数据库访问**
   - Neon连接字符串包含密码，请妥善保管
   - 定期更换数据库密码

3. **API安全**
   - 当前版本没有用户认证
   - 如需多用户支持，需要添加认证机制

## 扩展功能建议

1. **用户认证**
   - 集成Vercel Auth
   - 支持多用户数据隔离

2. **数据备份**
   - 定期导出数据
   - 集成云存储服务

3. **性能监控**
   - 集成Vercel Analytics
   - 监控API响应时间

4. **移动端支持**
   - 添加PWA功能
   - 优化移动端体验