import { FastifyInstance } from 'fastify'
import { BaccDetails, parseBaccPoint, parseBaccResult, calRollingForBacc, calWinLoseForBacc } from '../../constants/bacc.constants.js'
import { RoundStatus, GameType, OrderStatus, UserType, ResettleOrderFields, ResettleOrderField } from '../../constants/game.constants.js'
import { PushConst } from '../../constants/push.constants.js'
import { BetOrder, BetTempOrder } from '../../entities/BetOrder.js'
import { SettleRoundData } from '../../types/game.types.js'
import { SettleRequest } from '../../types/request.types.js'
import { StartResponse, SettleResponse } from '../../types/response.types.js'
import { getShoeNo } from '../../utils/game.utils.js'
import { BusinessError, ErrorCode } from '../../utils/http.utils.js'
import { GameBaseService } from './game.base.service.js'
import { Round } from '../../entities/RoundInfo.js'

export class BaccService extends GameBaseService {
  constructor (fastify: FastifyInstance) {
    super(fastify)
    console.warn('BaccService initialized')
  }

  // 开局
  async startGame (tableId:number): Promise<StartResponse> {
    // 清空牌缓存和上局下注统计,也可以放在结算时候清理
    this.gameRepository.deletePokerCache(tableId)
    this.gameRepository.delBetStatsCache(tableId)
    // !踢出房间锁定用户
    // this.app.rpc.room.roomRemote.kickLockUser.route(session)(tableId)

    const tableInfo = await this.tableRepository.findTableCache(tableId)
    if (!tableInfo) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST)
    }
    const currentShoe = tableInfo.current_shoe
    if (currentShoe < 1) {
      throw new BusinessError(ErrorCode.NOT_ALLOW_START)
    }

    // 判断当前局状态是否正常,如果还在countdown或者dealing就不允许开始,局状态可能没有
    const playStatus = tableInfo.play_status
    if (playStatus === RoundStatus.Betting || playStatus === RoundStatus.Dealing) {
      throw new BusinessError(ErrorCode.NOT_ALLOW_START)
    }
    const startTime = new Date()
    // 构造新局数据
    const roundNo = tableInfo.current_round_no + 1
    const shortShoeNoStr = String(tableInfo.current_shoe).substring(2)
    const roundNoStr = roundNo.toString().padStart(3, '0')
    const endTime = new Date(startTime.getTime() + tableInfo.countdown * 1000)
    const roundInfo = {
      table_id: tableId,
      table_no: tableInfo.table_no,
      lobby_no: tableInfo.lobby_no,
      // 三合一没有dealer
      dealer: tableInfo.dealer ? tableInfo.dealer.id : 0,
      shoe_no: tableInfo.current_shoe,
      round_no: roundNo,
      game_type: tableInfo.game_type,
      round_sn: `${tableInfo.table_no}${shortShoeNoStr}${roundNoStr}`,
      status: RoundStatus.Betting,
      start_time: startTime,
      end_time: endTime,
    }
    const insertId = await this.gameRepository.insertRound(roundInfo)
    // update db and cache table info
    if (roundInfo.round_no === 1) {
      // 当换靴后第一局的时候,改桌的状态
      await this.tableRepository.updateTable({ id: tableId }, { current_round_id: insertId, shuffle: 0 })
    } else {
      await this.tableRepository.updateTable({ id: tableId }, { current_round_id: insertId })
    }
    this.tableRepository.updateTableCache(tableId, {
      shuffle: 0,
      current_round_id: insertId,
      current_round_no: roundNo,
      play_status: RoundStatus.Betting,
      round_end_time: endTime.getTime(),
    })

    // 设置倒计时定时器 - 自动停止下注
    this.queueService.stopBetting.schedule(
      tableId,
      insertId,
      tableInfo.countdown * 1000
    )
    // 设置定时广播定时器 - 定时推送下注统计
    this.queueService.broadcast.scheduleRepeat(tableId, 3000, endTime.getTime())

    this.broadcastService?.globalBroadcast(PushConst.START_GAME, {
      tableId,
      id: insertId,
      shoeNo: roundInfo.shoe_no,
      roundNo: roundInfo.round_no,
      roundSn: roundInfo.round_sn,
      goodType: tableInfo.goodroad,
    })
    return {
      id: insertId,
      tableId: roundInfo.table_id,
      shoeNo: roundInfo.shoe_no,
      roundNo: roundInfo.round_no,
      roundSn: roundInfo.round_sn,
      startTime: roundInfo.start_time,
    }
  }

  // 发牌,all game is same
  async dealing (tableId: number, cardId:number, cardNo:number): Promise<void> {
    this.gameRepository.setPokerCache(tableId, { index: cardId, details: cardNo })
    this.broadcastService?.globalBroadcast(PushConst.OPEN_CARD, {
      tableId,
      index: cardId,
      details: cardNo,
    })
  }

  // 结算
  async settle (data: SettleRequest<BaccDetails>): Promise<SettleResponse> {
    const roundInfo = await this.gameRepository.getRoundById(data.roundId, ['id', 'round_sn', 'end_time', 'game_type', 'table_id', 'status'])
    if (!roundInfo) {
      throw new BusinessError(ErrorCode.ROUND_NOT_EXIST)
    }
    if (roundInfo.game_type !== GameType.Baccarat) {
      throw new BusinessError(ErrorCode.ROUND_NOT_EXIST)
    }
    const settleTime = new Date()
    if (roundInfo.status !== RoundStatus.Dealing) {
      // 当已经结算重新给code码,用于荷官判断
      if (roundInfo.status === RoundStatus.Over) {
        throw new BusinessError(ErrorCode.ROUND_ALREADY_SETTLE)
      } else {
        // 排除倒计时的确已经结束,但是状态没改的情况（结束时,操作数据库失败,或开局后进程挂掉后重启,导致定时器消失）
        // if (!(roundInfo.status === RoundStatus.betting && roundInfo.end_time < settleTime)) {
        if (roundInfo.status !== RoundStatus.Betting || roundInfo.end_time > settleTime) {
          throw new BusinessError(ErrorCode.ROUND_NOT_SETTLE)
        }
      }
    }
    // 清除redis当前局所有人下注信息
    this.userRepository.delUserRoundBetStateCache(roundInfo.id)
    const updateData: Partial<Round> = {}
    let hitRes = data.result
    let points: { bp: number; pp: number } | null = null
    if (data.details) {
      updateData.details = data.details
      // 如果有牌重新生成命中结果
      points = parseBaccPoint(data.details)
      hitRes = parseBaccResult(data.details, points)
    }
    updateData.result = hitRes
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

    // !判断好路,在荷官端计算,荷官端因为也有显示需求
    const goodType = data.goodType ? data.goodType : 0
    if (data.goodType) {
      const tableInfo = await this.tableRepository.findTableCache(roundInfo.table_id)
      if (goodType !== tableInfo!.goodroad) {
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
    const settleRoundData = { round_sn: roundInfo.round_sn, result: hitRes, details: data.details }
    for (const order of betOrders) {
      this.settleOrder(order, settleRoundData, points)
    }

    return { settledAt: settleTime, goodRoad: goodType }
  }

  // 重结算
  async reSettle (data: SettleRequest<BaccDetails>): Promise<SettleResponse> {
    const roundInfo = await this.gameRepository.getRoundById(data.roundId, ['id', 'round_sn', 'game_type', 'table_id', 'table_no', 'status'])
    // 判断局状态是否正确,还可以判断下时间
    if (!roundInfo) {
      throw new BusinessError(ErrorCode.ROUND_NOT_EXIST)
    }
    if (roundInfo.game_type !== GameType.Baccarat) {
      throw new BusinessError(ErrorCode.ROUND_NOT_EXIST)
    }
    // 只允许在结束或重结算的时候才可以重结算
    if (roundInfo.status !== RoundStatus.Over && roundInfo.status !== RoundStatus.Resettle) {
      throw new BusinessError(ErrorCode.ROUND_NOT_SETTLE)
    }

    if (data.goodType) {
      const goodType = data.goodType ? data.goodType : 0
      const tableInfo = await this.tableRepository.findTableCache(roundInfo.table_id)
      if (goodType !== tableInfo!.goodroad) {
        this.tableRepository.updateTable({ id: roundInfo.table_id }, { goodroad: goodType })
        this.tableRepository.updateTableCache(roundInfo.table_id, { goodroad: goodType })
      }
    }

    const updateData:Partial<Round> = {}
    let hitRes = data.result
    let points: { bp: number; pp: number } | null = null
    if (data.details) {
      updateData.details = data.details
      // 重新生成命中结果
      points = parseBaccPoint(data.details)
      hitRes = parseBaccResult(data.details, points)
    }
    updateData.result = hitRes
    const settleTime = new Date()
    updateData.status = RoundStatus.Resettle
    // 重结算也更新结算时间
    updateData.settle_time = settleTime
    this.gameRepository.updateRoundById(roundInfo.id, updateData)

    // !判断当前局是否在前端显示范围之内,是的话需要通知前端
    const cRoundList = await this.gameRepository.getRoundListCache(roundInfo.table_id)
    const l = cRoundList.length
    // 从后开始循环,如果找到了就修改一下
    for (let i = l - 1; i > -1; i--) {
      const cRound = JSON.parse(cRoundList[i])
      if (cRound.id === roundInfo.id) {
        // 推送结果信息
        this.broadcastService?.globalBroadcast(PushConst.CHANGE_RESULT, {
          tableId: roundInfo.table_id,
          roundId: roundInfo.id,
          result: hitRes,
          details: data.details,
          goodType: data.goodType ? data.goodType : 0,
        })
        this.gameRepository.updateRoundCache(roundInfo.table_id, i, {
          id: roundInfo.id,
          result: hitRes,
          details: data.details,
          status: roundInfo.status,
        })
        break
      }
    }

    const betOrders = await this.gameRepository.getOrderListByRoundId(roundInfo.id, ResettleOrderFields)
    const settleRoundData = { round_sn: roundInfo.round_sn, result: hitRes, details: data.details }
    for (const order of betOrders) {
      this.reSettleOrder(order, settleRoundData, points)
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
    // 在没有开结果和开了结果之后都可以取消结果
    const oldRoundStatus = roundInfo.status
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
    const currRoundStatus = tableCache.play_status
    if (currRoundStatus === RoundStatus.Betting || currRoundStatus === RoundStatus.Dealing) {
      throw new BusinessError(ErrorCode.NOT_ALLOW_SHUFFLE)
    }
    const newShoeNo = getShoeNo(tableCache.current_shoe)
    // 更新数据库
    this.tableRepository.updateTable({ id: tableId }, { current_shoe: newShoeNo, shuffle: 1, current_round_id: 0, goodroad: 0 })

    // 更新cache,1 删除局缓存,2更新table缓存
    this.gameRepository.delRoundListCache(tableId)
    this.tableRepository.updateTableCache(tableId, {
      current_shoe: newShoeNo,
      shuffle: 1,
      current_round_no: 0,
      current_round_id: 0,
      play_status: -1,
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

  private async settleOrder (tempOrder: BetTempOrder, settleRoundData: SettleRoundData<BaccDetails>, points: { bp: number; pp: number } | null) {
    const totalBetMoney = tempOrder.bet_amount // 下注总额
    const betDetails = tempOrder.bet
    const winLose = calWinLoseForBacc(betDetails, settleRoundData.result, settleRoundData.details, points)
    // 计算洗码
    const rolling = calRollingForBacc(totalBetMoney, betDetails, settleRoundData.result)
    const comm = await this.userRepository.getUserCommCache(tempOrder.user_id)
    const order = await this.saveOrderData(tempOrder, settleRoundData, rolling, comm, winLose)
    // 修改金额
    this.queueService.settlement.schedule('settle', order, settleRoundData.round_sn, winLose)
  }

  private async reSettleOrder (order:Pick<BetOrder, ResettleOrderField>, settleRoundData: SettleRoundData<BaccDetails>, points: { bp: number; pp: number } | null) {
    const totalBetMoney = order.bet_amount // 下注总额
    const betDetails = order.bet
    const winLose = calWinLoseForBacc(betDetails, settleRoundData.result, settleRoundData.details, points)
    // 计算洗码
    const rolling = calRollingForBacc(totalBetMoney, betDetails, settleRoundData.result)
    // 处理订单数据
    const rollingDiff = rolling - order.rolling
    const comm = await this.userRepository.getUserCommCache(order.user_id)
    const updateData = {
      rolling,
      comm: (rolling * comm) / 100,
      status: OrderStatus.Resettled,
      round_details: settleRoundData.details,
      round_result: settleRoundData.result,
      settle_result: winLose,
      settle_time: new Date(),
    }
    this.gameRepository.updateBetOrderById(order.id, updateData)
    const winLoseDiff = winLose - order.settle_result
    if (order.user_type === UserType.Player) {
      // 更新输赢统计
      this.updateBetStatsResettle(order.user_id, winLoseDiff, rollingDiff, order.bet_time)
    }
    // 修改金额
    const reSettleData = { ...order, ...updateData }
    this.queueService.settlement.schedule('resettle', reSettleData, settleRoundData.round_sn, winLoseDiff)
  }
}
