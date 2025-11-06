import fp from 'fastify-plugin'
import mysql, { FastifyMySQLOptions } from '@fastify/mysql'

export default fp<FastifyMySQLOptions>(async (fastify) => {
  // 使用 fastify.config 获取环境变量配置
  const writeConfig = {
    host: fastify.config.RDS_HOST_WRITE,
    port: fastify.config.DB_PORT,
    database: fastify.config.DB_DATABASE,
    user: fastify.config.DB_USERNAME,
    password: fastify.config.DB_PASSWORD,
  }

  const readConfig = {
    host: fastify.config.RDS_HOST_READ,
    port: fastify.config.DB_PORT,
    database: fastify.config.DB_DATABASE,
    user: fastify.config.DB_USERNAME,
    password: fastify.config.DB_PASSWORD,
  }

  // 注册写库连接
  await fastify.register(mysql, {
    promise: true,
    ...writeConfig,
    name: 'write', // 命名连接以便区分
  })

  // 注册读库连接
  await fastify.register(mysql, {
    promise: true,
    ...readConfig,
    name: 'read', // 命名连接以便区分
  })

  fastify.log.info('MySQL connections (write/read) initialized')
}, {
  name: 'mysql',
  dependencies: ['env'], // 依赖 env 插件
})
