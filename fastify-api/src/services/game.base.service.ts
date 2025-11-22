import { FastifyInstance } from 'fastify'
import { GameRepository } from '../repositories/game.repository.js'
import { GameBroadcastService } from '../infrastructure/centrifugo.service.js'
import { GameType, OrderStatus, RoundStatus, UserType } from '../constants/game.constants.js'
import { BetOrder, BetTempOrder, Round } from '../types/table.types.js'
import { TableRepository } from '../repositories/table.repository.js'
import { PushConst } from '../constants/push.onstants.js'
import { UserRepository } from '../repositories/user.repository.js'
import { QueueManager } from './queue.service.js'
import { SettleRoundData } from '../types/common.types.js'

export class GameBaseService {
  protected tableRepository: TableRepository
  protected userRepository: UserRepository
  protected gameRepository: GameRepository
  protected queueService?: QueueManager // 可选依赖
  protected broadcastService?: GameBroadcastService // 可选依赖
  constructor (private fastify: FastifyInstance) {
    this.tableRepository = this.fastify.repositories.table
    this.userRepository = this.fastify.repositories.user
    this.gameRepository = this.fastify.repositories.game

    this.broadcastService = this.fastify.gameBroadcast
  }

  async cancelOrders (oldRoundStatus: RoundStatus, roundInfo: Round) {
    if (oldRoundStatus === RoundStatus.Dealing) {
      this.gameRepository.insertRoundCache(roundInfo.table_id, roundInfo.game_type, {
        id: roundInfo.id,
        status: roundInfo.status,
      })
      this.tableRepository.updateTableCache(roundInfo.table_id, { play_status: RoundStatus.Cancel })
      // 清除redis当前局所有人下注信息
      this.userRepository.delUserRoundBetStateCache(roundInfo.id)
      this.broadcastService?.globalBroadcast(PushConst.CANCEL_RESULT, {
        tableId: roundInfo.table_id,
        roundId: roundInfo.id,
      })
    } else {
      // !判断当前局是否在前端显示范围之内，是的话需要通知前端
      const cRoundList = await this.gameRepository.getRoundListCache(roundInfo.table_id)
      const l = cRoundList.length
      // 从后开始循环，如果找到了就修改一下
      for (let i = l - 1; i > -1; i--) {
        const cRound = JSON.parse(cRoundList[i])
        if (cRound.id === roundInfo.id) {
          // 推送结果信息
          this.broadcastService?.globalBroadcast(PushConst.CANCEL_RESULT, {
            tableId: roundInfo.table_id,
            roundId: roundInfo.id,
          })
          // 修改redis种这局的信息
          this.gameRepository.updateRoundCache(roundInfo.table_id, i, {
            id: roundInfo.id,
            result: roundInfo.result,
            details: roundInfo.details,
            status: roundInfo.status,
          })
          break
        }
      }
      if (roundInfo.game_type === GameType.Roulette) {
        // ?轮盘重新统计所有
        this.gameRepository.initRoultteStatsCache(roundInfo.table_id, true)
        this.gameRepository.initRoultterankingCache(roundInfo.table_id, true)
      }
    }
    // 如果是在开牌中取消，直接改了结果就推送前端消息
    if (oldRoundStatus === RoundStatus.Dealing) {
      const tempBetOrders = await this.gameRepository.getTempOrderListByRoundId(roundInfo.id)
      for (const tempOrder of tempBetOrders) {
        // 结算后的输赢之和，取反(负)，就是要返回的金额
        const reverMoney = tempOrder.bet_amount
        const order: Partial<BetOrder> = {
          lobby_no: tempOrder.lobby_no,
          table_no: tempOrder.table_no,
          dealer: tempOrder.dealer,
          user_id: tempOrder.user_id,
          username: tempOrder.username,
          agent_id: tempOrder.agent_id,
          round_id: tempOrder.round_id,
          table_id: tempOrder.table_id,
          shoe_no: tempOrder.shoe_no,
          round_no: tempOrder.round_no,
          bet_time: tempOrder.bet_time,
          bet_amount: tempOrder.bet_amount,
          currency: tempOrder.currency,
          bet_source: tempOrder.bet_source,
          game_type: tempOrder.game_type,
          bet: tempOrder.bet,
          bet_ip: tempOrder.bet_ip,
          user_type: tempOrder.user_type,
          status: OrderStatus.Cancel,
          settle_time: roundInfo.settle_time,
        }

        const insertId = await this.gameRepository.insertBetOrder(order)
        order.id = insertId
        this.gameRepository.detelteTempOrderListByRoundId(tempOrder.id)
        this.queueService?.settlement?.schedule('cancel', order as BetOrder, roundInfo.round_sn, reverMoney)
      }
    } else {
      const betOrders = await this.gameRepository.getOrderListByRoundId(roundInfo.id, [
        'id',
        'bet_amount',
        'settle_result',
        'game_type',
        'round_id',
        'status',
        'user_id',
        'agent_id',
        'username',
        'table_id',
        'currency',
        'bet_time',
        'rolling',
        'user_type',
        'comm',
      ])
      for (const order of betOrders) {
        // 结算后的输赢之和，取反(负)，就是要返回的金额
        const reverMoney = -order.settle_result

        this.gameRepository.updateBetOrderById(order.id, {
          rolling: 0,
          settle_result: 0,
          status: OrderStatus.Cancel,
          settle_time: roundInfo.settle_time
        })
        this.queueService?.settlement?.schedule('cancel', order, roundInfo.round_sn, reverMoney)
        if (order.user_type === UserType.Player) {
          // 判断是否是今天
          if (order.bet_time.getTime() > new Date(new Date().toLocaleDateString()).getTime()) {
            this.userRepository.updateUserBetStats(order.user_id, {
              today_rolling: -order.rolling,
              today_winlose: reverMoney,
              total_rolling: -order.rolling,
              total_winlose: reverMoney,
            })
          } else {
            this.userRepository.updateUserBetStats(order.user_id, {
              today_rolling: -order.rolling,
              today_winlose: reverMoney,
            })
          }
        }
      }
    }
  }

