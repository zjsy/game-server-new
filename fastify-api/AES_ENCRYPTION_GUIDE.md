# AES 加密 API 使用指南

## 概述

Fastify API 使用 **AES-256-GCM** 对称加密保护桌台应用的所有敏感请求。

## 加密方案

### 1. 算法参数
- **算法**：AES-256-GCM
- **密钥长度**：256 bits (32 bytes)
- **IV 长度**：128 bits (16 bytes)
- **认证标签**：128 bits (16 bytes)

### 2. 请求格式

```json
{
  "encrypted": "base64_encrypted_data",
  "iv": "base64_iv",
  "authTag": "base64_auth_tag"
}
```

### 3. 原始数据格式（加密前）

```json
{
  "tableNo": "T001",
  "timestamp": 1699350000000,
  "data": {
    // 业务数据
    "countdown": 30,
    "roundNo": 123
  }
}
```

## C# 实现示例

### 安装 NuGet 包
```bash
Install-Package System.Security.Cryptography.Algorithms
```

### 加密工具类

```csharp
using System;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;

public class AesCryptoHelper
{
    private readonly byte[] _secretKey;

    public AesCryptoHelper(string secretKeyHex)
    {
        // 从 hex 字符串转换为 32 字节密钥
        _secretKey = HexStringToByteArray(secretKeyHex);
        if (_secretKey.Length != 32)
        {
            throw new ArgumentException("Secret key must be 32 bytes (64 hex chars)");
        }
    }

    /// <summary>
    /// 加密请求数据
    /// </summary>
    public EncryptedData EncryptRequest(string tableNo, object data)
    {
        var payload = new
        {
            tableNo = tableNo,
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            data = data
        };

        string json = JsonConvert.SerializeObject(payload);
        byte[] plainBytes = Encoding.UTF8.GetBytes(json);

        using (var aes = new AesGcm(_secretKey))
        {
            // 生成随机 IV
            byte[] iv = new byte[AesGcm.NonceByteSizes.MaxSize]; // 12 bytes for GCM
            RandomNumberGenerator.Fill(iv);

            // 加密
            byte[] cipherBytes = new byte[plainBytes.Length];
            byte[] tag = new byte[AesGcm.TagByteSizes.MaxSize]; // 16 bytes

            aes.Encrypt(iv, plainBytes, cipherBytes, tag);

            return new EncryptedData
            {
                Encrypted = Convert.ToBase64String(cipherBytes),
                Iv = Convert.ToBase64String(iv),
                AuthTag = Convert.ToBase64String(tag)
            };
        }
    }

    /// <summary>
    /// 解密响应数据
    /// </summary>
    public T DecryptResponse<T>(EncryptedData encryptedData)
    {
        byte[] cipherBytes = Convert.FromBase64String(encryptedData.Encrypted);
        byte[] iv = Convert.FromBase64String(encryptedData.Iv);
        byte[] tag = Convert.FromBase64String(encryptedData.AuthTag);

        using (var aes = new AesGcm(_secretKey))
        {
            byte[] plainBytes = new byte[cipherBytes.Length];
            aes.Decrypt(iv, cipherBytes, tag, plainBytes);

            string json = Encoding.UTF8.GetString(plainBytes);
            return JsonConvert.DeserializeObject<T>(json);
        }
    }

    private static byte[] HexStringToByteArray(string hex)
    {
        int length = hex.Length;
        byte[] bytes = new byte[length / 2];
        for (int i = 0; i < length; i += 2)
        {
            bytes[i / 2] = Convert.ToByte(hex.Substring(i, 2), 16);
        }
        return bytes;
    }
}

public class EncryptedData
{
    [JsonProperty("encrypted")]
    public string Encrypted { get; set; }

    [JsonProperty("iv")]
    public string Iv { get; set; }

    [JsonProperty("authTag")]
    public string AuthTag { get; set; }
}
```

