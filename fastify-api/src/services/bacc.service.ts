import { FastifyInstance } from 'fastify'
import { BusinessError, ErrorCode } from '../utils/http.utils.js'
import { GameType, OrderStatus, RoundStatus, UserType } from '../constants/game.constants.js'
import { PushConst } from '../constants/push.constants.js'
import { getShoeNo } from '../utils/game.utils.js'
import { calRollingForBacc, calWinloseForBacc, parseBaccPoint, parseBaccResult } from '../constants/bacc.constants.js'
import { GameBaseService } from './game.base.service.js'
import { BetTempOrder, BetOrder } from '../entities/BetOrder.js'
import { Dealer } from '../entities/Dealer.js'
import { Round } from '../entities/RoundInfo.js'
import { BaccDetails, SettleRoundData } from '../types/game.types.js'
import { SettleRequest } from '../types/request.types.js'
import { StartResponse, SettleResponse } from '../types/response.types.js'

export class BaccService extends GameBaseService {
  constructor (fastify: FastifyInstance) {
    super(fastify)
    console.log('BaccService initialized')
  }

  // 开局
  async startGame (tableId:number): Promise<StartResponse> {
    // 清空牌信息
    this.gameRepository.deletePokerCache(tableId)
    // 清理上局统计信息
    this.gameRepository.delBetStatsCache(tableId)
    // 踢出房间锁定用户
    // this.app.rpc.room.roomRemote.kickLockUser.route(session)(tableId)

    const tableInfo = await this.tableRepository.findTableCache(tableId)
    if (!tableInfo) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST)
    }
    const currentShoe = Number(tableInfo.current_shoe)
    if (currentShoe < 1) {
      throw new BusinessError(ErrorCode.NOT_ALLOW_START)
    }

    // 判断当前局状态是否正常，如果还在countdown或者dealing就不允许开始,局状态可能没有
    const playStatus = tableInfo.play_status ? Number(tableInfo.play_status) : -1
    if (playStatus === RoundStatus.Betting || playStatus === RoundStatus.Dealing) {
      throw new BusinessError(ErrorCode.NOT_ALLOW_START)
    }
    const startTime = new Date()
    // 数据库插入局信息
    const roundNo = Number(tableInfo.current_round_no) + 1
    const shortShoeNoStr = String(tableInfo.current_shoe).substring(2)
    const roundNoStr = roundNo.toString().padStart(3, '0')
    const endTime = new Date(startTime.getTime() + Number(tableInfo.countdown) * 1000)
    const roundInfo: Partial<Round> = {
      table_id: tableId,
      table_no: tableInfo.table_no,
      lobby_no: tableInfo.lobby_no,
      // 三合一没有dealer
      dealer: tableInfo.dealerInfo ? (JSON.parse(tableInfo.dealerInfo) as Dealer).id : 0,
      shoe_no: Number(tableInfo.current_shoe),
      round_no: roundNo,
      game_type: Number(tableInfo.game_type),
      round_sn: `${tableInfo.table_no}${shortShoeNoStr}${roundNoStr}`,
      status: RoundStatus.Betting,
      start_time: startTime,
      end_time: endTime,
    }

    const insertId = await this.gameRepository.insertRound(roundInfo) // 失败了会抛出异常
    // 数据库和redis修改桌桌状态和某些字段'
    if (roundInfo.round_no === 1) {
      // ?可以在这里广播一个桌状态改变的消息
      // 当换靴后第一局的时候,改桌的状态
      await this.tableRepository.updateTable({ id: tableId }, { current_round_id: insertId, shuffle: 0 })
    } else {
      await this.tableRepository.updateTable({ id: tableId }, { current_round_id: insertId })
    }
    // 更新redis
    this.tableRepository.updateTableCache(String(tableId), {
      shuffle: '0',
      current_round_id: String(insertId),
      current_round_no: roundNo,
      play_status: RoundStatus.Betting,
      round_end_time: endTime.getTime(),
    })

    // 设置定时广播定时器 - 定时推送下注统计
    this.queueService?.broadcast?.scheduleRepeat(tableId, 3000, endTime.getTime())

    // 推送前台信息,直接获取redis中保存的好路结果进行广播
    this.broadcastService?.globalBroadcast(PushConst.START_GAME, {
      tableId,
      id: insertId,
      shoeNo: roundInfo.shoe_no,
      roundNo: roundInfo.round_no,
      roundSn: roundInfo.round_sn,
      goodType: Number(tableInfo.goodroad),
    })
    return {
      id: insertId,
      tableId: roundInfo.table_id!,
      shoeNo: roundInfo.shoe_no!,
      roundNo: roundInfo.round_no!,
      roundSn: roundInfo.round_sn!,
      startTime: roundInfo.start_time!,
    }
  }

  // 根据用户名查找用户
  async stopBet (tableId: number, roundId:number): Promise<void> {
    const tableCache = await this.tableRepository.findTableCache(tableId)
    if (!tableCache) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST)
    }
    if (Number(tableCache.current_round_id) === roundId && Number(tableCache.play_status) === RoundStatus.Betting) {
      // 手动停止下注，清理所有定时器
      this.queueService?.broadcast.stopRepeat(tableId)
      const endTime = new Date()
      // 判断是否还是当前局，并且状态还在倒计时状态
      // 局状态和结束时间改变
      this.gameRepository.updateRoundById(roundId, { status: RoundStatus.Dealing, end_time: endTime })
      // 更新redis
      this.tableRepository.updateTableCache(tableId, { play_status: RoundStatus.Dealing, round_end_time: endTime.getTime() })
      // TODO: 可以使用管道合并为一次查询
      const betStateC = await this.gameRepository.getBetStatsCCache(tableId)
      const betStateN = await this.gameRepository.getBetStatsNCache(tableId)
      // 直接这里发送信息
      this.broadcastService?.globalBroadcast(PushConst.END_COUNTDOWN, {
        tableId,
        roundId,
        betStateC,
        betStateN,
      })
    }
  }

  // 开牌
  async dealing (tableId: number, cardId:number, cardNo:number): Promise<void> {
    this.gameRepository.setPokerCache(tableId, { index: cardId, details: cardNo })
    this.broadcastService?.globalBroadcast(PushConst.OPEN_CARD, {
      tableId,
      index: cardId,
      details: cardNo,
    })
  }

  // 更新用户
  async settle (data: SettleRequest<BaccDetails>): Promise<SettleResponse> {
    const roundInfo = await this.gameRepository.getRoundById(data.roundId, ['id', 'round_sn', 'end_time', 'game_type', 'table_id', 'status']) as {
      id: number; round_sn: string; end_time: Date; game_type: number; table_id: number; status: number
    }
    if (!roundInfo) {
      throw new BusinessError(ErrorCode.ROUND_NOT_EXIST)
    }
    if (roundInfo.game_type !== GameType.Baccarat) {
      throw new BusinessError(ErrorCode.ROUND_NOT_EXIST)
    }
    const settleTime = new Date()
    if (roundInfo.status !== RoundStatus.Dealing) {
      // 当已经结算重新给code码，用于荷官判断
      if (roundInfo.status === RoundStatus.Over) {
        throw new BusinessError(ErrorCode.ROUND_ALREADY_SETTLE)
      } else {
        // 排除倒计时的确已经结束，但是状态没改的情况（结束时，操作数据库失败，或开局后进程挂掉后重启，导致定时器消失）
        // if (!(roundInfo.status === RoundStatus.betting && roundInfo.end_time < settleTime)) {
        if (roundInfo.status !== RoundStatus.Betting || roundInfo.end_time > settleTime) {
          throw new BusinessError(ErrorCode.ROUND_NOT_SETTLE)
        }
      }
    }
    // 清除redis当前局所有人下注信息
    this.userRepository.delUserRoundBetStateCache(roundInfo.id)
    const updateData:Record<string, unknown> = {}
    let hitRes: number[] = data.details ? [] : data.result
    let points: { bp: number; pp: number } | null = null
    if (data.details) {
      updateData.details = JSON.stringify(data.details)
      // 重新生成命中结果
      points = parseBaccPoint(data.details)
      hitRes = parseBaccResult(data.details, points)
    } else {
      hitRes = data.result
    }
    updateData.result = JSON.stringify(hitRes)
    updateData.settle_time = settleTime
    updateData.status = RoundStatus.Over
    await this.gameRepository.updateRoundById(roundInfo.id, updateData)
    // 更改redis 局状态
    this.tableRepository.updateTableCache(roundInfo.table_id, { play_status: RoundStatus.Over })
    // redis 插入这靴的局信息
    this.gameRepository.insertRoundCache(roundInfo.table_id, roundInfo.game_type, {
      id: roundInfo.id,
      result: hitRes,
      details: data.details,
      status: RoundStatus.Over,
    })

    // !判断好路,在荷官端计算，荷官端因为也有显示需求
    const goodType = data.goodType ? data.goodType : 0
    if (data.goodType) {
      const tableInfo = await this.tableRepository.findTableCache(roundInfo.table_id)
      if (goodType !== Number(tableInfo!.goodroad)) {
        this.tableRepository.updateTable({ id: roundInfo.table_id }, { goodroad: goodType })
        this.tableRepository.updateTableCache(roundInfo.table_id, { goodroad: goodType })
      }
    }

    // 推送结果信息
    this.broadcastService?.globalBroadcast(PushConst.ON_GAME_RESULT, {
      tableId: roundInfo.table_id,
      roundId: roundInfo.id,
      result: hitRes,
      details: data.details,
      goodType,
    })
    const betOrders = await this.gameRepository.getTempOrderListByRoundId(roundInfo.id)
    for (const order of betOrders) {
      this.settleBaccOrder(order, { round_sn: roundInfo.round_sn, result: hitRes, details: data.details }, hitRes, points)
    }

    return { settledAt: settleTime }
  }

  // 删除用户
  async reSettle (data: SettleRequest<BaccDetails>): Promise<SettleResponse> {
    const roundInfo = await this.gameRepository.getRoundById(data.roundId, ['id', 'round_sn', 'game_type', 'table_id', 'table_no', 'status'])
    // 判断局状态是否正确,还可以判断下时间
    if (!roundInfo) {
      throw new BusinessError(ErrorCode.ROUND_NOT_EXIST)
    }
    if (roundInfo.game_type !== GameType.Baccarat) {
      throw new BusinessError(ErrorCode.ROUND_NOT_EXIST)
    }
    // 皇家丽华只允许在结束或重结算的时候才可以重结算
    if (roundInfo.status !== RoundStatus.Over && roundInfo.status !== RoundStatus.Resettle) {
      throw new BusinessError(ErrorCode.ROUND_NOT_SETTLE)
    }

    if (data.goodType) {
      const goodType = data.goodType ? data.goodType : 0
      const tableInfo = await this.tableRepository.findTableCache(roundInfo.table_id)
      if (goodType !== Number(tableInfo!.goodroad)) {
        this.tableRepository.updateTable({ id: roundInfo.table_id }, { goodroad: goodType })
        this.tableRepository.updateTableCache(roundInfo.table_id, { goodroad: goodType })
      }
    }

    const updateData:Record<string, unknown> = {}
    let hitRes: number[] = data.details ? [] : data.result
    let points: { bp: number; pp: number } | null = null
    if (data.details) {
      updateData.details = JSON.stringify(data.details)
      // 重新生成命中结果
      points = parseBaccPoint(data.details)
      hitRes = parseBaccResult(data.details, points)
    } else {
      hitRes = data.result
    }
    updateData.result = hitRes.join()
    const settleTime = new Date()
    updateData.status = RoundStatus.Resettle
    // 重结算也更新结算时间
    updateData.settle_time = settleTime
    this.gameRepository.updateRoundById(roundInfo.id, updateData)

    // !判断当前局是否在前端显示范围之内，是的话需要通知前端
    const cRoundList = await this.gameRepository.getRoundListCache(roundInfo.table_id)
    const l = cRoundList.length
    // 从后开始循环，如果找到了就修改一下
    for (let i = l - 1; i > -1; i--) {
      const cRound = JSON.parse(cRoundList[i])
      if (cRound.id === roundInfo.id) {
        // 推送结果信息
        this.broadcastService?.globalBroadcast(PushConst.CHANGE_RESULT, {
          tableId: roundInfo.table_id,
          roundId: Number(roundInfo.id),
          result: roundInfo.result,
          details: roundInfo.details,
          goodType: data.goodType ? data.goodType : 0,
        })
        this.gameRepository.updateRoundCache(roundInfo.table_id, i, {
          id: roundInfo.id,
          result: roundInfo.result,
          details: roundInfo.details,
          status: roundInfo.status,
        })
        break
      }
    }

    const betOrders = await this.gameRepository.getOrderListByRoundId(roundInfo.id, [
      'id',
      'bet',
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
      this.reSettleBaccOrder(order as BetOrder, roundInfo, hitRes, points)
    }

    return { settledAt: settleTime }
  }

  // 取消局
  async cancelRound (roundId: number): Promise<SettleResponse> {
    const roundInfo = await this.gameRepository.getRoundById(roundId, ['id', 'round_sn', 'game_type', 'table_id', 'table_no', 'status'])
    if (!roundInfo) {
      throw new BusinessError(ErrorCode.ROUND_NOT_EXIST)
    }
    if (roundInfo.game_type !== GameType.Baccarat) {
      throw new BusinessError(ErrorCode.PARAMS_ERROR)
    }
    // lg88在没有开结果和开了结果之后都可以取消结果
    const oldRoundStatus = Number(roundInfo.status)
    if (oldRoundStatus === RoundStatus.Betting || oldRoundStatus === RoundStatus.Cancel) {
      throw new BusinessError(ErrorCode.ROUND_NOT_SETTLE)
    }
    const cancelTime = new Date()
    await this.gameRepository.updateRoundById(roundInfo.id, { status: RoundStatus.Cancel, settle_time: cancelTime })
    this.cancelOrders(oldRoundStatus, roundInfo)

    return { settledAt: cancelTime }
  }

  async shuffle (tableId: number): Promise<number> {
    const tableCache = await this.tableRepository.findTableCache(tableId)
    if (!tableCache) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST)
    }
    // 当前局未结束不能换靴
    const currRoundStatus = Number(tableCache.play_status)
    if (currRoundStatus === RoundStatus.Betting || currRoundStatus === RoundStatus.Dealing) {
      throw new BusinessError(ErrorCode.NOT_ALLOW_SHUFFLE)
    }
    const newShoeNo = getShoeNo(Number(tableCache.current_shoe))
    // 更新数据库
    this.tableRepository.updateTableCache(tableId, { current_shoe: newShoeNo, shuffle: 1, current_round_id: 0, goodroad: 0 })

    // 更新redis,1更新当前靴为空,2更新table数据
    this.gameRepository.delRoundListCache(tableId)
    this.tableRepository.updateTableCache(tableId, {
      current_shoe: newShoeNo + '',
      shuffle: 1,
      current_round_no: 0,
      current_round_id: 0,
      play_status: '-1',
      goodroad: 0,
    })
    // 广播消息
    this.broadcastService?.globalBroadcast(PushConst.ON_SHUFFLE, {
      tableId,
      shoeId: newShoeNo,
    })
    //! 清理好路数据
    // this.gameRepository.setGoodRoadCache(tableId, [])

    this.broadcastService?.globalBroadcast(PushConst.ON_GOOD_ROAD, { tableId, type: 0 })

    return newShoeNo
  }

  private async settleBaccOrder (tempOrder: BetTempOrder, settleRoundData: SettleRoundData<BaccDetails>, hitRes:number[], points: { bp: number; pp: number } | null) {
    const totalBetMoney = tempOrder.bet_amount // 下注总额
    const betDetails = tempOrder.bet
    const winLose = calWinloseForBacc(betDetails, hitRes, settleRoundData.details as BaccDetails, points)
    // 计算洗码
    const rolling = calRollingForBacc(totalBetMoney, betDetails, hitRes)
    const comm = await this.userRepository.getUserCommCache(tempOrder.user_id)
    const order = await this.saveOrderData(tempOrder, settleRoundData, rolling, comm, winLose)
    // 修改金额
    this.queueService?.settlement?.schedule('settle', order as BetOrder, settleRoundData.round_sn, winLose)
  }

  private async reSettleBaccOrder (order: BetOrder, roundInfo: Round, hitRes:number[], points: { bp: number; pp: number } | null) {
    const totalBetMoney = order.bet_amount // 下注总额
    const betDetails = order.bet
    const winLose = calWinloseForBacc(betDetails, hitRes, roundInfo.details as BaccDetails, points)
    // 计算洗码
    const rolling = calRollingForBacc(totalBetMoney, betDetails, hitRes)
    // 处理订单数据
    const rollingDiff = rolling - order.rolling
    const comm = await this.userRepository.getUserCommCache(order.user_id)
    const updateData: Partial<BetOrder> = {
      rolling,
      comm: (rolling * comm) / 100,
      status: OrderStatus.Resettled,
      round_details: roundInfo.details,
      round_result: roundInfo.result,
      settle_result: winLose,
      settle_time: order.settle_time,
    }
    this.gameRepository.updateBetOrderById(order.id, updateData)
    const winLoseDiff = winLose - order.settle_result
    if (order.user_type === UserType.Player) {
      // 更新输赢统计
      this.updateBetStatsResettle(order.user_id, winLoseDiff, rollingDiff, order.bet_time)
    }
    this.queueService?.settlement?.schedule('resettle', order, roundInfo.round_sn, winLoseDiff)
  }
}
