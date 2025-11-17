import { BaseRepository } from './base.repository.js'
import { FastifyInstance } from 'fastify'
import { BetOrder, BetOrderRow, BetTempOrder, BetTempOrderRow, GameConfigRow, Round, RoundRow } from '../types/table.types.js'
import { ConfigCache } from '../types/common.types.js'
import { GameType, RoundStatus } from '../constants/game.constants.js'
import { isRed, rouStats } from '../constants/roulette.constants.js'

type RoundCacheData<T = unknown> = { id: number; result?: string, details?: T, status: number }
export class GameRepository extends BaseRepository {
  constructor (protected fastify: FastifyInstance) {
    super(fastify)
  }

  async getGameConfigCache (key:keyof ConfigCache) : Promise<string | null> {
    const config = await this.redis.hget('cache:config', key)
    if (config) {
      return config
    } else {
      const gameConfig = await this.find<GameConfigRow>('game_configs', { name: 'gameConfig' }, ['value'])
      if (!gameConfig) {
        return null
      }
      // redis缓存
      const config = JSON.parse(gameConfig.value) as Record<string, string>
      const configCache: ConfigCache = {
        bakVideoUrl: config.bakVideoUrl || '',
        resourceUrl: config.resourceUrl || '',
      }
      this.redis.hmset('cache:config', configCache)
      return config[key] || null
    }
  }

  async getTempOrderListByRoundId (roundId: number, fields?: (keyof BetTempOrder)[]): Promise<BetTempOrderRow[]> {
    return await this.get<BetTempOrderRow>('game_bet_temp_orders', { round_id: roundId }, fields)
  }

  async detelteTempOrderListByRoundId (roundId: number) {
    return await this.delete('game_bet_temp_orders', { round_id: roundId })
  }

  async getOrderListByRoundId (roundId: number, fields?: (keyof BetOrder)[]): Promise<BetOrderRow[]> {
    return await this.get<BetOrderRow>('game_bet_orders', { round_id: roundId }, fields)
  }

  /**
     * 插入注单信息
     * @param roundId 局 ID
     * @param fields 要查询的字段数组，默认查询所有字段
     * @returns 局信息或 null
     */
  async insertBetOrder (data: Partial<BetOrder>): Promise<number> {
    const insertedId = await this.insert<BetOrder>('game_bet_orders', data)
    // bet_order表有自增id，一定会返回数字
    return insertedId!
  }

  async updateBetOrderById (roundId: number, data: Partial<BetOrder>): Promise<number> {
    const { affectedRows } = await this.update('game_bet_orders', data, { id: roundId })
    return affectedRows || 0
  }

  /**
     * 根据 id 查询局信息
     * @param roundId 局 ID
     * @param fields 要查询的字段数组，默认查询所有字段
     * @returns 局信息或 null
     */
  async getRoundById (roundId: number, fields?: (keyof Round)[]): Promise<Round | null> {
    const selectFields = fields && fields.length > 0 ? fields.join(', ') : '*'
    const rows = await this.query<RoundRow[]>(
        `SELECT ${selectFields} FROM game_round_infos WHERE id = ? LIMIT 1`,
        [roundId]
    )
    return rows[0] || null
  }

  /**
     * 插入局信息
     * @param roundId 局 ID
     * @param fields 要查询的字段数组，默认查询所有字段
     * @returns 局信息或 null
     */
  async insertRound (data: Partial<Round>): Promise<number> {
    const rows = await this.insert<Round>('game_round_infos', data)
    // round表有自增id，一定会返回数字
    return rows!
  }

  /**
     * 根据 id 查询局信息
     * @param roundId 局 ID
     * @param fields 要查询的字段数组，默认查询所有字段
     * @returns 局信息或 null
     */
  async updateRoundById (roundId: number, data: Partial<Round>): Promise<number> {
    const { affectedRows } = await this.update('game_round_infos', data, { id: roundId })
    return affectedRows || 0
  }

