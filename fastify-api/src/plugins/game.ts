import fp from 'fastify-plugin'
import { GameBroadcastService } from '../infrastructure/centrifugo.service.js'
import { QueueManager } from '../services/queue.service.js'
import { LockService } from '../infrastructure/lock.service.js'
import { ApiService } from '../infrastructure/api.service.js'

declare module 'fastify' {
  interface FastifyInstance {
    gameBroadcast: GameBroadcastService
    queueManager: QueueManager
    lockManager: LockService
    apiService: ApiService
  }
}

export default fp(async (fastify) => {
  // console.warn('Initializing game plugin', fastify.config)
  // 创建单例服务
  const gameBroadcast = new GameBroadcastService(fastify)

  // 队列管理器
  const queueManager = new QueueManager(fastify)

  // 锁管理器
  const lockManager = new LockService(fastify)

  // API 服务
  const apiService = new ApiService(fastify)

  // 注册到 fastify 实例
  fastify.decorate('gameBroadcast', gameBroadcast)
  fastify.decorate('queueManager', queueManager)
  fastify.decorate('lockManager', lockManager)
  fastify.decorate('apiService', apiService)

  // 优雅关闭
  fastify.addHook('onClose', async () => {
    await queueManager.closeAll()
  })
})
