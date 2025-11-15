import { FastifyRequest, FastifyReply } from 'fastify'
import { decryptRequest, EncryptedData } from '../utils/crypto.js'

/**
 * AES 加密中间件
 * 用于桌台端 API 的请求解密
 */

export interface EncryptedRequest extends FastifyRequest {
  decryptedBody?: unknown
  tableNo?: string
  requestTimestamp?: number
}

/**
 * 创建 AES 加密中间件
 * @param secretKey AES 密钥
 * @param maxAgeSeconds 时间戳有效期（秒），默认 300 秒（5 分钟）
 */
export function createEncryptionMiddleware (secretKey: string, maxAgeSeconds: number = 300, allowPlain: boolean = false) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as unknown as Record<string, unknown> | null

      // 情况 A：标准加密请求 { encrypted, iv, authTag }
      if (body && typeof body === 'object' && 'encrypted' in body && 'iv' in body && 'authTag' in body) {
        const decrypted = decryptRequest(body as unknown as EncryptedData, secretKey, maxAgeSeconds)
        const encryptedRequest = request as EncryptedRequest
        encryptedRequest.decryptedBody = decrypted.data
        encryptedRequest.tableNo = decrypted.tableNo
        encryptedRequest.requestTimestamp = decrypted.timestamp

        request.log.debug({ tableNo: decrypted.tableNo, timestamp: decrypted.timestamp }, 'Request decrypted successfully')
        return
      }

      // 情况 B：允许明文（测试/联调用）
      if (allowPlain) {
        const encryptedRequest = request as EncryptedRequest

        // 支持三种来源的 tableNo：body.tableNo / header[x-table-no] / query.tableNo
        const headerTableNo = (request.headers['x-table-no'] || request.headers['x-tableno']) as string | undefined
        const q = request.query as unknown as Record<string, unknown> | null
        const queryTableNo = q?.tableNo as string | undefined
        const bodyTableNo = body?.tableNo as string | undefined
        const tableNo = bodyTableNo || headerTableNo || queryTableNo

        // 明文时，兼容两种负载：
        // 1) 包装格式 { tableNo, data: {...} }
        // 2) 直接业务数据 {...}
        const dataPayload = (body && typeof body === 'object' && 'data' in body) ? (body.data as unknown) : (body as unknown)

        encryptedRequest.decryptedBody = dataPayload
        if (tableNo) encryptedRequest.tableNo = tableNo
        // 明文模式不校验时间戳

        request.log.warn({ tableNo }, 'Plain request accepted (encryption disabled or allowPlain enabled)')
        return
      }

      // 不允许明文且不是加密格式
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid request format. Expected encrypted body or enable allowPlain.',
      })
    } catch (err) {
      request.log.error({ err }, 'Decryption failed')
      return reply.code(401).send({
        error: 'Unauthorized',
        message: err instanceof Error ? err.message : 'Decryption failed',
      })
    }
  }
}
