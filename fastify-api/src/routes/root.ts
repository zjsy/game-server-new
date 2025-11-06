import { FastifyPluginAsync } from 'fastify'

const root: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.get('/', async function (_request, _reply) {
    return {
      root: true,
      environment: {
        nodeEnv: fastify.config.NODE_ENV,
        logLevel: fastify.config.LOG_LEVEL,
        database: {
          write: fastify.config.RDS_HOST_WRITE,
          read: fastify.config.RDS_HOST_READ,
          name: fastify.config.DB_DATABASE
        }
      }
    }
  })
}

export default root
