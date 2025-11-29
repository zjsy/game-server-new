import { FastifyInstance } from 'fastify'
import { TableRepository } from '../repositories/table.repository.js'
import crypto from 'crypto'
import { GameType, RoundStatus } from '../constants/game.constants.js'
import { GameRepository } from '../repositories/game.repository.js'
import { BusinessError, ErrorCode } from '../utils/http.utils.js'
import { GameBroadcastService } from '../infrastructure/centrifugo.service.js'
import { PushConst } from '../constants/push.constants.js'
import { JwtPayload } from '../middlewares/jwt-auth.js'
import { Round } from '../entities/RoundInfo.js'
import { TableLoginResponse, DealerLoginResponse, RefreshTokenResponse } from '../types/response.types.js'

export class TableService {
  private tableRepository: TableRepository
  private gameRepository: GameRepository
  private broadcastService?: GameBroadcastService // 可选依赖

  constructor (private fastify: FastifyInstance, broadcastService?: GameBroadcastService) {
    this.tableRepository = this.fastify.repositories.table
    this.gameRepository = this.fastify.repositories.game
    this.broadcastService = broadcastService
  }

  /**
   * 桌台登录
   * @param tableNo 桌台编号
   * @param password 密码
   * @param loginIp 登录 IP
   * @returns 登录成功返回 token 和桌台信息
   */
  async tableLogin (
    tableNo: string,
    password: string,
    loginIp: string
  ): Promise<TableLoginResponse> {
    // 1. 查询桌台信息
    const table = await this.tableRepository.findTable({ table_no: tableNo }, [
      'id',
      'table_no',
      'table_name',
      'lobby_no',
      'current_shoe',
      'current_round_id',
      'type',
      'game_type',
      'countdown',
      'status',
      'shuffle',
      'maintain',
      'speed',
      'limit_max',
      'is_login',
      'video1',
      'video2',
      'goodroad',
      'site_url',
      'token',
      'password',
    ])
    if (!table) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST, 'table not found')
    }

    // 2. 检查桌台状态
    if (table.status === 0) {
      throw new BusinessError(ErrorCode.TABLE_IS_DISABLED, 'table is disabled')
    }

    // 3. 验证密码 - 计算客户端传入密码的 MD5
    const inputPasswordMd5 = crypto
      .createHash('md5')
      .update(tableNo + '*' + password)
      .digest('hex')

    // 比较计算出的 MD5 与数据库中存储的密码
    if (inputPasswordMd5 !== table.password) {
      throw new BusinessError(ErrorCode.LOGIN_VERIFY_ERROR, 'table password is incorrect')
    }

    // 3. 生成新的 sessionId
    const sessionId = crypto.randomUUID()

    // 4. 生成 JWT access token (短期有效)
    const token = this.fastify.jwt.sign(
      {
        tableNo: table.table_no,
        tableId: table.id,
        lobbyNo: table.lobby_no,
        gameType: table.game_type,
        sessionId, // 添加 sessionId 到 JWT payload
        type: 'access', // 标记为 access token
      },
      {
        expiresIn: '1h', // access token 有效期 1 小时
      }
    )

    // 5. 生成 refresh token (长期有效,用于刷新 access token)
    const refreshToken = this.fastify.jwt.sign(
      {
        tableNo: table.table_no,
        tableId: table.id,
        sessionId,
        type: 'refresh', // 标记为 refresh token
      },
      {
        expiresIn: '7d', // refresh token 有效期 7 天
      }
    )

    // 6. 将 sessionId 和 refreshToken 存储到 Redis
    const redisSessionKey = `sys:session:table:${table.id}`
    const redisRefreshKey = `sys:refresh:table:${table.id}:${sessionId}`

    // 使用 pipeline 批量操作 Redis
    const pipeline = this.fastify.redis.pipeline()
    pipeline.set(redisSessionKey, sessionId, 'EX', 7 * 24 * 60 * 60) // 7天过期
    pipeline.set(redisRefreshKey, refreshToken, 'EX', 7 * 24 * 60 * 60) // 7天过期
    await pipeline.exec()

    // 5. 更新桌台登录状态
    await this.tableRepository.updateTable({ id: table.id }, { is_login: 1, login_ip: loginIp })

    // 构造返回数据
    let roundInfo = null
    if (table.current_round_id) {
      roundInfo = await this.gameRepository.getRoundById(table.current_round_id, [
        'id',
        'table_no',
        'shoe_no',
        'round_sn',
        'round_no',
        'game_type',
        'status',
        'result',
        'details',
        'start_time',
        'end_time',
        'settle_time',
      ])
      if (roundInfo) {
        // 这边有可能出现服务器挂逼或者手动关闭状态后,处于倒计时中的任务终止,导致局状态没有更新的时候,需要根据时间和现有的状态来修正状态
        const endTime = roundInfo.end_time.getTime()
        if (endTime <= Date.now() && roundInfo.status === RoundStatus.Betting) {
          roundInfo.status = RoundStatus.Dealing
          await this.gameRepository.updateRoundById(roundInfo.id, { status: RoundStatus.Dealing })
        }
      }
    }

    const roundEndTime = roundInfo ? new Date(roundInfo.end_time).getTime() : 0
    // 更新或者存储table数据存redis,保证荷官登录时桌台数据是新的
    this.tableRepository.updateTableCache(table.id, {
      id: table.id,
      table_no: table.table_no,
      table_name: table.table_name,
      lobby_no: table.lobby_no,
      type: table.type,
      game_type: table.game_type,
      shuffle: table.shuffle,
      maintain: table.maintain,
      speed: table.speed,
      countdown: table.countdown,
      limit_max: table.limit_max,
      video1: table.video1,
      video2: table.video2,
      current_shoe: table.current_shoe ? table.current_shoe : 0,
      current_round_id: roundInfo ? roundInfo.id : 0,
      current_round_no: roundInfo ? roundInfo.round_no : 0,
      goodroad: table.goodroad,
      play_status: roundInfo ? roundInfo.status : -1,
      round_end_time: roundEndTime,
    })

    // 初始化其他数据,如局信息缓存,局统计缓存等
    // 确认redis局数据,没有就更新
    const isExitRoundCache = await this.gameRepository.exitRoundListCache(table.id)
    if (!isExitRoundCache) {
      // 获取结算后的局列表
      const roundList = await this.gameRepository.getRoundList(table.id, table.game_type, table.current_shoe)
      const l = roundList.length
      if (l) {
        this.gameRepository.saveRoundListCache(table.id, roundList)
        // 更新好路数据,可以不更新,因为好路数据不是特别重要,影响也不大,而且数据库的好路数据应该不会丢失
        // if (table.game_type === GameType.Baccarat) {
        //   const resArr = []
        //   for (let i = l - 1; i > 0; i--) {
        //     if (roundList[i].status === RoundStatus.Cancel) continue
        //     const hitRes = roundList[i].result.split(',').map(v => {
        //       return Number(v)
        //     })
        //     if (!hitRes.includes(BaccBetType.tie)) {
        //       const res = hitRes.includes(BaccBetType.banker) ? BaccBetType.banker : BaccBetType.player
        //       const goodlen = resArr.unshift(res)
        //       if (goodlen === 9) {
        //         break
        //       }
        //     }
        //   }
        //   this.gameRepository.setGoodRoadCache(table.id, resArr)
        // }
      }
    }
    if (table.game_type === GameType.Roulette) {
      this.gameRepository.initRouletteRankingCache(table.id)
      this.gameRepository.initRouletteStatsCache(table.id)
    }
    const subTime = roundEndTime - Date.now()
    // 6. 返回登录结果
    return {
      id: table.id,
      table_no: table.table_no,
      table_name: table.table_name,
      type: table.type,
      current_shoe: table.current_shoe,
      current_round_no: roundInfo ? roundInfo.round_no : 0,
      current_round_id: roundInfo ? roundInfo.id : 0,
      game_type: table.game_type,
      countdown: table.countdown,
      shuffle: table.shuffle,
      maintain: table.maintain,
      playStatus: roundInfo ? roundInfo.status : -1,
      video: table.site_url,
      token,
      refreshToken, // 返回 refresh token
      roundStopTime: roundEndTime,
      roundCountdown: subTime > 0 ? Math.floor(subTime / 1000) : 0,
    }
  }

  /**
   * 荷官登录
   * TODO: 实现荷官登录逻辑
   */
  async dealerLogin (tableId:number, dealerNo: string): Promise<DealerLoginResponse> {
    const dealer = await this.tableRepository.findDealerByNo(dealerNo, ['id', 'dealer_no', 'nickname', 'avatar', 'status', 'is_login'])
    if (!dealer || dealer.status === 0) {
      throw new BusinessError(ErrorCode.DEALER_NOT_EXIST)
    }

    const tableInfo = await this.tableRepository.findTableCache(tableId)
    if (!tableInfo) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST, 'table info not found')
    }

    if (dealer.is_login === 1) {
      throw new BusinessError(ErrorCode.DEALER_IS_LOGGED)
    }
    await this.tableRepository.updateDealer(dealer.id, { is_login: 1 })

    // 退出当前dealer
    if (tableInfo.dealer) {
      await this.tableRepository.updateDealer(tableInfo.dealer.id, { is_login: 0 })
    }

    // 更新桌dealer,方便直接从数据库取数据
    await this.tableRepository.updateTableCache(tableId, {
      dealer: { id: dealer.id, nickname: dealer.nickname, avatar: dealer.avatar },
    })
    this.tableRepository.updateTable({ id: tableId }, { is_login: 1, login_dealer: dealer.id })
    // 发送消息
    this.broadcastService?.globalBroadcast(PushConst.CHANGE_DEALER, {
      tableId,
      dealerNo: dealer.dealer_no,
      dealerName: dealer.nickname,
      dealerAvatar: dealer.avatar,
    })
    const resourceUrl = await this.gameRepository.getGameConfigCache('resourceUrl')
    return { nickname: dealer.nickname, avatar: resourceUrl + dealer.avatar }
  }

  /**
   * 桌台维护
   */
  async tableMaintain (tableId: number, status: number): Promise<void> {
    const tableInfo = await this.tableRepository.findTableCache(tableId)
    if (!tableInfo) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST, 'table info not found')
    }
    // 直接修改数据库状态
    if (Number(tableInfo.maintain) !== status && status === 1) {
      this.tableRepository.updateTable({ id: tableId }, { maintain: 1, login_dealer: 0 })
      this.tableRepository.updateTableCache(tableId, { maintain: 1, dealer: null })
      if (tableInfo.dealer) {
        this.tableRepository.updateDealer(tableInfo.dealer.id, { is_login: 0 })
      }
    } else {
      this.tableRepository.updateTable({ id: tableId }, { status: 1, maintain: 0 })
      this.tableRepository.updateTableCache(tableId, { maintain: 0 })
    }
    this.broadcastService?.globalBroadcast(PushConst.ON_MAINTAIN, { tableId, maintain: Boolean(status) })
  }

  /**
   * 查询最后一局游戏
   */
  async lastGame (tableId: number): Promise<void> {
    this.fastify.log.info({ tableId }, 'Last game - Not implemented')
    this.broadcastService?.globalBroadcast(PushConst.LAST_ROUND, { tableId })
  }

  /**
   * tableId
   * type 0:普通桌 1：现场桌(没有牌信息)
   * 获取局列表
   */
  async getRoundList (tableId: number, gameType:GameType, shoeNo: number, type: number = 0): Promise<Round[]> {
    this.fastify.log.info({ tableId }, 'Get round list - Not implemented')
    const roundList = await this.gameRepository.getRoundList(tableId, gameType, shoeNo, [
      'id',
      'shoe_no',
      'round_no',
      'start_time',
      'end_time',
      'settle_time',
      'result',
      'details',
      'status',
    ])
    if (type === 1) {
      for (const r of roundList) {
        r.details = r.result as any
        delete (r as any).result
      }
      return roundList
    }
    return roundList
  }

  /**
   * 使用 refresh token 刷新 access token
   * @param oldRefreshToken 旧的 refresh token
   * @returns 新的 access token 和 refresh token
   */
  async refreshToken (oldRefreshToken: string): Promise<RefreshTokenResponse> {
    // 1. 验证 refresh token
    const decoded = this.fastify.jwt.verify(oldRefreshToken) as JwtPayload

    // 2. 检查是否是 refresh token
    if (decoded.type !== 'refresh') {
      throw new BusinessError(ErrorCode.INVALID_TOKEN, 'Invalid token type')
    }

    const { tableNo, tableId, sessionId } = decoded

    // 3. 检查 refresh token 是否在 Redis 中存在且有效
    const redisRefreshKey = `sys:refresh:table:${tableId}:${sessionId}`
    const storedRefreshToken = await this.fastify.redis.get(redisRefreshKey)

    if (!storedRefreshToken || storedRefreshToken !== oldRefreshToken) {
      throw new BusinessError(ErrorCode.TOKEN_EXPIRED, 'Refresh token is invalid or expired')
    }

    // 4. 查询桌台信息
    const table = await this.tableRepository.findTable({ id: tableId })
    if (!table) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST, 'table not found')
    }

    // 5. 检查桌台状态
    if (table.status === 0) {
      throw new BusinessError(ErrorCode.TABLE_NOT_EXIST, 'table is disabled')
    }

    // 6. 生成新的 access token
    const expiresIn = '1h'
    const newAccessToken = this.fastify.jwt.sign(
      {
        tableNo: table.table_no,
        tableId: table.id,
        lobbyNo: table.lobby_no,
        gameType: table.game_type,
        sessionId,
        type: 'access',
      } as JwtPayload,
      {
        expiresIn,
      }
    )

    // 7. 生成新的 refresh token (可选：refresh token 轮换策略)
    const newRefreshToken = this.fastify.jwt.sign(
      {
        tableNo: table.table_no,
        tableId: table.id,
        sessionId,
        type: 'refresh',
      } as JwtPayload,
      {
        expiresIn: '7d',
      }
    )

    // 8. 删除旧的 refresh token,存储新的 refresh token (refresh token 轮换)
    const pipeline = this.fastify.redis.pipeline()
    pipeline.del(redisRefreshKey) // 删除旧的
    pipeline.set(redisRefreshKey, newRefreshToken, 'EX', 7 * 24 * 60 * 60) // 存储新的
    await pipeline.exec()

    this.fastify.log.info({ tableNo, tableId }, 'Token refreshed successfully')

    // 9. 返回新的 token
    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    }
  }
}
