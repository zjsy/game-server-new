import { FastifyInstance } from 'fastify'
import { PushConst } from '../constants/push.onstants.js'
import { CentrifugoClient } from '../utils/centrifugo.js'

// 游戏消息类型定义
export interface GameMessage {
  type: PushConst
  data: unknown
  timestamp: number
}

export class GameBroadcastService {
  private readonly client: CentrifugoClient

  constructor (fastify:FastifyInstance) {
    this.client = new CentrifugoClient(
      fastify.config.CENTRIFUGO_API_URL!,
      fastify.config.CENTRIFUGO_API_KEY!
    )
  }

  /**
   * 发送游戏状态更新
   * @param gameId - 游戏ID
   * @param gameData - 游戏数据
   */
  async globalBroadcast (type: PushConst, gameData: unknown): Promise<void> {
    const message: GameMessage = {
      type,
      data: gameData,
      timestamp: Date.now()
    }

    await this.client.publish('global', message)
  }

  /**
   * 指定用户发送数据
   * @param gameId - 游戏ID
   * @param gameData - 游戏数据
   */
  async pushMsgByPlayerId (userId:number, type: PushConst, gameData: unknown): Promise<void> {
    const message: GameMessage = {
      type,
      data: gameData,
      timestamp: Date.now()
    }

    await this.client.publish(`user:${userId}`, message)
  }
}
