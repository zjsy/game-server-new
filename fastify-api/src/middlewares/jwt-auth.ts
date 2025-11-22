import { FastifyRequest, FastifyReply } from 'fastify'

/**
 * JWT 鉴权中间件
 * 用于桌台端 API 的身份验证
 */

export interface AuthenticatedRequest extends FastifyRequest {
  tableNo: string
  tableId: number  // JWT 中的桌台 ID，避免与 FastifyRequest.id 冲突
}

export interface JwtPayload {
  type: string
  tableNo: string
  tableId: number
  sessionId: string
}

/**
 * JWT 鉴权中间件
 * 从请求头中获取 Authorization Bearer token 并验证
 */
export async function jwtAuthMiddleware (request: FastifyRequest, reply: FastifyReply) {
  try {
    // 验证 JWT token
    await request.jwtVerify()

    // JWT 验证成功，payload 会自动添加到 request.user
    const authRequest = request as AuthenticatedRequest
    const payload = request.user as JwtPayload
    authRequest.tableNo = payload.tableNo
    authRequest.tableId = payload.tableId

    // 验证 sessionId 是否存在于 Redis 中
    if (!payload.sessionId) {
      request.log.warn('Missing sessionId in JWT payload')
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid token: missing session identifier',
      })
    }

    // 从 Redis 中获取存储的 sessionId
    const redisKey = `sys:session:table:${payload.tableId}`
    const storedSessionId = await request.server.redis.get(redisKey)

    // 验证 sessionId 是否匹配
    if (storedSessionId !== payload.sessionId) {
      request.log.warn({
        tableId: payload.tableId,
        expectedSessionId: storedSessionId,
        receivedSessionId: payload.sessionId
      }, 'SessionId mismatch - another client has logged in')

      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Session expired: another client has logged in',
      })
    }

    request.log.debug({
      tableNo: payload.tableNo,
      tableId: payload.tableId,
      sessionId: payload.sessionId
    }, 'JWT and session verified successfully')
  } catch (err) {
    request.log.error({ err }, 'JWT verification failed')
    return reply.code(401).send({
      error: 'Unauthorized',
      message: err instanceof Error ? err.message : 'Invalid or expired token',
    })
  }
}
