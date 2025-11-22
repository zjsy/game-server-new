import { FastifyInstance } from 'fastify'

export enum ApiType {
  BET = 'Bet',
  // 荷官端接口
  START_GAME = 'StartGame',
  SETTLE_ROUND = 'SettleRound',
  RESETTLE_ROUND = 'ResettleRound',
  CANCEL_ROUND = 'CancelRound',
}
export class LockService {
  private fastify: FastifyInstance

  constructor (fastify: FastifyInstance) {
    this.fastify = fastify
  }

  // 设置接口锁
  async setApiLock (type: ApiType, uid: number | string, ttl: number = 3000): Promise<boolean> {
    const key = this.getApiLockKey(type, uid)
    return this.acquireLock(key, ttl)
  }

  async releaseApiLock (type: ApiType, uid: number | string) {
    const key = this.getApiLockKey(type, uid)
    return this.fastify.redis.del(key)
  }

  async acquireLock (key: string, ttl: number): Promise<boolean> {
    const result = await this.fastify.redis.set(key, '1', 'PX', ttl, 'NX')
    return result === 'OK'
  }

  async releaseLock (key: string): Promise<void> {
    await this.fastify.redis.del(key)
  }

  private getApiLockKey (type: ApiType, uid: number | string): string {
    return `lock:${type}:${uid}`
  }
}
