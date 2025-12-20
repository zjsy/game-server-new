import { Job, type RedisClient } from 'bullmq'
import type { FastifyInstance } from 'fastify'
import { BaseQueueService } from './base-queue.service.js'
import { RoundStatus } from '../../constants/game.constants.js'
import { PushConst } from '../../constants/push.constants.js'

interface StopBettingJob {
  tableId: number
  roundId: number
  timestamp: number
}

/**
 * 停止下注队列服务
 * 处理游戏停止下注的定时任务
 */
export class StopBettingQueueService extends BaseQueueService<StopBettingJob> {
  constructor (fastify: FastifyInstance, redis: RedisClient) {
    super(fastify, 'game-stop-betting', redis, {
      defaultJobOptions: {
        attempts: 5, // 停注业务更重要,重试次数更多
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    })
  }

  /**
   * 处理停止下注任务
   */
  protected async processJob (job: Job<StopBettingJob>): Promise<void> {
    const { tableId, roundId, timestamp } = job.data

    // 幂等性检查：确保不重复处理
    if (await this.isProcessed(tableId, roundId)) {
      this.fastify.log.info(`Job already processed: ${job.id}`)
      return
    }

    // 执行停注逻辑
    await this.handleStopBetting(tableId, roundId)

    // 标记为已处理
    await this.markProcessed(tableId, roundId)

    // 记录延迟指标
    const delay = Date.now() - timestamp
    this.fastify.log.info(
      { tableId, roundId, delay },
      `Stop betting processed, delay: ${delay}ms`
    )
  }

  /**
   * 调度停止下注任务
   */
  async schedule (
    tableId: number,
    roundId: number,
    delayMs: number
  ): Promise<void> {
    await this.addJob(
      {
        tableId,
        roundId,
        timestamp: Date.now() + delayMs,
      },
      {
        delay: delayMs,
        jobId: `stop-betting:${tableId}:${roundId}`, // 防止重复
      }
    )
  }

  /**
   * 取消停止下注任务
   */
  async cancel (tableId: number, roundId: number): Promise<void> {
    const jobId = `stop-betting:${tableId}:${roundId}`
    await this.removeJob(jobId)
  }

  /**
   * 检查任务是否已处理（幂等性）
   */
  private async isProcessed (tableId: number, roundId: number): Promise<boolean> {
    const key = `game:processed:${tableId}:${roundId}:stopBetting`
    const exists = await this.redis.exists(key)
    return exists === 1
  }

  /**
   * 标记任务为已处理
   */
  private async markProcessed (tableId: number, roundId: number): Promise<void> {
    const key = `game:processed:${tableId}:${roundId}:stopBetting`
    await this.redis.setex(key, 600, '1') // 保留 10 分钟
  }

  /**
   * 执行停止下注业务逻辑
   */
  private async handleStopBetting (tableId: number, roundId: number): Promise<void> {
    // 停止定时推送下注统计的任务
    this.fastify.queueManager.broadcast.stopRepeat(tableId)
    const repositories = this.fastify.repositories
    // 一定要重新获取桌信息
    const tableInfoCache = await repositories.table.findTableCache(tableId)
    if (!tableInfoCache) {
      return
    }
    const currentRoundId = Number(tableInfoCache.current_round_id)
    // 判断是否还是当前局,并且状态还在倒计时状态
    if (
      currentRoundId === roundId &&
          Number(tableInfoCache.play_status) === RoundStatus.Betting
    ) {
      // 局状态和结束时间改变
      repositories.game.updateRoundById(currentRoundId, { status: RoundStatus.Dealing, end_time: new Date() })
      // 更新redis
      repositories.table.updateTableCache(tableId, { play_status: RoundStatus.Dealing })
      // 广播停止下注消息
      const { statsC: betStatsC, statsN: betStatsN } = await repositories.game.getBetStatsCache(tableId)
      this.fastify.gameBroadcast?.globalBroadcast(PushConst.END_COUNTDOWN, {
        tableId,
        roundId,
        betStatsC,
        betStatsN,
      })
    }
  }
}
