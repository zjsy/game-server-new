# User API Demo

这是一个完整的 Fastify + MySQL + Swagger 演示项目。

## 项目结构

```
src/
├── plugins/
│   ├── env.ts          # 环境变量配置
│   ├── mysql.ts        # MySQL 连接（读写分离）
│   ├── redis.ts        # Redis 连接
│   ├── swagger.ts      # Swagger API 文档
│   └── sensible.ts     # 工具插件
├── types/
│   ├── env.d.ts        # Fastify 类型扩展
│   └── user.types.ts   # 用户相关类型
├── schemas/
│   └── user.schema.ts  # 用户 API Schema（Swagger + 验证）
├── services/
│   └── user.service.ts # 用户业务逻辑层
└── routes/
    └── api/
        └── users/
            └── index.ts # 用户 API 路由
```

## 初始化数据库

运行初始化脚本创建用户表：

```bash
# 连接到 MySQL
mysql -h 127.0.0.1 -P 3306 -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS fggame;
USE fggame;

# 导入表结构
source db/init/01_users.sql;
```

或者使用命令行：

```bash
mysql -h 127.0.0.1 -P 3306 -u root -proot fggame < db/init/01_users.sql
```

## 启动项目

```bash
# 开发模式
npm run dev

# 或者构建后启动
npm run build:ts
npm start
```

## 访问 API 文档

启动后访问 Swagger UI：

```
http://localhost:3000/docs
```

## API 接口

### 1. 获取用户列表
```bash
GET /api/users?page=1&limit=10&keyword=alice
```

**响应示例：**
```json
{
  "total": 3,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": 1,
      "username": "alice",
      "email": "alice@example.com",
      "created_at": "2025-11-06T10:00:00.000Z",
      "updated_at": "2025-11-06T10:00:00.000Z"
    }
  ]
}
```

### 2. 创建用户
```bash
POST /api/users
Content-Type: application/json

{
  "username": "david",
  "email": "david@example.com"
}
```

### 3. 获取用户详情
```bash
GET /api/users/1
```

### 4. 更新用户
```bash
PUT /api/users/1
Content-Type: application/json

{
  "username": "alice_updated",
  "email": "alice_new@example.com"
}
```

### 5. 删除用户
```bash
DELETE /api/users/1
```

## 使用 curl 测试

```bash
# 获取用户列表
curl http://localhost:3000/api/users

# 创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com"}'

# 获取用户详情
curl http://localhost:3000/api/users/1

# 更新用户
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"username":"updated","email":"updated@example.com"}'

# 删除用户
curl -X DELETE http://localhost:3000/api/users/1
```

## 技术栈

- **框架**: Fastify 5.x
- **数据库**: MySQL 8.x（通过 @fastify/mysql）
- **缓存**: Redis（通过 @fastify/redis）
- **文档**: Swagger/OpenAPI（通过 @fastify/swagger）
- **配置**: @fastify/env
- **语言**: TypeScript 5.x

## 特性

✅ 完整的 CRUD 操作
✅ 读写分离（MySQL write/read）
✅ 类型安全（TypeScript）
✅ 自动 API 文档（Swagger）
✅ 请求验证（JSON Schema）
✅ 服务分层架构
✅ 日志记录
✅ 环境变量管理

## 架构说明

### 分层架构

1. **Routes（路由层）**: 处理 HTTP 请求，调用 Service
2. **Services（服务层）**: 业务逻辑，数据库操作
3. **Schemas（验证层）**: 请求/响应验证 + Swagger 文档
4. **Types（类型层）**: TypeScript 类型定义

### 读写分离

MySQL 插件配置了两个连接：
- `fastify.mysql.write`: 写操作（INSERT, UPDATE, DELETE）
- `fastify.mysql.read`: 读操作（SELECT）

### 自动文档生成

通过在路由中添加 `schema`，Fastify 会：
1. 自动验证请求参数
2. 自动生成 Swagger 文档
3. 提供类型推断

## 环境变量

查看 `.env` 文件配置：
- MySQL 主从配置
- Redis 配置
- 日志级别
- 服务器配置
