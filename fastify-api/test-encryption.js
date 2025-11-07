/**
 * AES 加密测试工具
 * 用于测试加密解密功能
 */

import { generateSecretKey, encryptRequest, decryptRequest } from './dist/utils/crypto.js'

// 1. 生成一个测试密钥
console.log('=== 生成测试密钥 ===')
const testKey = generateSecretKey()
console.log('密钥 (hex):', testKey)
console.log('密钥长度:', testKey.length, '字符 (32 bytes)\n')

// 2. 加密测试数据
console.log('=== 加密测试 ===')
const tableNo = 'T001'
const testData = {
  roundNo: 123,
  countdown: 30,
  gameType: 'baccarat',
}

console.log('原始数据:', JSON.stringify({ tableNo, data: testData }, null, 2))

const encrypted = encryptRequest(tableNo, testData, testKey)
console.log('\n加密结果:')
console.log('- encrypted:', encrypted.encrypted.substring(0, 50) + '...')
console.log('- iv:', encrypted.iv)
console.log('- authTag:', encrypted.authTag)

// 3. 解密测试
console.log('\n=== 解密测试 ===')
try {
  const decrypted = decryptRequest(encrypted, testKey, 300)
  console.log('解密成功!')
  console.log('桌台:', decrypted.tableNo)
  console.log('时间戳:', new Date(decrypted.timestamp).toISOString())
  console.log('数据:', JSON.stringify(decrypted.data, null, 2))
} catch (err) {
  console.error('解密失败:', err instanceof Error ? err.message : err)
}

// 4. 测试错误情况
console.log('\n=== 错误情况测试 ===')

// 错误的密钥
console.log('1. 使用错误的密钥解密:')
const wrongKey = generateSecretKey()
try {
  decryptRequest(encrypted, wrongKey, 300)
  console.log('❌ 不应该成功')
} catch (err) {
  console.log('✅ 正确拒绝:', err instanceof Error ? err.message : err)
}

// 过期的时间戳
console.log('\n2. 测试时间戳验证:')
const oldData = encryptRequest(tableNo, testData, testKey)
// 模拟 1 秒的最大时间差（很快会过期）
setTimeout(() => {
  try {
    decryptRequest(oldData, testKey, 0.5) // 0.5 秒有效期
    console.log('❌ 不应该成功')
  } catch (err) {
    console.log('✅ 正确拒绝过期请求:', err instanceof Error ? err.message : err)
  }
}, 1000)

console.log('\n=== 测试完成 ===')
console.log('\n提示：')
console.log('1. 将上面生成的密钥配置到 .env 文件中')
console.log('2. C# 客户端使用相同的密钥')
console.log('3. 确保客户端和服务器时间同步（用于时间戳验证）')
