import { FastifyPluginAsync } from 'fastify'

const root: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.get('/', async function (_request, _reply) {
    return 'FG Game Server Api is running!'
  })
  fastify.get('/health', async function (_request, _reply) {
    return { status: 'ok' }
  })
}

export default root
// Test watch at Fri Nov 14 05:35:31 UTC 2025
// Test comment
