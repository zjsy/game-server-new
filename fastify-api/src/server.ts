import Fastify from 'fastify'
import closeWithGrace from 'close-with-grace'
import app from './app.js'

// Read the .env file (Node.js 20.6.0+)
try {
  process.loadEnvFile?.('.env.production')
} catch {}

// Instantiate Fastify with some config
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
})

// Register your application as a normal plugin
await fastify.register(app)

// delay is the number of milliseconds for the graceful close to finish
const closeListeners = closeWithGrace(
  { delay: Number(process.env.FASTIFY_CLOSE_GRACE_DELAY) || 500 },
  async ({ err }) => {
    if (err) {
      fastify.log.error(err)
    }
    await fastify.close()
  }
)

fastify.addHook('onClose', async () => {
  closeListeners.uninstall()
})

// Start listening
try {
  const host = process.env.HOST || '0.0.0.0'
  const port = parseInt(process.env.PORT || '3000', 10)

  await fastify.listen({ host, port })

  // Notify PM2 that app is ready
  if (process.send) {
    process.send('ready')
  }
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
