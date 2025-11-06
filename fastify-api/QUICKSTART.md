# 快速开始指南

## 1. 初始化数据库

在启动项目前，请先初始化数据库表：

```bash
# 方式1：直接导入
mysql -h 127.0.0.1 -P 3306 -u root -proot fggame < db/init/01_users.sql

# 方式2：使用 MySQL 客户端
mysql -h 127.0.0.1 -P 3306 -u root -proot
```

在 MySQL 客户端中执行：
```sql
USE fggame;
source /app/db/init/01_users.sql;
```

## 2. 确认环境变量

检查 `.env` 文件配置是否正确：

```bash
cat .env
```

主要配置项：
- `RDS_HOST_WRITE` 和 `RDS_HOST_READ`: 数据库主机地址
- `DB_PORT`: 数据库端口
- `DB_DATABASE`: 数据库名称（fggame）
- `DB_USERNAME`: 数据库用户名
- `DB_PASSWORD`: 数据库密码

## 3. 启动项目

### 开发模式（推荐）

```bash
npm run dev
```

这会：
1. 自动编译 TypeScript
2. 启动 Fastify 服务器
3. 监听文件变化并自动重启

### 生产模式

```bash
# 编译
npm run build:ts

# 启动
npm start
```

## 4. 访问 API

### Swagger UI（推荐）

打开浏览器访问：
```
http://localhost:3000/docs
```

在这里你可以：
- 📖 查看所有 API 接口文档
- 🧪 直接在浏览器中测试 API
- 📝 查看请求/响应示例

### 测试 API 接口

#### 根路由（健康检查）
```bash
curl http://localhost:3000/
```

#### 获取用户列表
```bash
curl http://localhost:3000/api/users
```

#### 创建新用户
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com"
  }'
```

#### 获取用户详情
```bash
curl http://localhost:3000/api/users/1
```

#### 更新用户
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updated_user",
    "email": "updated@example.com"
  }'
```

#### 删除用户
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## 5. 查看日志

服务器会输出详细的日志信息，包括：
- 请求/响应日志
- 数据库操作日志
- 插件加载日志

开发环境使用 `pino-pretty` 格式化输出，方便阅读。

## 常见问题

### 数据库连接失败

检查：
1. MySQL 服务是否运行
2. `.env` 中的数据库配置是否正确
3. 数据库 `fggame` 是否已创建
4. 用户名密码是否正确

### 端口被占用

如果 3000 端口被占用，可以修改启动命令：
```bash
fastify start -l info -p 3001 dist/app.js
```

### TypeScript 编译错误

重新编译：
```bash
npm run build:ts
```

## 项目特性

✅ **完整的 RESTful API**: CRUD 操作
✅ **Swagger 文档**: 自动生成 API 文档
✅ **类型安全**: TypeScript 全栈类型检查
✅ **数据验证**: JSON Schema 自动验证请求
✅ **读写分离**: MySQL 主从配置
✅ **日志记录**: 结构化日志输出
✅ **环境配置**: @fastify/env 统一管理

## 下一步

- 查看 `API_DEMO.md` 了解详细的 API 文档
- 查看 `src/` 目录了解代码结构
- 在 Swagger UI 中测试所有接口
- 尝试修改代码，体验热重载

祝使用愉快！🚀
