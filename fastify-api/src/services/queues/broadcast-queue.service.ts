import { Job } from 'bullmq'
import type { FastifyInstance } from 'fastify'
import { BaseQueueService } from './base-queue.service.js'
import { PushConst } from '../../constants/push.onstants.js'

interface BroadcastJob {
  tableId: number
  roundId?: number
  data?: unknown
}

/**
 * 广播队列服务
 * 处理游戏数据的定时广播任务
 */
export class BroadcastQueueService extends BaseQueueService<BroadcastJob> {
  constructor (fastify: FastifyInstance) {
    super(fastify, 'game-broadcast', {
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: false,
      }
    })
  }

  /**
   * 设置并发数为 5
   */
  protected getConcurrency (): number {
    return 5
  }

  /**
   * 处理广播任务
   */
  protected async processJob (job: Job<BroadcastJob>): Promise<void> {
    const { tableId } = job.data
    await this.broadcastStats(tableId)
  }

  /**
   * 调度定时广播任务（重复执行）
   */
  async scheduleRepeat (tableId: number, intervalMs: number = 3000): Promise<void> {
    await this.addJob(
      {
        tableId,
      },
      {
        repeat: {
          every: intervalMs, // 每 N 毫秒执行一次
        },
        jobId: `broadcast:stats:${tableId}`, // 确保唯一
      }
    )
  }

  /**
   * 调度单次广播任务
   */
  async scheduleOnce (
    tableId: number,
    data?: unknown
  ): Promise<void> {
    await this.addJob({
      tableId,
      data,
    })
  }

  /**
   * 取消重复广播任务
   */
  async cancelRepeat (tableId: number): Promise<void> {
    const jobId = `broadcast:stats:${tableId}`
    const jobs = await this.getRepeatableJobs()
    const job = jobs.find((j) => j.id === jobId)

    if (job) {
      await this.removeRepeatableByKey(job.key)
      this.fastify.log.info({ tableId }, `Cancelled repeat broadcast for table ${tableId}`)
    }
  }

  /**
   * 广播统计数据
   */
  private async broadcastStats (tableId: number): Promise<void> {
    // TODO: 实现具体的广播统计数据逻辑
    this.fastify.log.debug({ tableId }, `Broadcasting stats for table ${tableId}`)
    const gameRepository = this.fastify.repositories.game
    const betStateC = await gameRepository.getBetStatsCCache(tableId)
    const betStateN = await gameRepository.getBetStatsNCache(tableId)
    this.fastify.gameBroadcast?.globalBroadcast(PushConst.UPDATE_BET_INFO, {
      tableId,
      betStateC,
      betStateN,
    })
  }

  /**
   * 广播失败时降低告警级别（因为广播不是关键业务）
   */
  protected onJobFailed (job: Job<BroadcastJob>, error: Error): void {
    // 广播失败不发送告警,只记录日志
    this.fastify.log.warn({
      jobId: job.id,
      tableId: job.data.tableId,
      error: error.message,
    }, `Broadcast job failed: ${job.id}`)
  }
}
