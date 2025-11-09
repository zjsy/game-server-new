import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { createEncryptionMiddleware } from '../middlewares/encryption.js'

/**
 * AES 加密插件
 * 注册加密中间件到 Fastify 实例
 */

declare module 'fastify' {
  interface FastifyInstance {
    encryptionMiddleware: ReturnType<typeof createEncryptionMiddleware>
  }
}

const encryptionPlugin: FastifyPluginAsync = async (fastify) => {
  const secretKey = ''// fastify.config.AES_SECRET_KEY

  if (!secretKey) {
    throw new Error('AES_SECRET_KEY is not configured in environment')
  }

  // 允许明文请求开关（用于测试/联调）
  const allowPlain = Boolean((fastify.config as unknown as { AES_ALLOW_PLAIN?: unknown }).AES_ALLOW_PLAIN)

  // 创建加密中间件实例并注册到 fastify
  const middleware = createEncryptionMiddleware(secretKey, 300, allowPlain) // 5 分钟有效期
  fastify.decorate('encryptionMiddleware', middleware)

  fastify.log.info('AES encryption plugin loaded')
}

export default fp(encryptionPlugin, {
  name: 'encryption',
  dependencies: ['env'],
})
