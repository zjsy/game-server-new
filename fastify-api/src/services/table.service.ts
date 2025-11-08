import { FastifyInstance } from 'fastify'
import { Round, TableLoginResponse } from '../types/table.types.js'
import { TableRepository } from '../repositories/table.repository.js'
import crypto from 'crypto'
import { GameType, RoundStatus } from '../constants/game.constants.js'
import { GameRepository } from '../repositories/game.repository.js'
import { BaccBetType } from '../constants/bacc.constants.js'

export class TableService {
  private tableRepository: TableRepository
  private gameRepository: GameRepository

  constructor (private fastify: FastifyInstance) {
    this.tableRepository = new TableRepository(fastify)
    this.gameRepository = new GameRepository(fastify)
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
    const table = await this.tableRepository.findByTableNo(tableNo, [
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
      throw new Error('table not found')
    }

    // 2. 检查桌台状态
    if (table.status === 0) {
      throw new Error('table is disabled')
    }

    // 3. 验证密码 - 计算客户端传入密码的 MD5
    const inputPasswordMd5 = crypto
      .createHash('md5')
      .update(tableNo + '*' + password)
      .digest('hex')

    // 比较计算出的 MD5 与数据库中存储的密码
    if (inputPasswordMd5 !== table.password) {
      throw new Error('table password is incorrect')
    }

    // 3. 生成新的 sessionId
    const sessionId = crypto.randomUUID()

    // 4. 生成 JWT token
    const token = this.fastify.jwt.sign(
      {
        tableNo: table.table_no,
        tableId: table.id,
        lobbyNo: table.lobby_no,
        gameType: table.game_type,
        sessionId, // 添加 sessionId 到 JWT payload
      },
      {
        expiresIn: '24h', // token 有效期 24 小时
      }
    )

    // 5. 将新的 sessionId 存储到 Redis
    const redisKey = `session:table:${table.id}`
    await this.fastify.redis.set(redisKey, sessionId, 'EX', 24 * 60 * 60) // 24小时过期

    // 5. 更新桌台登录状态
    await this.tableRepository.updateLoginStatus(table.table_no, token, loginIp)

    // 构造返回数据
    let roundInfo: null | Round = null
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
        // 这边有可能出现服务器挂逼或者手动关闭状态后，处于倒计时中的任务终止，导致局状态没有更新的时候，需要根据时间和现有的状态来修正状态
        const endTime = roundInfo.end_time.getTime()
        if (endTime - Date.now() <= 0 && roundInfo.status === RoundStatus.Betting) {
          await this.gameRepository.updateRoundById(roundInfo.id, { status: RoundStatus.Dealing })
        }
      }
    }

    const roundEndTime = roundInfo ? new Date(roundInfo.end_time).getTime() : 0

    // 更新或者存储table数据存redis,保证荷官登录时桌台数据是新的
    this.gameRepository.updateTableCache(table.id, {
      id: table.id + '',
      table_no: table.table_no,
      table_name: table.table_name,
      lobby_no: table.lobby_no,
      type: table.type + '',
      game_type: table.game_type + '',
      shuffle: table.shuffle + '',
      maintain: table.maintain + '',
      speed: table.speed,
      countdown: table.countdown + '',
      limit_max: table.limit_max + '',
      video1: table.video1,
      video2: table.video2,
      current_shoe: table.current_shoe ? table.current_shoe : '0',
      current_round_id: roundInfo ? roundInfo.id : '0',
      current_round_no: roundInfo ? roundInfo.round_no : '0',
      goodroad: table.goodroad,
      play_status: roundInfo ? roundInfo.status : '-1',
      round_end_time: roundEndTime,
    })

