# 快速开始指南

## 1. 确认环境变量

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

## 2. 启动项目

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
npm run build

# 启动
npm start
```

## 3. 访问 API

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

## 4. 查看日志

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


Others
1. node项目不推荐应用内写日志文件