  /**
   * 获取局列表
   * @param tableId 桌台ID
   * @param gameType 游戏类型
   * @param currentShoeNo 当前靴号
   * @returns 局列表
   */
  async getRoundList (tableId: number, gameType: number | string, currentShoeNo: number | string, fields?: (keyof Round)[]): Promise<Round[]> {
    let selectFields: string
    if (fields && fields.length > 0) {
      selectFields = fields.join(', ')
    } else {
      selectFields = ['id', 'result', 'details', 'status'].join(', ')
    }
    if (gameType === GameType.Baccarat || gameType === GameType.DragonTiger) {
      // 百家乐和龙虎需要根据靴号查询
      const rows = await this.query<RoundRow[]>(
        `SELECT ${selectFields}
         FROM game_round_infos
         WHERE table_id = ? AND shoe_no = ? AND status > 1
         ORDER BY id ASC`,
        [tableId, currentShoeNo]
      )
      return rows
    } else {
      // 其他游戏类型限制查询最近100局
      const rows = await this.query<RoundRow[]>(
        `SELECT ${selectFields}
         FROM game_round_infos
         WHERE table_id = ? AND status > 1
         ORDER BY id ASC
         LIMIT 100`,
        [tableId]
      )
      return rows
    }
  }

  async saveRoundListCache (tableId: number | string, roundList: Round[]): Promise<void> {
    const roundListRedis = roundList.map(item => {
      return JSON.stringify(item)
    })

    await this.redis.rpush(`sys:round_t:${tableId}`, ...roundListRedis)
  }

  async getRoundListCache (tableId: number | string): Promise<string[]> {
    const roundListRedis = await this.redis.lrange(`sys:round_t:${tableId}`, 0, -1)
    return roundListRedis
  }

  async exitRoundListCache (tableId: number): Promise<number> {
    return await this.redis.exists(`sys:round_t:${tableId}`)
  }

  /**
   * 删除局列表信息,关桌和换靴会用到
   */
  async delRoundListCache (tableId: number | string): Promise<void> {
    await this.redis.del(`sys:round_t:${tableId}`)
  }

  /**
   * 插入一个局信息
   */
  async insertRoundCache (tableId: string | number, gameType:GameType, round:RoundCacheData): Promise<void> {
    // 所以这边用的是lpushx,只有不存在才会插入
    const roundStr = JSON.stringify(round)
    if (gameType === GameType.Baccarat || gameType === GameType.DragonTiger) {
      await this.redis.rpush(`sys:round_t:${tableId}`, roundStr)
    } else {
      const len = await this.redis.llen(`sys:round_t:${tableId}`)
      if (len >= 100) {
        await this.redis.pipeline().lpop(`sys:round_t:${tableId}`).rpush(`sys:round_t:${tableId}`, roundStr).exec()
      } else {
        await this.redis.rpush(`sys:round_t:${tableId}`, roundStr)
      }
    }
  }

  async updateRoundCache (tableId: string | number, key: number, roundData: RoundCacheData) {
    await this.redis.lset(`sys:round_t:${tableId}`, key, JSON.stringify(roundData))
  }

  /**
   * 删除下注统计信息
   */
  async delBetStatsCache (tableId: number): Promise<void> {
    await this.redis.del(`sys:stats_t:${tableId}:c`)
    await this.redis.del(`sys:stats_t:${tableId}:n`)
  }

  /**
   * 累加 在redis中的某个下注统计(按美金，外部换算汇率)
   */
  async setBetStatsCache (tableId: number, betTag: string, value: number): Promise<void> {
    // 不换算汇率直接相加可以换成hincrby
    await this.redis.hincrbyfloat(`sys:stats_t:${tableId}:c`, betTag, value)
    await this.redis.hincrby(`sys:stats_t:${tableId}:n`, betTag, 1)
  }

  /**
   * 获取某桌下注金额统计(按美金，外部换算汇率)
   * @param tableId 桌唯一标记
  */
  async getBetStatsCCache (tableId: number): Promise<Record<string, string>> {
    return await this.redis.hgetall(`sys:stats_t:${tableId}:c`)
  }

  /**
 * 获取某桌下注次数统计(按美金，外部换算汇率)
 * @param tableId 桌唯一标记
 */
  async getBetStatsNCache (tableId: number): Promise<Record<string, string>> {
    return await this.redis.hgetall(`sys:stats_t:${tableId}:n`)
  }

