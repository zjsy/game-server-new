import { FastifyRequest, FastifyReply } from 'fastify'
import { Table } from '../entities/TableInfo.js'

/**
 * JWT 鉴权中间件
 * 用于桌台端 API 的身份验证
 */

export interface AuthenticatedRequest extends FastifyRequest {
  tableId: number  // JWT 中的桌台 ID,避免与 FastifyRequest.id 冲突
  tableNo: string
}

export interface BaseJwtPayload {
  sub: string  // 主题,通常为用户标识
  type: string
  info?: Partial<Table>,
}

export interface JwtPayload extends BaseJwtPayload {
  iat: number // 签发时自动注入
  exp: number // 签发时自动注入
  jti: string // 签发时自动注入,JWT ID，用于唯一标识一次会话
}

/**
 * JWT 鉴权中间件
 * 从请求头中获取 Authorization Bearer token 并验证
 */
export async function jwtAuthMiddleware (request: FastifyRequest, reply: FastifyReply) {
  try {
    // 验证 JWT token
    await request.jwtVerify()

    // JWT 验证成功,payload 会自动添加到 request.user
    const authRequest = request as AuthenticatedRequest
    const payload = request.user as JwtPayload
    authRequest.tableId = Number(payload.sub)

    // 验证 sessionId 是否存在于 Redis 中
    if (!payload.jti) {
      request.log.warn('Missing sessionId in JWT payload')
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid token: missing session identifier',
      })
    }

    // 从 Redis 中获取存储的 sessionId
    const redisKey = `sys:session:table:${payload.sub}`
    const storedSessionId = await request.server.redis.get(redisKey)

    // 验证 sessionId 是否匹配
    if (storedSessionId !== payload.jti) {
      request.log.warn({
        tableId: payload.sub,
        expectedSessionId: storedSessionId,
        receivedSessionId: payload.jti
      }, 'SessionId mismatch - another client has logged in')

      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Session expired: another client has logged in',
      })
    }

    request.log.debug({
      tableId: Number(payload.sub),
      sessionId: payload.jti
    }, 'JWT and session verified successfully')
  } catch (err) {
    request.log.error({ err }, 'JWT verification failed')
    return reply.code(401).send({
      error: 'Unauthorized',
      message: err instanceof Error ? err.message : 'Invalid or expired token',
    })
  }
}
