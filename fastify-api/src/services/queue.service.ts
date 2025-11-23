import type { FastifyInstance } from 'fastify'
import { Redis } from 'ioredis'
import { BroadcastQueueService } from './queues/broadcast-queue.service.js'
import { SettleQueueService } from './queues/settle-queue.service.js'

/**
 * 队列管理器
 * 统一管理所有队列服务,提供统一的入口
 */
export class QueueManager {
  public broadcast: BroadcastQueueService
  // 可以继续添加更多队列服务...
  public settlement: SettleQueueService
  // public notification: NotificationQueueService
  // public emailQueue: EmailQueueService

  constructor (fastify: FastifyInstance) {
    const redis = new Redis({
      port: fastify.config.BULLMQ_REDIS_PORT || 6379,
      host: fastify.config.BULLMQ_REDIS_HOST || 'localhost',
      password: fastify.config.BULLMQ_REDIS_PASSWORD,
      maxRetriesPerRequest: null,  // 必须设置为 null
    })
    // 初始化各个队列服务
    this.broadcast = new BroadcastQueueService(fastify, redis)
    this.settlement = new SettleQueueService(fastify, redis)

    fastify.log.info('QueueManager initialized successfully')
  }

  /**
   * 获取所有队列的健康状态
   */
  async getHealth () {
    const [broadcastHealth, settlementHealth] = await Promise.all([
      this.broadcast.getHealth(),
      this.settlement.getHealth(),
    ])

    return {
      broadcast: broadcastHealth,
      settlement: settlementHealth,

    }
  }

  /**
   * 关闭所有队列
   */
  async closeAll (): Promise<void> {
    await Promise.all([
      this.broadcast.close(),
      this.settlement.close(),
    ])
  }
}
