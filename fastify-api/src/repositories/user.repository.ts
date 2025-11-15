import { BaseRepository } from './base.repository.js'
import { FastifyInstance } from 'fastify'
import { User, UserBetStats, UserRow, UserWallet, UserWalletRow } from '../types/table.types.js'
import { UserCache } from '../types/common.types.js'
import { PoolConnection } from 'mysql2/promise'

export class UserRepository extends BaseRepository {
  constructor (protected fastify: FastifyInstance) {
    super(fastify)
  }

  /**
 * 获取用户信息
 * @param where
 * @param select
 */
  async getUserInfo (where: Partial<User>, select?: (keyof User)[]) {
    if (!select) {
      select = [
        'id',
        'user_sn',
        'username',
        'avatar',
        'currency',
        'agent_sn',
        'agent_id',
        'nickname',
        'user_type',
        'wallet_type',
        'status',
        'bet_status',
        'commission',
        'comm_status',
        'last_login_ip', // IP是因为，session里面的ip是代理的ip,所以真实ip使用这个
        'last_login_device',
      ]
    }
    return await this.find<UserRow>('game_users', where, select)
  }

  /**
 * 更新用户信息
 * @param where
 * @param data
 */
  async updateUserInfo (where: Partial<User>, data: Partial<User>) {
    return await this.update('game_users', where, data)
  }

  async addOnlineUserSetCache (userId:number) {
    this.redis.sadd('front:uonline', userId)
  }

  async delOnlineUserSetCache (userId:number) {
    this.redis.srem('front:uonline', userId)
  }

  /**
 * 存贮用户到redis
 * @param userInfo
 */
  async saveUserCache (userInfo:UserCache, isPersist = false) {
    if (isPersist) {
      // 强行做一下取消过期时间
      await this.redis.persist(`front:u:${userInfo.id}`)
      await this.redis.hdel(`front:u:${userInfo.id}`, 'currentTable')
    }
    await this.redis.hmset(`front:u:${userInfo.id}`, userInfo as UserCache)
  }

  /**
 * 从redis获取用户信息，没有从数据库读取
 * @param userInfo
 */
  async getUserCache (uid:number) {
    let userInfo = (await this.redis.hgetall(`front:u:${uid}`)) as UserCache
    if (JSON.stringify(userInfo) == '{}') {
      userInfo = (await (this.getUserInfo({ id: uid }) as Promise<unknown>)) as UserCache
      // await this.redis.hmset(`front:u:${uid}`, userInfo);
    }
    return userInfo
  }

  /**
 * redi更新点数
 * 为了七座模式显示金额,仅仅用于显示,现在应该只有第一次获取所有用户信息时候会去取一次金额,但是每次更新余额都要去维护
 * @param uid
 * @param point
 * @returns
 */
  async updateUserPointCache (uid:number, point:number) {
    return await this.redis.hset(`front:u:${uid}`, 'point', point)
  }

  /**
 * redis删除用户
 * @param uid
 */
  async deleteUserCache (uid:number, delay = false) {
    if (delay) {
      this.redis.expire(`front:u:${uid}`, 60)
    } else {
      this.redis.del(`front:u:${uid}`)
    }
  }

  /**
 * 获取用户的某个属性
 * @param uid
 */
  async getUserFieldCache (uid:number, field:string) {
    return await this.redis.hget(`front:u:${uid}`, field)
  }

  /**
 * 7卓模式，批量获取用户数据
 * @param userLocations
 * @returns
 */
  //  async mGetUserRedis(userLocations: UserLocations) {
  //     const pipe = this.redis.pipeline();
  //     const uids = [];
  //     for (const location in userLocations) {
  //         if (userLocations[location]) {
  //             uids.push(userLocations[location]);
  //             pipe.hmget(`front:u:${userLocations[location]}`, 'id', 'nickname', 'currency', 'point', 'avatar');
  //         }
  //     }
  //     const res = await pipe.exec();
  //     const userData: {[uid: string]: any} = {};
  //     res.forEach((item, index) => {
  //         userData[uids[index]] = {
  //             id: Number(item[1][0]),
  //             nickname: item[1][1],
  //             currency: item[1][2],
  //             point: Number(item[1][3]),
  //             avatar: item[1][4],
  //         };
  //     });
  //     return userData;
  // }

