import fp from 'fastify-plugin'
import redis, { FastifyRedisPluginOptions } from '@fastify/redis'

export default fp<FastifyRedisPluginOptions>(async (fastify) => {
  // 使用 fastify.config 获取环境变量配置
  await fastify.register(redis, {
    host: fastify.config.REDIS_HOST,
    port: fastify.config.REDIS_PORT,
    password: fastify.config.REDIS_PASSWORD || undefined,
    // 连接池配置
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false
  })

  fastify.log.info({
    host: fastify.config.REDIS_HOST,
    port: fastify.config.REDIS_PORT
  }, 'Redis connection initialized')
}, {
  name: 'redis',
  dependencies: ['env'], // 依赖 env 插件
})