  protected async saveOrderData (tempOrder: BetTempOrder, settleRoundData: SettleRoundData<any>, rolling:number, comm:number, winLose:number) {
    const order: Partial<BetOrder> = {
      lobby_no: tempOrder.lobby_no,
      table_no: tempOrder.table_no,
      user_id: tempOrder.user_id,
      username: tempOrder.username,
      agent_id: tempOrder.agent_id,
      round_id: tempOrder.round_id,
      dealer: tempOrder.dealer,
      table_id: tempOrder.table_id,
      shoe_no: tempOrder.shoe_no,
      round_no: tempOrder.round_no,
      bet_time: tempOrder.bet_time,
      bet_amount: tempOrder.bet_amount,
      currency: tempOrder.currency,
      bet_source: tempOrder.bet_source,
      game_type: tempOrder.game_type,
      bet: tempOrder.bet,
      bet_ip: tempOrder.bet_ip,
      user_type: tempOrder.user_type,
      rolling,
      comm,
      round_details: settleRoundData.details,
      round_result: JSON.stringify(settleRoundData.result),
      settle_result: winLose,
      status: OrderStatus.Settled,
      settle_time: new Date(),
    }
    const insertId = await this.gameRepository.insertBetOrder(order)
    order.id = insertId
    await this.gameRepository.detelteTempOrderListByRoundId(tempOrder.id)
    if (order.user_type === UserType.Player) {
      // 占成和佣金计算
      await this.userRepository.updateUserBetStats(
        tempOrder.user_id,
        {
          today_rolling: rolling,
          today_winlose: winLose,
          total_rolling: rolling,
          total_winlose: winLose,
          continuous_win: winLose >= 0 ? 1 : 0,
        }
      )
    }
    return order
  }

  protected async updateBetStatsResettle (userId:number, winLose:number, rolling:number, betTime:Date) {
    if (betTime.getTime() > (new Date()).setHours(0, 0, 0, 0)) {
      await this.userRepository.updateUserBetStats(userId, {
        today_rolling: rolling,
        today_winlose: winLose,
        total_rolling: rolling,
        total_winlose: winLose,
      })
    } else {
      await this.userRepository.updateUserBetStats(userId, {
        total_rolling: rolling,
        total_winlose: winLose,
      })
    }
  }
}
