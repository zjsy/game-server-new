import { BaseRepository } from './base.repository.js'
import { FastifyInstance } from 'fastify'
import type { RowDataPacket } from 'mysql2'
import { Round } from '../types/table.types.js'
import { TableCache } from '../types/common.types.js'
import { GameType, RoundStatus } from '../constants/game.constants.js'
import { isRed, rouStats } from '../constants/roulette.constants.js'

interface RoundRow extends RowDataPacket, Round {}

export class GameRepository extends BaseRepository {
  constructor (protected fastify: FastifyInstance) {
    super(fastify)
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
  async getRoundList (tableId: number, gameType: number | string, currentShoeNo: number | string): Promise<Round[]> {
    if (gameType === GameType.Baccarat || gameType === GameType.DragonTiger) {
      // 百家乐和龙虎需要根据靴号查询
      const rows = await this.query<RoundRow[]>(
        `SELECT id, result, details, status 
         FROM game_round_infos 
         WHERE table_id = ? AND shoe_no = ? AND status > 1 
         ORDER BY id ASC`,
        [tableId, currentShoeNo]
      )
      return rows
    } else {
      // 其他游戏类型限制查询最近100局
      const rows = await this.query<RoundRow[]>(
        `SELECT id, result, details, status 
         FROM game_round_infos 
         WHERE table_id = ? AND status > 1 
         ORDER BY id ASC 
         LIMIT 100`,
        [tableId]
      )
      return rows
    }
  }

  async updateTableCache (tableId: string | number, table: TableCache) {
    this.redis.hmset(`sys:t:${tableId}`, table)
  }

  async saveRoundListCache (tableId: number | string, roundList: Round[]) {
    const roundListRedis = roundList.map(item => {
      return JSON.stringify(item)
    })

    this.redis.rpush(`sys:round_t:${tableId}`, ...roundListRedis)
  }

  async exitRoundListCache (tableId: number) {
    return this.redis.exists(`sys:round_t:${tableId}`)
  }

  /**
 * 缓存某桌当前局的信息
 * @param tableId 桌id
 */
  async setPokerCache (tableId: string | number, poker: { index: string; details: number | string }) {
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

  async setGoodRoadCache (tableId: number | string, gameRes: any[]) {
    return this.redis
      .pipeline()
      .del(`sys:goodroad:t:${tableId}`)
      .rpush(`sys:goodroad:t:${tableId}`, ...gameRes)
      .exec()
  }

  async updateGoodRoadCache (tableId: number | string, gameRes: number) {
    const len = await this.redis.llen(`sys:goodroad:t:${tableId}`)
    // 以最长好路判断的加一
    if (len >= 9) {
      await this.redis.pipeline().lpop(`sys:goodroad:t:${tableId}`).rpush(`sys:goodroad:t:${tableId}`, gameRes).exec()
    } else {
      await this.redis.rpush(`sys:goodroad:t:${tableId}`, gameRes)
    }
  }

  getGoodRoadCache (tableId: number | string) {
    return this.redis.lrange(`sys:goodroad:t:${tableId}`, 0, -1)
  }
}
