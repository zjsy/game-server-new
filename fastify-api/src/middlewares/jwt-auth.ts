import { FastifyRequest, FastifyReply } from 'fastify'

/**
 * JWT 鉴权中间件
 * 用于桌台端 API 的身份验证
 */

export interface AuthenticatedRequest extends FastifyRequest {
  tableNo?: string
  tableId?: number  // JWT 中的桌台 ID，避免与 FastifyRequest.id 冲突
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
    const payload = request.user as { tableNo?: string; tableId?: number }

    authRequest.tableNo = payload.tableNo
    authRequest.tableId = payload.tableId

    request.log.debug({ tableNo: payload.tableNo, tableId: payload.tableId }, 'JWT verified successfully')
  } catch (err) {
    request.log.error({ err }, 'JWT verification failed')
    return reply.code(401).send({
      error: 'Unauthorized',
      message: err instanceof Error ? err.message : 'Invalid or expired token',
    })
  }
}
