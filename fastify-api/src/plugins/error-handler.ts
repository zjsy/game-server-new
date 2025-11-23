import type { FastifyPluginAsync, FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { BusinessError } from '../utils/http.utils.js'
import { ApiResponse } from '../types/response.types.js'

/**
 * 全局错误处理器插件
 * 统一处理业务异常，确保业务异常返回 HTTP 200 + 业务错误码
 * 非业务异常保持原样处理
 */
const errorHandler: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError | BusinessError, request: FastifyRequest, reply: FastifyReply) => {
    // 记录错误日志
    fastify.log.error({
      err: error,
      url: request.url,
      method: request.method,
      params: request.params,
      query: request.query,
      body: request.body
    }, 'Request error')

    // 如果是业务异常，返回 HTTP 200 + 业务错误码
    if (error instanceof BusinessError) {
      const response: ApiResponse<never> = {
        code: error.code,
        msg: error.message
      }
      return reply.status(200).send(response)
    }

    // 非业务异常保持原样，让 Fastify 默认处理
    // 这包括：验证错误、404、500 等 HTTP 错误
    throw error
  })
}

export default fp(errorHandler)
