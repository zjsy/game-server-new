# JWT 鉴权使用指南

本项目已从 AES 对称加密改为 JWT 鉴权方式进行 API 认证。

## 快速开始

### 1. 环境配置

在 `.env` 文件中配置 JWT 相关参数：

```env
# JWT 鉴权配置
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRES_IN=24h
```

**重要**: 生产环境请使用强随机字符串作为 `JWT_SECRET`

### 2. 生成 Token

在使用需要鉴权的 API 之前，首先需要获取 JWT token。

**请求示例**:
```bash
POST /auth/generate-token
Content-Type: application/json

{
  "tableNo": "A001",
  "userId": "dealer001"  // 可选，默认使用 tableNo
}
```

**响应示例**:
```json
{
  "code": true,
  "msg": "Token generated successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tableNo": "A001",
    "userId": "dealer001"
  }
}
```

### 3. 使用 Token 访问受保护的 API

在请求头中添加 `Authorization` 字段，使用 Bearer Token 方式：

**请求示例**:
```bash
POST /api/bacc/start-game
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "countdown": 60
}
```

**cURL 示例**:
```bash
curl -X POST http://localhost:3000/api/bacc/start-game \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"countdown": 60}'
```

**JavaScript/Fetch 示例**:
```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

fetch('http://localhost:3000/api/bacc/start-game', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ countdown: 60 })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 受保护的路由

以下路由需要 JWT 鉴权：

### Bacc 游戏路由
- `POST /api/bacc/start-game` - 开局
- `POST /api/bacc/dealing` - 发牌
- `POST /api/bacc/settle` - 结算

### Table 路由
- `POST /api/table/table-login` - 桌台登录
- `POST /api/table/dealer-login` - 荷官登录
- `POST /api/table/table-maintain` - 桌台维护

## Token 验证

可以使用以下端点验证 token 是否有效：

```bash
GET /auth/verify-token
Authorization: Bearer YOUR_JWT_TOKEN
```

**成功响应**:
```json
{
  "code": true,
  "msg": "Token is valid",
  "data": {
    "valid": true,
    "tableNo": "A001",
    "userId": "dealer001"
  }
}
```

## Token 过期时间

默认 token 有效期为 24 小时，可通过 `JWT_EXPIRES_IN` 环境变量配置：

- `1h` - 1小时
- `24h` - 24小时
- `7d` - 7天
- `30d` - 30天

## 错误处理

### 401 Unauthorized
当 token 无效、过期或缺失时返回：

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**解决方案**: 重新调用 `/auth/generate-token` 获取新的 token

### 400 Bad Request
请求参数错误：

```json
{
  "error": "tableNo is required"
}
```

## 与旧版 AES 加密的区别

| 特性 | AES 加密 (旧) | JWT 鉴权 (新) |
|------|--------------|--------------|
| 认证方式 | 每次请求加密整个 body | 使用 token 进行认证 |
| 请求格式 | `{encrypted, iv, authTag}` | 标准 JSON + Authorization header |
| 性能 | 每次请求需加解密 | 只需验证签名 |
| 可读性 | 请求内容加密，不可读 | 请求内容明文，易于调试 |
| Token 管理 | 无 | 支持过期时间管理 |
| 标准化 | 自定义方案 | 业界标准 (RFC 7519) |

## 注意事项

1. **Token 安全**: 请妥善保管 JWT token，不要在客户端代码中硬编码或暴露
2. **HTTPS**: 生产环境务必使用 HTTPS 传输，防止 token 被截获
3. **Token 刷新**: 当 token 即将过期时，建议提前获取新 token
4. **密钥安全**: `JWT_SECRET` 必须保密，不要提交到版本控制系统

## 开发调试

使用 Postman 或其他 API 测试工具：

1. 先调用 `/auth/generate-token` 获取 token
2. 在后续请求的 Authorization 选项卡中选择 "Bearer Token"
3. 粘贴获取的 token
4. 发送请求

## 迁移指南

如果你之前使用 AES 加密方式，迁移到 JWT 需要：

1. ✅ 更新环境变量配置（添加 JWT_SECRET）
2. ✅ 修改客户端代码，先获取 token
3. ✅ 修改 API 调用，使用 Authorization header 而不是加密 body
4. ✅ 更新错误处理逻辑

## 技术支持

如有问题，请查看：
- Fastify JWT 文档: https://github.com/fastify/fastify-jwt
- JWT 标准: https://jwt.io/
