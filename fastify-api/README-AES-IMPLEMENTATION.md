# AES 对称加密方案实现总结

## ✅ 已完成的工作

### 1. **核心加密工具** (`src/utils/crypto.ts`)
- ✅ AES-256-GCM 加密/解密函数
- ✅ 自动时间戳验证（防重放攻击，默认 5 分钟有效期）
- ✅ 密钥生成工具
- ✅ 简化的请求加密/解密函数

### 2. **Fastify 加密插件** (`src/plugins/encryption.ts`)
- ✅ 自动解密请求中间件 `fastify.encryptedRoute()`
- ✅ 可选的响应加密功能
- ✅ 从解密数据中提取 `tableNo`、`timestamp`
- ✅ 友好的错误处理

### 3. **环境配置** (`src/plugins/env.ts`)
- ✅ 添加 `AES_SECRET_KEY` 配置项
- ✅ 更新 `.env.example` 示例

### 4. **示例路由** (`src/routes/api/table/index.ts`)
- ✅ `/api/table/start-game` - 开局（加密）
- ✅ `/api/table/dealing` - 发牌（加密）
- ✅ `/api/table/settle` - 结算（加密）
- ✅ `/api/table/info` - 查询（可选加密）

### 5. **文档**
- ✅ C# 完整实现示例 (`AES_ENCRYPTION_GUIDE.md`)
- ✅ 使用指南和安全建议
- ✅ 测试工具 (`test-encryption.js`)

---

## 🎯 方案优势

### ✅ 无需传统会话管理
- **无 Cookie**：适合 C# WPF 桌面应用
- **无 Session 存储**：无需 Redis Session、过期管理
- **无 Token 刷新**：无需登录、续期、黑名单

### ✅ 简单安全
```
C# App → AES 加密请求 → Fastify API → 验证解密 → 业务逻辑 → Centrifugo 推送
```

- 对称加密性能高
- 自动防重放（时间戳）
- GCM 模式防篡改
- 只需共享一个密钥

### ✅ 易于实现
**C# 端**：
```csharp
var encrypted = crypto.EncryptRequest("T001", new { countdown = 30 });
await httpClient.PostAsync("/api/table/start-game", encrypted);
```

**Node.js 端**：
```typescript
fastify.post('/start-game', {
  preHandler: [fastify.encryptedRoute()]
}, async (request) => {
  const tableNo = request.tableNo  // 自动解密
  const data = request.decryptedBody
  // 业务逻辑...
})
```

---

## 📋 使用步骤

### 1. 生成密钥
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 配置环境变量
```env
# .env
AES_SECRET_KEY=your_64_character_hex_key_here
```

### 3. C# 客户端配置
```csharp
var client = new TableApiClient(
    "http://localhost:3000",
    "your_64_character_hex_key_here",  // 与服务端相同
    "T001"
);
```

### 4. 发送请求
```csharp
await client.StartGame(countdown: 30);
```

---

## 🔐 安全特性

| 特性 | 说明 |
|------|------|
| **加密算法** | AES-256-GCM（NIST 推荐） |
| **密钥长度** | 256 bits (32 bytes) |
| **防重放** | 时间戳验证（默认 5 分钟） |
| **防篡改** | GCM 认证标签 |
| **随机 IV** | 每次请求生成新 IV |

---

## 🆚 对比其他方案

| 方案 | 本方案 | JWT Token | HTTP Session |
|------|--------|-----------|--------------|
| **实现复杂度** | ⭐ 简单 | ⭐⭐ 中等 | ⭐⭐⭐ 复杂 |
| **适合桌面应用** | ✅ 是 | ✅ 是 | ❌ 否（需 Cookie） |
| **需要状态管理** | ❌ 否 | ⚠️ 可选（黑名单） | ✅ 是 |
| **性能** | ⭐⭐⭐ 高 | ⭐⭐ 中 | ⭐ 低（需查询） |
| **可撤销性** | ❌ 更换密钥 | ⚠️ 需黑名单 | ✅ 直接删除 |
| **水平扩展** | ✅ 易 | ✅ 易 | ⚠️ 需共享存储 |

---

## ⚠️ 注意事项

### 1. **密钥管理**
- ❌ 不要硬编码密钥
- ✅ 存储在环境变量或配置文件
- ✅ 定期更换密钥（建议每季度）
- ✅ 密钥泄露需立即全部更换

### 2. **HTTPS**
- ⚠️ 虽然请求已加密，但生产环境仍建议使用 HTTPS
- 防止中间人攻击和流量分析

### 3. **时间同步**
- ✅ 确保客户端和服务器时间同步
- 默认允许 5 分钟时间差
- 可在 `decryptRequest()` 中调整 `maxAgeSeconds`

### 4. **密钥轮换策略**
```typescript
// 支持多密钥验证（用于密钥轮换过渡期）
const keys = [currentKey, oldKey]
for (const key of keys) {
  try {
    return decryptRequest(encrypted, key)
  } catch {}
}
throw new Error('All keys failed')
```

---

## 📚 相关文件

- **实现代码**：
  - `src/utils/crypto.ts` - 加密工具
  - `src/plugins/encryption.ts` - Fastify 插件
  - `src/plugins/env.ts` - 环境配置
  - `src/routes/api/table/index.ts` - 示例路由

- **文档**：
  - `AES_ENCRYPTION_GUIDE.md` - C# 实现指南
  - `README-AES-IMPLEMENTATION.md` - 本文件

- **配置**：
  - `.env.example` - 环境变量示例

- **测试**：
  - `test-encryption.js` - 加密功能测试

---

## 🎉 总结

使用 AES 对称加密的方案：
- ✅ **简单**：无需复杂的会话管理
- ✅ **安全**：防篡改、防重放
- ✅ **高效**：对称加密性能优异
- ✅ **适用**：完美适合桌面应用场景

**你的架构现在是**：
```
C# WPF App (加密) → HTTP API (解密 + 业务逻辑) → Centrifugo (推送)
```

无需任何会话管理，直接开始开发业务逻辑！🚀
