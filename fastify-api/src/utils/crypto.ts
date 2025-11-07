import crypto from 'crypto'

/**
 * AES-256-GCM 加密解密工具
 * 用于 C# 桌台应用和 Fastify API 之间的安全通信
 */

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits

export interface EncryptedData {
  encrypted: string // Base64 编码的加密数据
  iv: string // Base64 编码的 IV
  authTag: string // Base64 编码的认证标签（GCM 模式）
}

export interface DecryptedRequest {
  data: unknown // 解密后的业务数据
  tableNo: string // 桌台编号
  timestamp: number // 请求时间戳
}

/**
 * 加密数据
 * @param data 要加密的数据（会被 JSON.stringify）
 * @param secretKey 密钥（32 字节的 hex 字符串或 Buffer）
 * @returns 加密结果
 */
export function encrypt (data: unknown, secretKey: string): EncryptedData {
  // 生成随机 IV
  const iv = crypto.randomBytes(IV_LENGTH)

  // 确保密钥是 Buffer
  const key = Buffer.isBuffer(secretKey)
    ? secretKey
    : Buffer.from(secretKey, 'hex')

  if (key.length !== KEY_LENGTH) {
    throw new Error(`Secret key must be ${KEY_LENGTH} bytes (64 hex chars)`)
  }

  // 创建加密器
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  // 加密数据
  const jsonData = JSON.stringify(data)
  let encrypted = cipher.update(jsonData, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  // 获取认证标签
  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

/**
 * 解密数据
 * @param encryptedData 加密的数据
 * @param secretKey 密钥（32 字节的 hex 字符串或 Buffer）
 * @returns 解密后的原始数据
 */
export function decrypt (encryptedData: EncryptedData, secretKey: string): unknown {
  try {
    // 确保密钥是 Buffer
    const key = Buffer.isBuffer(secretKey)
      ? secretKey
      : Buffer.from(secretKey, 'hex')

    if (key.length !== KEY_LENGTH) {
      throw new Error(`Secret key must be ${KEY_LENGTH} bytes (64 hex chars)`)
    }

    // 解析 IV 和 authTag
    const iv = Buffer.from(encryptedData.iv, 'base64')
    const authTag = Buffer.from(encryptedData.authTag, 'base64')

    // 创建解密器
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // 解密数据
    let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return JSON.parse(decrypted)
  } catch (err) {
    throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

/**
 * 验证请求时间戳（防重放攻击）
 * @param timestamp 请求时间戳
 * @param maxAgeSeconds 允许的最大时间差（秒）
 * @returns 是否有效
 */
export function validateTimestamp (timestamp: number, maxAgeSeconds: number = 300): boolean {
  const now = Date.now()
  const diff = Math.abs(now - timestamp)
  return diff <= maxAgeSeconds * 1000
}

/**
 * 生成 AES 密钥（用于初始化）
 * @returns 32 字节的随机密钥（hex 格式）
 */
export function generateSecretKey (): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * 简化的加密函数（自动添加时间戳和桌台信息）
 * @param tableNo 桌台编号
 * @param data 业务数据
 * @param secretKey 密钥
 * @returns 加密结果
 */
export function encryptRequest (tableNo: string, data: unknown, secretKey: string): EncryptedData {
  const payload = {
    tableNo,
    timestamp: Date.now(),
    data,
  }
  return encrypt(payload, secretKey)
}

/**
 * 简化的解密函数（自动验证时间戳）
 * @param encryptedData 加密数据
 * @param secretKey 密钥
 * @param maxAgeSeconds 允许的最大时间差
 * @returns 解密后的数据
 */
export function decryptRequest (
  encryptedData: EncryptedData,
  secretKey: string,
  maxAgeSeconds: number = 300
): DecryptedRequest {
  const decrypted = decrypt(encryptedData, secretKey) as { tableNo?: string, timestamp?: number, data?: unknown }

  // 验证必需字段
  if (!decrypted.tableNo || !decrypted.timestamp || !decrypted.data) {
    throw new Error('Invalid request format: missing required fields')
  }

  // 验证时间戳
  if (!validateTimestamp(decrypted.timestamp, maxAgeSeconds)) {
    throw new Error(`Request expired: timestamp ${decrypted.timestamp} is too old`)
  }

  return {
    tableNo: decrypted.tableNo,
    timestamp: decrypted.timestamp,
    data: decrypted.data,
  }
}
