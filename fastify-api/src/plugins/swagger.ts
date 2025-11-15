import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { FastifyPluginAsync } from 'fastify'

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  // 只在开发和测试环境启用 Swagger
  const enableSwagger = ['development', 'test'].includes(fastify.config.NODE_ENV)

  if (!enableSwagger) {
    fastify.log.info('Swagger is disabled in production environment')
    return
  }

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Fastify API',
        description: 'Fastify API 文档示例',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://localhost:${fastify.config.FASTIFY_CLOSE_GRACE_DELAY || 3000}`,
          description: fastify.config.NODE_ENV === 'development' ? '开发环境' : '测试环境'
        }
      ],
      tags: [
        { name: 'table', description: '桌登录登出相关接口' },
        { name: 'health', description: '健康检查' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  })

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    staticCSP: true
  })

  fastify.log.info(`Swagger UI enabled at /docs (${fastify.config.NODE_ENV} environment)`)
}

export default fp(swaggerPlugin, {
  name: 'swagger',
  dependencies: ['env']
})
