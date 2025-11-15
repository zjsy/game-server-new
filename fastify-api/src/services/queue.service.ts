import type { FastifyInstance } from 'fastify'
import { StopBettingQueueService } from './queues/stop-betting-queue.service.js'
import { BroadcastQueueService } from './queues/broadcast-queue.service.js'
import { SettleQueueService } from './queues/settle-queue.service.js'

/**
 * 队列管理器
 * 统一管理所有队列服务,提供统一的入口
 */
export class QueueManager {
  public stopBetting: StopBettingQueueService
  public broadcast: BroadcastQueueService
  // 可以继续添加更多队列服务...
  public settlement: SettleQueueService
  // public notification: NotificationQueueService
  // public emailQueue: EmailQueueService

  constructor (fastify: FastifyInstance) {
    // 初始化各个队列服务
    this.stopBetting = new StopBettingQueueService(fastify)
    this.broadcast = new BroadcastQueueService(fastify)
    this.settlement = new SettleQueueService(fastify)

    fastify.log.info('QueueManager initialized successfully')
  }

  /**
   * 获取所有队列的健康状态
   */
  async getHealth () {
    const [stopBettingHealth, broadcastHealth] = await Promise.all([
      this.stopBetting.getHealth(),
      this.broadcast.getHealth(),
    ])

    return {
      stopBetting: stopBettingHealth,
      broadcast: broadcastHealth,
    }
  }

  /**
   * 关闭所有队列
   */
  async closeAll (): Promise<void> {
    await Promise.all([
      this.stopBetting.close(),
      this.broadcast.close(),
    ])
  }
}