  /**
 * @param tableId 桌唯一标记
 */
  async getBetStatsCache (tableId: number): Promise<{ statsC: Record<string, string>; statsN: Record<string, string> }> {
    const res = await this.redis.pipeline().hgetall(`sys:stats_t:${tableId}:c`).hgetall(`sys:stats_t:${tableId}:n`).exec()
    if (res !== null) {
      return {
        statsC: res[0][1] as Record<string, string>,
        statsN: res[1][1] as Record<string, string>,
      }
    } else {
      return { statsC: {}, statsN: {} }
    }
  }

  /**
   * 缓存某桌当前局的信息
   * @param tableId 桌id
   */
  async setPokerCache (tableId: string | number, poker: { index: string | number; details: number | string }) {
    return await this.redis.hset(`sys:poker_t:${tableId}`, poker.index, poker.details)
  }

  /**
   * 缓存某桌当前局的信息
   * @param tableId 桌id
   */
  async getPokerCache (tableId: string | number) {
    return await this.redis.hgetall(`sys:poker_t:${tableId}`)
  }

  /**
 * 缓存某桌当前局的牌信息
 * @param key 桌唯一标记 lobbyNo*tableNo
 */
  async deletePokerCache (tableId: number | string) {
    return await this.redis.del(`sys:poker_t:${tableId}`)
  }

  /**
 * 初始化轮盘的统计
 * @param tableId
 * @param reset
 */
  async initRoultteStatsCache (tableId: number | string, reset = false) {
    if (reset) {
      await this.redis.del(`sys:roule_stats_t:${tableId}`)
    }
    const isExit = await this.redis.exists(`sys:roule_stats_t:${tableId}`)
    if (!isExit) {
      const stats = {
        red: 0,
        black: 0,
        odd: 0,
        even: 0,
      }
      const roundList = await this.redis.lrange(`sys:round_t:${tableId}`, 0, -1)
      for (const k in roundList) {
        const round = JSON.parse(roundList[k])
        if (round.status !== RoundStatus.Cancel) {
          const curNum = round.details.n
          if (curNum !== 0) {
            if (isRed(curNum)) {
              stats.red = stats.red + 1
            } else {
              stats.black = stats.black + 1
            }
            if (curNum % 2 === 0) {
              stats.even = stats.even + 1
            } else {
              stats.odd = stats.odd + 1
            }
          }
        }
      }
      this.redis.hmset(`sys:roule_stats_t:${tableId}`, stats)
    }
  }

  async getRouletteStatsCache (tableId: number) {
    const total = await this.redis.llen(`sys:round_t:${tableId}`)
    let red = 0
    let black = 0
    let odd = 0
    let even = 0
    if (total > 0) {
      // 拿到下注红黑单双统计
      const stats = await this.redis.hgetall(`sys:roule_stats_t:${tableId}`)
      // 下面这个判断可以不要
      // if (JSON.stringify(stats) !== '{}') {
      red = (Number(stats.red) * 100) / total
      black = (Number(stats.black) * 100) / total
      odd = (Number(stats.odd) * 100) / total
      even = (Number(stats.even) * 100) / total
      // }
    }
    return {
      red: red.toFixed(2),
      black: black.toFixed(2),
      odd: odd.toFixed(2),
      even: even.toFixed(2),
    }
  }

