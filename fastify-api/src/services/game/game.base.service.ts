import { FastifyInstance } from 'fastify'
import { RoundStatus, GameType, OrderStatus, UserType, ResettleOrderFields } from '../../constants/game.constants.js'
import { PushConst } from '../../constants/push.constants.js'
import { BetOrder, BetTempOrder } from '../../entities/BetOrder.js'
import { Round } from '../../entities/RoundInfo.js'
import { GameBroadcastService } from '../../infrastructure/centrifugo.service.js'
import { GameRepository } from '../../repositories/game.repository.js'
import { TableRepository } from '../../repositories/table.repository.js'
import { UserRepository } from '../../repositories/user.repository.js'
import { SettleRoundData } from '../../types/game.types.js'
import { QueueManager } from '../queue.service.js'
import { BusinessError, ErrorCode } from '../../utils/http.utils.js'

export class GameBaseService {
  protected tableRepository: TableRepository
  protected userRepository: UserRepository
  protected gameRepository: GameRepository
  protected queueService: QueueManager
  protected broadcastService?: GameBroadcastService // 可选依赖
  constructor (protected fastify: FastifyInstance) {
    this.tableRepository = this.fastify.repositories.table
    this.userRepository = this.fastify.repositories.user
    this.gameRepository = this.fastify.repositories.game
    this.queueService = this.fastify.queueManager
    this.broadcastService = this.fastify.gameBroadcast
  }

  // 停止下注.所有游戏完全一样的
  async stopBet (tableId: number, roundId:number): Promise<void> {
    const tableCache = await this.tableRepository.findTableCache(tableId)
    if (!tableCache) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST)
    }
    // 判断是否还是当前局,并且状态还在倒计时状态
    if (tableCache.current_round_id === roundId && tableCache.play_status === RoundStatus.Betting) {
      // 手动停止下注,清理所有定时器
      this.queueService.broadcast.stopRepeat(tableId)
      const endTime = new Date()
      // 局状态和结束时间改变
      this.gameRepository.updateRoundById(roundId, { status: RoundStatus.Dealing, end_time: endTime })
      // 更新缓存
      this.tableRepository.updateTableCache(tableId, { play_status: RoundStatus.Dealing, round_end_time: endTime.getTime() })
      // 广播信息
      const { statsC: betStatsC, statsN: betStatsN } = await this.gameRepository.getBetStatsCache(tableId)
      this.broadcastService?.globalBroadcast(PushConst.END_COUNTDOWN, {
        tableId,
        roundId,
        betStatsC,
        betStatsN,
      })
    }
  }

  protected async cancelOrders (oldRoundStatus: RoundStatus, roundInfo: Pick<Round, 'status' | 'id' | 'table_no' | 'game_type' | 'table_id' | 'round_sn'>) {
    if (oldRoundStatus === RoundStatus.Dealing) {
      this.gameRepository.insertRoundCache(roundInfo.table_id, roundInfo.game_type, {
        id: roundInfo.id,
        status: roundInfo.status,
      })
      this.tableRepository.updateTableCache(roundInfo.table_id, { play_status: RoundStatus.Cancel })
      // 清除缓存中当前局所有人下注信息
      this.userRepository.delUserRoundBetStateCache(roundInfo.id)
      this.broadcastService?.globalBroadcast(PushConst.CANCEL_RESULT, {
        tableId: roundInfo.table_id,
        roundId: roundInfo.id,
      })
    } else {
      // !判断当前局是否在前端显示范围之内,是的话需要通知前端
      const cRoundList = await this.gameRepository.getRoundListCache(roundInfo.table_id)
      const l = cRoundList.length
      // 从后开始循环,如果找到了就修改一下
      for (let i = l - 1; i > -1; i--) {
        const cRound = JSON.parse(cRoundList[i])
        if (cRound.id === roundInfo.id) {
          // 推送结果信息
          this.broadcastService?.globalBroadcast(PushConst.CANCEL_RESULT, {
            tableId: roundInfo.table_id,
            roundId: roundInfo.id,
          })
          // 更新缓存中这局的信息
          this.gameRepository.updateRoundCache(roundInfo.table_id, i, {
            id: roundInfo.id,
            result: [],
            details: {},
            status: roundInfo.status,
          })
          break
        }
      }
      if (roundInfo.game_type === GameType.Roulette) {
        // !轮盘重新统计所有
        this.gameRepository.initRouletteStatsCache(roundInfo.table_id, true)
        this.gameRepository.initRouletteRankingCache(roundInfo.table_id, true)
      }
    }
    // 如果是在开牌中取消,直接改了结果就推送前端消息
    if (oldRoundStatus === RoundStatus.Dealing) {
      const tempBetOrders = await this.gameRepository.getTempOrderListByRoundId(roundInfo.id)
      for (const tempOrder of tempBetOrders) {
        // 结算后的输赢之和,取反(负),就是要返回的金额
        const reverseMoney = tempOrder.bet_amount
        const order = {
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
          settle_time: new Date(),
        }
        const orderRaw = { ...order, bet: JSON.stringify(tempOrder.bet) }
        const insertId = await this.gameRepository.insertBetOrder(orderRaw)
        const orderData = { ...order, id: insertId }
        this.gameRepository.deleteTempOrderById(tempOrder.id)
        this.queueService.settlement.schedule('cancel', orderData, roundInfo.round_sn, reverseMoney)
      }
    } else {
      const betOrders = await this.gameRepository.getOrderListByRoundId(roundInfo.id, ResettleOrderFields)
      for (const order of betOrders) {
        // 结算后的输赢之和,取反(负),就是要返回的金额
        const reverseMoney = -order.settle_result
        const updateFields = {
          rolling: 0,
          settle_result: 0,
          status: OrderStatus.Cancel,
          settle_time: new Date(),
        }
        this.gameRepository.updateBetOrderById(order.id, updateFields)
        const cancelSettledData = {
          ...order,
          ...updateFields
        }
        this.queueService.settlement.schedule('cancel', cancelSettledData, roundInfo.round_sn, reverseMoney)
        if (order.user_type === UserType.Player) {
          // 判断是否是今天
          if (order.bet_time.getTime() > new Date(new Date().toLocaleDateString()).getTime()) {
            this.userRepository.updateUserBetStats(order.user_id, {
              today_rolling: -order.rolling,
              today_winlose: reverseMoney,
              total_rolling: -order.rolling,
              total_winlose: reverseMoney,
            })
          } else {
            this.userRepository.updateUserBetStats(order.user_id, {
              today_rolling: -order.rolling,
              today_winlose: reverseMoney,
            })
          }
        }
      }
    }
  }

  protected async saveOrderData (tempOrder: BetTempOrder, settleRoundData: SettleRoundData<any>, rolling:number, comm:number, winLose:number) {
    const order: Omit<BetOrder, 'id'> = {
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
      round_result: settleRoundData.result,
      settle_result: winLose,
      status: OrderStatus.Settled,
      settle_time: new Date(),
    }
    const orderRaw = { ...order, bet: JSON.stringify(tempOrder.bet), round_details: JSON.stringify(settleRoundData.details), round_result: JSON.stringify(settleRoundData.result) }
    const insertId = await this.gameRepository.insertBetOrder(orderRaw)

    await this.gameRepository.deleteTempOrderById(tempOrder.id)
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
    return { ...order, id: insertId }
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
