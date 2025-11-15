import { request } from 'undici'
import * as crypto from 'crypto'
import { FastifyInstance } from 'fastify'
import { GameAgentRow } from '../types/table.types.js'

export enum ApiErrorCode {
  REQUEST_ERR = 900, // 请求失败,
  TIME_OUT = 901, // 请求超时,
  RETURN_ERR = 902, // 返回数据格式错误
  // 以下第三方返回的错误码,和open api项目统一
  UNKNOWN_ERR = 10, // '系统未知错误!',
  PARAMS_ERROR = 11, // '输入参数错误',
  SYS_MAINTAIN = 12,
  ACCOUNT_NOT_EXIT = 100,
  ACCOUNT_BLOCKED = 101,
  BALANCE_NOT_ENOUGH = 102,
  USER_BET_BLOCK = 104,
  USER_LIMIT_CROSS = 105, // '该用户限红越界',
  // 数据验证错误
  DATA_SIGN_ERR = 103,
  // 同一个交易码如果已经被第三方系统处理时，好是返回正确处理，和余额
  DUPLICATE_TXD = 104,
  LOGIN_EXPIRED = 105,
  CURRENCY_ERR = 106,
  BET_BLOCKED = 107,
}

// 此文件范围内统一抛出这个类型错误,外部统一判断code
export class ApiError extends Error {
  code: number
  data: unknown
  constructor (message: string, code = 10000, data: unknown) {
    super(message)
    this.code = code
    this.data = data
  }
}

interface BaseResponse { errorCode: number; message?: string;amount?: number; }
export interface GameApiResponse extends BaseResponse { [key: string]: unknown }

export class ApiService {
  constructor (private fastify: FastifyInstance) {}

  private get redis () {
    return this.fastify.redis
  }

  async getUserBalance (agentSn: string, data: { username: string; currency: string; gameType?: number }) {
    return this.gamePost(agentSn, 'getUserBalance', data)
  }

  // 暂时同步下注,不使用取消下注,有点麻烦
  async placeBet (agentSn: string, betData: BetData) {
    return this.gamePost(agentSn, 'placeBet', betData)
  }

  async reverseBet (agentSn: string, data: reverseBetData) {
    return this.gamePost(agentSn, 'reverseBet', data)
  }

  async settle (agentSn: string, data: SettleData) {
    return this.gamePost(agentSn, 'settle', data)
  }

  async cancelRound (agentSn: string, data: CancelRoundData) {
    return this.gamePost(agentSn, 'cancelRound', data)
  }

  async reSettle (agentSn: string, data: SettleData) {
    return this.gamePost(agentSn, 'reSettle', data)
  }

  async changeOnline (agentSn: string, data: { username: string; is_online: number }) {
    return this.gamePost(agentSn, 'userIsOnline', data)
  }

  private async gamePost (agentSn: string, action: string, data: unknown) {
    const api = await this.getApi(agentSn)
    const body = JSON.stringify(data)
    const { t, s } = this.encrypt(data)
    const url = `${api}?a=${action}&t=${t}&s=${s}`
    let response
    try {
      response = await request(url, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        bodyTimeout: 5000,
        headersTimeout: 5000,
      })
    } catch (err) {
      // FetchError
      const error = err as { type?: string }
      const errCode = error.type === 'request-timeout' ? ApiErrorCode.TIME_OUT : ApiErrorCode.REQUEST_ERR
      throw new ApiError(error.type || 'unknown error', errCode, { api, data })
    }

    if (response.statusCode !== 200) {
      throw new ApiError('response status err', ApiErrorCode.REQUEST_ERR, { api, data })
    }
    let res: GameApiResponse
    try {
      res = await response.body.json() as GameApiResponse
    } catch {
      throw new ApiError('body parse json err', ApiErrorCode.RETURN_ERR, { api, data })
    }
    if (!(res && res.errorCode === 0)) {
      throw new ApiError(`api return error:${res.message}`, res.errorCode || ApiErrorCode.UNKNOWN_ERR, { api, data })
    }
    return res
  }

  /**
   * 获取api地址
   * TODO：每次从redis，性能会稍微差一点，可以考虑直接放到内存中，但是这样的话(修改了之后处理很麻烦)
   * @param agentSn
   */
  private async getApi (agentSn: string): Promise<string> {
    // 先从redis读，没有再从mysql读,
    const api = await this.redis.get(`cache:agent:${agentSn}:api`)
    if (api) {
      return api
    } else {
      // 先从mysql读
      const agent = await this.fastify.repositories.table.find<GameAgentRow>(
        'game_agents',
        { agent_sn: agentSn },
        ['api']
      )
      if (agent && agent.api) {
        const apiUrl = agent.api
        await this.redis.set(`cache:agent:${agentSn}:api`, agent.api)
        return apiUrl
      } else {
        throw new Error('api配置不存在:mysql')
      }
    }
  }

  /**
   * 使用代理的签名实现加密，代理的签名如果改变，一定要清理相应的redis缓存,一般不改变
   * @param data
   */
  private encrypt (data: unknown): { t: number; s: string } {
    const t = Math.round(Date.now() / 1000)
    const sign = crypto
      .createHash('md5')
      .update(JSON.stringify(data) + '*' + t)
      .digest('hex')
    return {
      t,
      s: sign,
    }
  }
}

export type BetData = {
  username: string;
  currency: string;
  amount: number;
  txd: string;
  time: Date;
  ip: string;
  gameType: number;
  platform: string;
  tableId: string;
  lobby: string;
  gameId: string;
  betDetails: Record<string, unknown>;
}

export type reverseBetData = {
  username: string;
  currency: string;
  amount: number;
  txd: string;
  time: Date;
  gameType: number;
  tableId: string;
  gameId: string;
  reverseId: string;
}

export type SettleData = {
  username: string;
  currency: string;
  betTime: Date;
  betAmount: number;
  amount: number;
  winLose: number;
  rolling: number;
  txd: string;
  gameType: number;
  tableId: string;
  gameId: string;
  payout_time: Date;
  gameInfos: Record<string, unknown>;
  betInfos: Record<string, unknown>;
}

export type CancelRoundData = {
  username: string;
  currency: string;
  betAmount: number;
  amount: number;
  txd: string;
  time: Date;
  tableId: string;
  gameType: number;
  gameId: string;
  betInfos: Record<string, unknown>;
}