    // 初始化其他数据，如局信息缓存，局统计缓存等
    // 确认redis局数据，没有就更新
    const isExitRoundCache = await this.gameRepository.exitRoundListCache(table.id)
    if (!isExitRoundCache) {
      // 获取结算后的局列表
      const roundList = await this.gameRepository.getRoundList(table.id, table.game_type, table.current_shoe)
      const l = roundList.length
      if (l) {
        this.gameRepository.saveRoundListCache(table.id, roundList)
        // 更新好路数据
        if (table.game_type === GameType.Baccarat) {
          const resArr = []
          for (let i = l - 1; i > 0; i--) {
            if (roundList[i].status === RoundStatus.Cancel) continue
            const hitRes = roundList[i].result.split(',').map(v => {
              return Number(v)
            })
            if (!hitRes.includes(BaccBetType.tie)) {
              const res = hitRes.includes(BaccBetType.banker) ? BaccBetType.banker : BaccBetType.player
              const goodlen = resArr.unshift(res)
              if (goodlen === 9) {
                break
              }
            }
          }
          this.gameRepository.setGoodRoadCache(table.id, resArr)
        }
      }
    }
    if (table.game_type === GameType.Roulette) {
      this.gameRepository.initRoultterankingCache(table.id)
      this.gameRepository.initRoultteStatsCache(table.id)
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
      token: table.token,
      roundStopTime: roundEndTime,
      roundCountdown: subTime > 0 ? Math.floor(subTime / 1000) : 0,
    }
  }

  /**
   * 荷官登录
   * TODO: 实现荷官登录逻辑
   */
  async dealerLogin (tableNo: string, dealerNo: string): Promise<unknown> {
    this.fastify.log.info({ tableNo, dealerNo }, 'Dealer login - Not implemented')
    throw new Error('Dealer login not implemented yet')
  }

  /**
   * 桌台维护/结算
   * TODO: 实现桌台维护逻辑
   */
  async tableMaintain (tableNo: string, data: unknown): Promise<unknown> {
    this.fastify.log.info({ tableNo, data }, 'Table maintain - Not implemented')
    throw new Error('Table maintain not implemented yet')
  }

  /**
   * 查询最后一局游戏
   * TODO: 实现查询最后一局游戏逻辑
   */
  async lastGame (tableNo: string): Promise<unknown> {
    this.fastify.log.info({ tableNo }, 'Last game - Not implemented')
    throw new Error('Last game not implemented yet')
  }

  /**
   * 获取回合列表
   * TODO: 实现获取回合列表逻辑
   */
  async getRoundList (tableNo: string): Promise<unknown> {
    this.fastify.log.info({ tableNo }, 'Get round list - Not implemented')
    throw new Error('Get round list not implemented yet')
  }

  /**
   * 刷新 token
   * @param tableNo 桌台编号
   * @param loginIp 登录 IP
   * @returns 新的 token
   */
  async refreshToken (tableNo: string, loginIp: string): Promise<{ token: string; expiresIn: string }> {
    // 1. 查询桌台信息
    const table = await this.tableRepository.findByTableNo(tableNo)
    if (!table) {
      throw new Error('table not found')
    }

    // 2. 检查桌台状态
    if (table.status === 0) {
      throw new Error('table is disabled')
    }

    // 3. 生成新的 sessionId
    const sessionId = crypto.randomUUID()

    // 4. 生成新的 JWT token
    const expiresIn = '24h'
    const token = this.fastify.jwt.sign(
      {
        tableNo: table.table_no,
        userId: table.id.toString(),
        tableId: table.id,
        lobbyNo: table.lobby_no,
        gameType: table.game_type,
        sessionId, // 添加 sessionId 到 JWT payload
      },
      {
        expiresIn,
      }
    )

    // 5. 将新的 sessionId 存储到 Redis
    const redisKey = `session:table:${table.id}`
    await this.fastify.redis.set(redisKey, sessionId, 'EX', 24 * 60 * 60) // 24小时过期

    // 6. 更新桌台的 token
    await this.tableRepository.updateLoginStatus(table.table_no, token, loginIp)

    this.fastify.log.info({ tableNo, loginIp }, 'Token refreshed successfully')

    // 7. 返回新 token
    return {
      token,
      expiresIn,
    }
  }
}