  /**
 * 判断当前用户是否被拉黑某桌
 * @param userId
 * @param tableId
 */
  async checkBlockTable (userId: number, tableId: number): Promise<boolean> {
    const res = await this.find('game_user_block_tables', { user_id: userId, table_id: tableId })
    return !!res
  }

  /**
 * 转账钱包获取用户balance
 * @param userId
 */
  async getWalletByUId (userId: number, select?: (keyof UserWallet)[]) {
    if (!select) {
      select = ['user_id', 'balance']
    }
    return await this.find<UserWalletRow>('game_user_wallets', { user_id: userId }, select)
  }

  /**
 *
 * 转账钱包更新钱包信息
 * @param wallet
 */
  async updateBalance (userId:number, change:number, conn: PoolConnection): Promise<{ affectedRows: number; insertId?: number }> {
    const sql = 'UPDATE game_user_wallets SET balance = balance + ? WHERE user_id = ?'
    const values = [change, userId]
    const [result] = await this.execute(sql, values, conn)
    return result as { affectedRows: number; insertId?: number }
  }

  // /**
  //  * 保存该局某用户统计
  //  */
  // async saveUserRoundBetStateCache (roundId:number, userId:number, betTag:string, value:number) {
  //   await this.redis.hincrby(`front:stats:r_${roundId}:u_${userId}`, betTag, value)
  // }

  // /**
  //  * 获取该局某用户统计
  //  */
  // async getUserRoundBetStateCache (roundId:number, userId:number) {
  //   await this.redis.hgetall(`front:stats:r_${roundId}:u_${userId}`)
  // }

  // /**
  //  * 判断是否存在该局某用户统计
  //  */
  // async isExitUserRoundBetCache (roundId:number, userId:number) {
  //   await this.redis.exists(`front:stats:r_${roundId}:u_${userId}`)
  // }

  /**
   * 删除该局所有人下注统计(结算或者取消的时候)
   */
  async delUserRoundBetStateCache (roundId:number) {
    // ? 这里无法找到声明
    this.batchDeleteByPrefix(`front:stats:r_${roundId}:u_*`)
  }

  /**
 * 获取聊天次数，防止刷聊天
 * @param tableId
 * @param userId
 */
  async incrChatCount (tableId:number, userId:number) {
    const c = await this.redis.incr(`front:chat:t_${tableId}:u_${userId}`)
    if (c === 1) {
      this.redis.expire(`front:chat:t_${tableId}:u_${userId}`, 30)
    }
    return c
  }

  /**
 * 更新用户下注统计相关
 * @param userId
 * @param data
 * @returns
 */
  async updateUserBetStats (userId: number, data: Partial<UserBetStats>, conn?: PoolConnection): Promise<{ affectedRows: number; insertId?: number }> {
    const setClauses: string[] = []
    const values: unknown[] = []
    for (const field in data) {
      const value = data[field as keyof UserBetStats]
      setClauses.push(`${field} = ${field} + ?`)
      values.push(value)
    }
    const sql = `UPDATE game_user_bet_stats SET ${setClauses.join(', ')} WHERE user_id = ?`
    values.push(userId)
    const [result] = await this.execute(sql, values, conn)
    return result as { affectedRows: number; insertId?: number }
  }

  async getUserCommCache (userId: number): Promise<number> {
    const comm = await this.redis.hget(`front:u:${userId}`, 'comm')
    return comm ? Number(comm) : 0
  }

  async getLeaderboard () {
    const cache = await this.redis.get('front:leaderboard')
    if (cache) {
      return JSON.parse(cache)
    } else {
      const data = await this.query(
        'select sb.today_winlose as profit,u.username,u.currency,is_online as online from (select user_id,today_winlose from game_user_bet_stats order by today_winlose desc limit 10) as sb left join game_users u on sb.user_id = u.id;'
      )
      this.redis.setex('front:leaderboard', 120, JSON.stringify(data))
      return data
    }
  }
}