  /**
 * 更新轮盘的统计
 */
  async updateRouletteStatsCache (tableId: number, curNum: number) {
    const rouLen = await this.redis.llen(`sys:round_t:${tableId}`)
    // 拿到下注红黑单双统计
    const stats0 = await this.redis.hgetall(`sys:roule_stats_t:${tableId}`)
    const stats: rouStats = {
      red: Number(stats0.red),
      black: Number(stats0.black),
      odd: Number(stats0.odd),
      even: Number(stats0.even),
    }
    // 在登陆桌子的时候必然会创建统计，所以这里保证有数据
    if (rouLen >= 100) {
      // 获取第一个数据
      const firstRoundString = await this.redis.lrange(`sys:round_t:${tableId}`, 0, 1)
      const round = JSON.parse(firstRoundString[0])
      if (round.status !== RoundStatus.Cancel) {
        const firstRoundNum = round.details.n
        if (firstRoundNum !== 0) {
          if (isRed(firstRoundNum)) {
            stats.red = stats.red - 1
          } else {
            stats.black = stats.black - 1
          }
          if (firstRoundNum % 2 === 0) {
            stats.even = stats.even - 1
          } else {
            stats.odd = stats.odd - 1
          }
        }
      }

      // 判断红黑和单双
    }
    if (curNum !== 0) {
      if (isRed(curNum)) {
        stats.red = stats.red + 1
      } else {
        stats.black = stats.black + 1
      }
      if (curNum % 2 === 0) {
        stats.even = stats.even + 1
      } else {
        stats.odd = stats.odd + 1
      }
    }
    this.redis.hmset(`sys:roule_stats_t:${tableId}`, stats)
    // return {
    //     red: ((Number(stats.red) * 100) / total).toFixed(2),
    //     black: ((Number(stats.black) * 100) / total).toFixed(2),
    //     odd: ((Number(stats.odd) * 100) / total).toFixed(2),
    //     even: ((Number(stats.even) * 100) / total).toFixed(2),
    // };
  }

  async initRoultterankingCache (tableId: number | string, reset = false) {
    const isExit = await this.redis.exists(`sys:roule_rank_t:${tableId}`)
    if (!isExit || reset) {
      // 先构造全部是0的
      const args = []
      for (let i = 0; i < 37; i++) {
        args.push(0, i)
      }
      await this.redis.zadd(`sys:roule_rank_t:${tableId}`, ...args)
      const roundList = await this.redis.lrange(`sys:round_t:${tableId}`, 0, -1)
      for (const k in roundList) {
        const round = JSON.parse(roundList[k])
        if (round.status !== RoundStatus.Cancel) {
          const curNum = round.details.n
          this.redis.zincrby(`sys:roule_rank_t:${tableId}`, 1, curNum)
        }
      }
    }
  }

  async getRouletteRankingCache (tableId: number | string) {
    const rank = await this.redis.zrangebyscore(`sys:roule_rank_t:${tableId}`, '-inf', '+inf')

    return {
      cold: rank.slice(0, 5),
      hot: rank.slice(-5).reverse(),
    }
  }

  async updateRouletteRankingCache (tableId: number | string, curNum: number) {
    const rouLen = await this.redis.llen(`sys:round_t:${tableId}`)
    if (rouLen >= 100) {
      // 获取第一个数据
      const firstRoundString = await this.redis.lrange(`sys:round_t:${tableId}`, 0, 1)
      const round = JSON.parse(firstRoundString[0])
      if (round.status !== RoundStatus.Cancel) {
        const firstRoundNum = round.details.n
        const pipe = this.redis.pipeline()
        pipe.zincrby(`sys:roule_rank_t:${tableId}`, -1, firstRoundNum)
        pipe.zincrby(`sys:roule_rank_t:${tableId}`, 1, curNum.toString())
        pipe.exec()
      }
    } else {
      this.redis.zincrby(`sys:roule_rank_t:${tableId}`, 1, curNum.toString())
    }
  }

  // async setGoodRoadCache (tableId: number | string, gameRes: any[]) {
  //   return this.redis
  //     .pipeline()
  //     .del(`sys:goodroad:t:${tableId}`)
  //     .rpush(`sys:goodroad:t:${tableId}`, ...gameRes)
  //     .exec()
  // }

  // async updateGoodRoadCache (tableId: number | string, gameRes: number) {
  //   const len = await this.redis.llen(`sys:goodroad:t:${tableId}`)
  //   // 以最长好路判断的加一
  //   if (len >= 9) {
  //     await this.redis.pipeline().lpop(`sys:goodroad:t:${tableId}`).rpush(`sys:goodroad:t:${tableId}`, gameRes).exec()
  //   } else {
  //     await this.redis.rpush(`sys:goodroad:t:${tableId}`, gameRes)
  //   }
  // }

  // getGoodRoadCache (tableId: number | string) {
  //   return this.redis.lrange(`sys:goodroad:t:${tableId}`, 0, -1)
  // }
}
