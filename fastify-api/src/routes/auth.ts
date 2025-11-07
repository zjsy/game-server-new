import { FastifyPluginAsync } from 'fastify'
import { success } from '../utils/http-utils.js'

/**
 * 认证相关路由
 */
const authRoute: FastifyPluginAsync = async (fastify) => {
  // POST /auth/generate-token - 生成JWT token
  fastify.post('/generate-token', async (request, reply) => {
    const { tableNo, userId } = request.body as { tableNo?: string; userId?: string }

    if (!tableNo) {
      return reply.code(400).send({ error: 'tableNo is required' })
    }

    try {
      // 生成JWT token
      const token = fastify.jwt.sign({
        tableNo,
        userId: userId || tableNo, // 如果没有提供userId，使用tableNo作为userId
      })

      return success({
        token,
        tableNo,
        userId: userId || tableNo,
      }, 'Token generated successfully')
    } catch (err) {
      fastify.log.error({ err }, 'Token generation failed')
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate token',
      })
    }
  })

  // GET /auth/verify-token - 验证JWT token
  fastify.get('/verify-token', {
    preHandler: [async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        })
      }
    }],
  }, async (request) => {
    const payload = request.user as { tableNo?: string; userId?: string }

    return success({
      valid: true,
      tableNo: payload.tableNo,
      userId: payload.userId,
    }, 'Token is valid')
  })
}

export default authRoute
