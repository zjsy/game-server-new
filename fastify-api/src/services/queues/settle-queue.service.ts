import { Job, RedisClient } from 'bullmq'
import type { FastifyInstance } from 'fastify'
import { BaseQueueService } from './base-queue.service.js'
import { TransactionsType, UserType, UserWalletType } from '../../constants/game.constants.js'
import { PushConst } from '../../constants/push.constants.js'
import { v1 as uuidv1 } from 'uuid'
import { GameApiResponse } from '../../infrastructure/api.service.js'
import { UserRepository } from '../../repositories/user.repository.js'
import { BetOrder } from '../../entities/BetOrder.js'
import { UserWalletRow } from '../../entities/UserWallet.js'

type SettleType = 'settle' | 'resettle' | 'cancel'
interface SettleJob {
  type: SettleType
  tableId: number
  roundSn: string
  change: number
  order: BetOrder
}

/**
 * 停止下注队列服务
 * 处理游戏停止下注的定时任务
 */
export class SettleQueueService extends BaseQueueService<SettleJob> {
  constructor (fastify: FastifyInstance, redis: RedisClient) {
    super(fastify, 'game-settle', redis, {
      defaultJobOptions: {
        attempts: 5, // 结算业务更重要,重试次数更多
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
  protected async processJob (job: Job<SettleJob>): Promise<void> {
    const { type, tableId, roundSn, order, change } = job.data

    // 幂等性检查：确保不重复处理
    if (await this.isProcessed(type, tableId, order.id)) {
      this.fastify.log.info(`Job already processed: ${job.id}`)
      return
    }

    // 执行结算逻辑
    switch (type) {
      case 'settle':
        await this.handleSettle(order, roundSn, change)
        break
      case 'resettle':
        await this.handleResettle(order, roundSn, change)
        break
      case 'cancel':
        await this.handleCancel(order, roundSn, change)
        break
    }

    // 标记为已处理
    await this.markProcessed(type, tableId, order.id)
  }

  /**
   * 调度结算任务
   */
  async schedule (type: SettleType, order: BetOrder, roundSn: string, change:number): Promise<void> {
    await this.addJob(
      {
        type,
        tableId: order.table_id,
        roundSn,
        order,
        change
      },
      {
        jobId: `${type}:${order.table_id}:${order.id}`, // 防止重复
      }
    )
  }

  /**
   * 取消结算任务
   */
  async cancel (type: SettleType, tableId: number, orderId: number): Promise<void> {
    const jobId = `${type}:${tableId}:${orderId}`
    await this.removeJob(jobId)
  }

  /**
   * 检查任务是否已处理（幂等性）
   */
  private async isProcessed (type: SettleType, tableId: number, orderId: number): Promise<boolean> {
    const key = `game:processed:${tableId}:${orderId}:${type}`
    const exists = await this.redis.exists(key)
    return exists === 1
  }

  /**
   * 标记任务为已处理
   */
  private async markProcessed (type: SettleType, tableId: number, orderId: number): Promise<void> {
    const key = `game:processed:${tableId}:${orderId}:${type}`
    await this.redis.setex(key, 600, '1') // 保留 10 分钟
  }

  /**
   * 执行结算业务逻辑
   */
  private async handleSettle (order: BetOrder, roundSn: string, change:number): Promise<void> {
    const userRepository = this.fastify.repositories.user
    // 用户如果登出了，延迟删除redis数据，基本可以从reids查到,再这个方法还做了从数据库
    const userInfo = await userRepository.getUserCache(order.user_id)
    // 判断是钱包类型
    if (Number(userInfo.wallet_type) === UserWalletType.Single) {
      // 请求接口
      const requestData = {
        username: userInfo.username,
        currency: order.currency,
        betTime: order.bet_time,
        betAmount: order.bet_amount,
        amount: change,
        winLose: order.settle_result,
        txd: uuidv1().replace(/-/g, ''),
        gameType: order.game_type,
        tableId: order.table_no,
        gameId: roundSn,
        rolling: order.rolling,
        payout_time: order.settle_time,
        gameInfos: order.round_details,
        betInfos: order.bet,
      }

      const settleRes: GameApiResponse = await this.fastify.apiService.settle(userInfo.agent_sn, requestData)
      // 存交易号到数据库
      if (order.user_type === UserType.Player) {
        await userRepository.insert('game_transactions', {
          transaction_no: requestData.txd,
          user_id: order.user_id,
          agent_id: order.agent_id,
          username: order.username,
          type: TransactionsType.Settle,
          change: requestData.amount,
          after_balance: settleRes.amount ?? 0,
          remark: requestData.gameId
        })
      }

      this.handleSuccess(userRepository, order, settleRes.amount ?? 0)
    } else {
      // 只有当结算余额大于0,才更新余额,以前是0,也新增结算变化
      //! 必须使用数据库事务
      await userRepository.transaction(async (conn) => {
        await userRepository.updateBalance(order.user_id, change, conn)
        const walletInfo = await userRepository.find<UserWalletRow>('game_user_wallets', { user_id: order.user_id }, ['user_id', 'balance'])
        if (order.user_type === UserType.Player) {
          await userRepository.insert('game_transactions', {
            user_id: order.user_id,
            agent_id: userInfo.agent_id,
            username: order.username,
            type: TransactionsType.Settle,
            change,
            after_balance: walletInfo!.balance,
            remark: roundSn
          })
        }
        this.handleSuccess(userRepository, order, walletInfo!.balance)
      })
    }
  }

  private async handleSuccess (userRepository:UserRepository, order: BetOrder, newBalance: number): Promise<void> {
    // 更新用户临时redis点数
    await userRepository.updateUserPointCache(order.id, newBalance)
    // 发送个人消息
    const broadcastService = this.fastify.gameBroadcast
    broadcastService?.pushMsgByPlayerId(order.user_id, PushConst.ON_SETTLE, { tableId: order.table_id, balance: newBalance, winLose: order.settle_result })

    // 广播小房间输赢(结算动画由前端计算输赢，可能不准)
    // this.app.rpc.room.roomRemote.push7RoomPointUpdate.route(order.table_id)(order.table_id, {
    //   userId: userInfo.id,
    //   point: newBalance,
    // })
  }

  private async handleResettle (order: BetOrder, roundSn: string, change:number): Promise<void> {
    const userRepository = this.fastify.repositories.user
    const userInfo = await userRepository.getUserCache(order.user_id)
    // 判断是钱包类型
    if (Number(userInfo.wallet_type) === UserWalletType.Single) {
      // 请求接口
      const settleData = {
        username: userInfo.username,
        currency: order.currency,
        betTime: order.bet_time,
        betAmount: order.bet_amount,
        amount: change,
        winLose: order.settle_result,
        txd: uuidv1().replace(/-/g, ''),
        gameType: order.game_type,
        tableId: order.table_no,
        gameId: roundSn,
        rolling: order.rolling,
        payout_time: order.settle_time,
        gameInfos: order.round_details ? order.round_details : order.round_result ? order.round_result : null,
        betInfos: order.bet,
      }

      const res: GameApiResponse = await this.fastify.apiService.reSettle(userInfo.agent_sn, settleData)
      // 存交易号到数据库
      if (order.user_type === UserType.Player) {
        await userRepository.insert('game_transactions', {
          transaction_no: settleData.txd,
          user_id: order.user_id,
          agent_id: userInfo.agent_id,
          username: order.username,
          type: TransactionsType.Settle,
          change: settleData.amount,
          after_balance: res.amount ?? 0,
          remark: settleData.gameId
        })
      }

      this.handleSuccess(userRepository, order, res.amount ?? 0)
    } else {
      //! 必须使用数据库事务
      await userRepository.transaction(async (conn) => {
        await userRepository.updateBalance(order.user_id, change, conn)
        const walletInfo = await userRepository.find<UserWalletRow>('game_user_wallets', { user_id: order.user_id }, ['user_id', 'balance'])
        if (order.user_type === UserType.Player) {
          await userRepository.insert('game_transactions', {
            user_id: order.user_id,
            agent_id: userInfo.agent_id,
            username: order.username,
            type: TransactionsType.Settle,
            change,
            after_balance: walletInfo!.balance,
            remark: roundSn
          })
        }
        this.handleSuccess(userRepository, order, walletInfo!.balance)
      })
    }
  }

  private async handleCancel (order: BetOrder, roundSn: string, change:number): Promise<void> {
    const userRepository = this.fastify.repositories.user
    const userInfo = await userRepository.getUserCache(order.user_id)
    if (Number(userInfo.wallet_type) === UserWalletType.Single) {
      const requestData = {
        txd: uuidv1().replace(/-/g, ''),
        betAmount: order.bet_amount,
        betTime: order.bet_time,
        username: userInfo.username,
        currency: order.currency,
        amount: change,
        tableId: order.table_no,
        gameId: roundSn,
        gameType: order.game_type,
        time: order.settle_time,
        betInfos: order.bet,
      }

      const res: GameApiResponse = await this.fastify.apiService.cancelRound(userInfo.agent_sn, requestData)
      // 存交易号到数据库
      if (order.user_type === UserType.Player) {
        await userRepository.insert('game_transactions', {
          transaction_no: requestData.txd,
          user_id: order.user_id,
          agent_id: order.agent_id,
          username: order.username,
          type: TransactionsType.Cancel,
          change: requestData.amount,
          after_balance: res.amount ?? 0,
          remark: requestData.gameId
        })
      }

      this.handleSuccess(userRepository, order, res.amount ?? 0)
    } else {
      // 只有当结算余额大于0,才更新余额,以前是0,也新增结算变化
      //! 必须使用数据库事务
      await userRepository.transaction(async (conn) => {
        await userRepository.updateBalance(order.user_id, change, conn)
        const walletInfo = await userRepository.find<UserWalletRow>('game_user_wallets', { user_id: order.user_id }, ['user_id', 'balance'])
        if (order.user_type === UserType.Player) {
          await userRepository.insert('game_transactions', {
            user_id: order.user_id,
            agent_id: userInfo.agent_id,
            username: order.username,
            type: TransactionsType.Cancel,
            change,
            after_balance: walletInfo!.balance,
            remark: roundSn
          })
        }
        this.handleSuccess(userRepository, order, walletInfo!.balance)
      })
    }
  }
}