### API 客户端示例

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class TableApiClient
{
    private readonly HttpClient _httpClient;
    private readonly AesCryptoHelper _crypto;
    private readonly string _tableNo;

    public TableApiClient(string apiBaseUrl, string secretKey, string tableNo)
    {
        _httpClient = new HttpClient { BaseAddress = new Uri(apiBaseUrl) };
        _crypto = new AesCryptoHelper(secretKey);
        _tableNo = tableNo;
    }

    /// <summary>
    /// 发送加密请求
    /// </summary>
    private async Task<TResponse> SendEncryptedRequest<TResponse>(
        string endpoint, 
        object data)
    {
        // 1. 加密数据
        var encrypted = _crypto.EncryptRequest(_tableNo, data);

        // 2. 发送 HTTP 请求
        string jsonPayload = JsonConvert.SerializeObject(encrypted);
        var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(endpoint, content);
        response.EnsureSuccessStatusCode();

        // 3. 解析响应
        string responseJson = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<TResponse>(responseJson);
    }

    /// <summary>
    /// 开局
    /// </summary>
    public async Task<ApiResponse> StartGame(int countdown)
    {
        return await SendEncryptedRequest<ApiResponse>(
            "/api/table/start-game",
            new { countdown }
        );
    }

    /// <summary>
    /// 发牌
    /// </summary>
    public async Task<ApiResponse> Dealing(string[] cards)
    {
        return await SendEncryptedRequest<ApiResponse>(
            "/api/table/dealing",
            new { cards }
        );
    }

    /// <summary>
    /// 结算
    /// </summary>
    public async Task<ApiResponse> Settle(int roundId, string result)
    {
        return await SendEncryptedRequest<ApiResponse>(
            "/api/table/settle",
            new { roundId, result }
        );
    }
}

public class ApiResponse
{
    [JsonProperty("success")]
    public bool Success { get; set; }

    [JsonProperty("message")]
    public string Message { get; set; }

    [JsonProperty("data")]
    public object Data { get; set; }
}
```

### 使用示例

```csharp
// 初始化客户端
var client = new TableApiClient(
    apiBaseUrl: "http://localhost:3000",
    secretKey: "your_64_character_hex_secret_key_here_000000000000000000000000",
    tableNo: "T001"
);

// 开局
try
{
    var result = await client.StartGame(countdown: 30);
    Console.WriteLine($"开局成功: {result.Message}");
}
catch (Exception ex)
{
    Console.WriteLine($"开局失败: {ex.Message}");
}

// 发牌
var cards = new[] { "DA", "H2", "S3", "C4" };
var dealingResult = await client.Dealing(cards);

// 结算
var settleResult = await client.Settle(roundId: 123, result: "player");
```

## 配置密钥

### 生成密钥（Node.js）

```bash
cd fastify-api
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

输出示例：
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### 配置到环境变量

**fastify-api/.env**
```env
AES_SECRET_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**C# App.config**
```xml
<configuration>
  <appSettings>
    <add key="ApiBaseUrl" value="http://localhost:3000" />
    <add key="AesSecretKey" value="a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456" />
    <add key="TableNo" value="T001" />
  </appSettings>
</configuration>
```

## 安全建议

1. ✅ **密钥管理**：密钥存储在配置文件，不要硬编码
2. ✅ **HTTPS**：生产环境必须使用 HTTPS
3. ✅ **时间戳验证**：自动防重放攻击（5 分钟有效期）
4. ✅ **认证标签**：GCM 模式自动防篡改
5. ⚠️ **密钥轮换**：定期更换密钥（建议每季度）

## 故障排查

### 401 Unauthorized - Decryption failed

**原因**：
- 密钥不匹配
- 时间戳过期（超过 5 分钟）
- 加密格式错误

**解决**：
1. 检查 C# 和 Node.js 使用相同的密钥
2. 检查客户端和服务器时间同步
3. 确认 IV 长度为 12 bytes（GCM 标准）

### 400 Bad Request - Invalid encrypted request format

**原因**：请求 body 缺少 `encrypted`、`iv` 或 `authTag` 字段

**解决**：确保发送完整的 `EncryptedData` 对象

## API 端点

| 端点 | 方法 | 是否加密 | 说明 |
|------|------|----------|------|
| `/api/table/start-game` | POST | ✅ | 开局 |
| `/api/table/dealing` | POST | ✅ | 发牌 |
| `/api/table/settle` | POST | ✅ | 结算 |
| `/api/table/info` | GET | ❌ | 查询桌台信息（可选加密） |

## 总结

使用 AES-256-GCM 加密的优势：
- ✅ **简单**：无需 token 管理，只需共享密钥
- ✅ **安全**：防篡改、防重放
- ✅ **性能**：对称加密速度快
- ✅ **无状态**：适合水平扩展

适合你这种内部桌台应用的场景！
