import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import jwt from '@fastify/jwt'

/**
 * JWT 鉴权插件
 * 用于桌台端 API 的身份验证
 */

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  const secret = fastify.config.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment')
  }

  // 注册 @fastify/jwt 插件
  await fastify.register(jwt, {
    secret,
    sign: {
      expiresIn: fastify.config.JWT_EXPIRES_IN || '24h', // 默认24小时过期
    },
  })

  fastify.log.info('JWT authentication plugin loaded')
}

export default fp(jwtPlugin, {
  name: 'jwt',
  dependencies: ['env'],
})
