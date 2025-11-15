import { fetch } from 'undici'

export interface CentrifugoPublishParams {
  channel: string
  data: unknown
}

export interface CentrifugoResponse {
  result?: unknown
  error?: {
    code: number
    message: string
  }
}

export interface CentrifugoChannelInfo {
  num_clients: number
  num_users: number
}

export interface CentrifugoHistoryParams {
  channel: string
  limit?: number
  since?: {
    offset: number
    epoch: string
  }
  reverse?: boolean
}

export interface CentrifugoHistoryResult {
  publications: Array<{
    offset: number
    data: unknown
    info?: {
      client: string
      user: string
    }
  }>
  offset: number
  epoch: string
}

export interface CentrifugoStatsResult {
  nodes: Array<{
    name: string
    num_clients: number
    num_users: number
    num_channels: number
    uptime: number
  }>
}

export class CentrifugoClient {
  private readonly apiUrl: string
  private readonly headers: Record<string, string>
  private readonly timeoutMs = 5000

  constructor (
    apiUrl: string,
    apiKey: string
  ) {
    this.apiUrl = apiUrl
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `apikey ${apiKey}`
    }
  }

  private async post<T = unknown> (body: unknown): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
        signal: controller.signal
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Centrifugo HTTP ${res.status}: ${text}`)
      }
      return await res.json() as T
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * 发布消息到指定频道
   * @param channel - 频道名称
   * @param data - 消息数据
   * @returns API响应结果
   */
  async publish (channel: string, data: unknown): Promise<CentrifugoResponse> {
    try {
      const response = await this.post<CentrifugoResponse>({
        method: 'publish',
        params: {
          channel,
          data
        }
      })
      return response
    } catch (error) {
      console.error('Centrifugo publish error:', error)
      throw error
    }
  }

  /**
   * 广播消息到多个频道
   * @param channels - 频道名称数组
   * @param data - 消息数据
   * @returns 所有频道的发送结果
   */
  async broadcast (channels: string[], data: unknown): Promise<CentrifugoResponse[]> {
    try {
      const promises = channels.map(channel => this.publish(channel, data))
      return await Promise.all(promises)
    } catch (error) {
      console.error('Centrifugo broadcast error:', error)
      throw error
    }
  }

  /**
     * 批量发布消息（使用单个API调用）
     * @param commands - 批量命令数组
     * @returns 批量操作结果
     */
  async batchPublish (commands: Array<{ channel: string; data: unknown }>): Promise<CentrifugoResponse[]> {
    try {
      const batchCommands = commands.map((cmd, index) => ({
        id: index + 1,
        method: 'publish',
        params: {
          channel: cmd.channel,
          data: cmd.data
        }
      }))

      const response = await this.post<CentrifugoResponse[]>(batchCommands)
      return response
    } catch (error) {
      console.error('Centrifugo batch publish error:', error)
      throw error
    }
  }

  /**
     * 获取频道信息
     * @param channel - 频道名称
     * @returns 频道信息
     */
  async getChannelInfo (channel: string): Promise<CentrifugoChannelInfo> {
    try {
      const response = await this.post<CentrifugoResponse>({
        method: 'info',
        params: { channel }
      })
      return response.result as CentrifugoChannelInfo
    } catch (error) {
      console.error('Centrifugo get channel info error:', error)
      throw error
    }
  }

  /**
     * 获取频道历史消息
     * @param params - 历史消息查询参数
     * @returns 历史消息
     */
  async getHistory (params: CentrifugoHistoryParams): Promise<CentrifugoHistoryResult> {
    try {
      const response = await this.post<CentrifugoResponse>({
        method: 'history',
        params
      })
      return response.result as CentrifugoHistoryResult
    } catch (error) {
      console.error('Centrifugo get history error:', error)
      throw error
    }
  }

  /**
     * 获取频道列表
     * @param pattern - 频道名称模式（可选）
     * @returns 频道列表
     */
  async getChannels (pattern?: string): Promise<string[]> {
    try {
      const response = await this.post<CentrifugoResponse>({
        method: 'channels',
        params: pattern ? { pattern } : {}
      })
      const result = response.result as { channels?: string[] } | undefined
      return result?.channels ?? []
    } catch (error) {
      console.error('Centrifugo get channels error:', error)
      throw error
    }
  }

  /**
     * 断开用户连接
     * @param user - 用户ID
     * @returns 操作结果
     */
  async disconnect (user: string): Promise<CentrifugoResponse> {
    try {
      const response = await this.post<CentrifugoResponse>({
        method: 'disconnect',
        params: { user }
      })
      return response
    } catch (error) {
      console.error('Centrifugo disconnect error:', error)
      throw error
    }
  }

  /**
     * 取消用户订阅
     * @param user - 用户ID
     * @param channel - 频道名称
     * @returns 操作结果
     */
  async unsubscribe (user: string, channel: string): Promise<CentrifugoResponse> {
    try {
      const response = await this.post<CentrifugoResponse>({
        method: 'unsubscribe',
        params: {
          user,
          channel
        }
      })
      return response
    } catch (error) {
      console.error('Centrifugo unsubscribe error:', error)
      throw error
    }
  }

  /**
     * 刷新用户连接
     * @param user - 用户ID
     * @param expired - 是否设置为过期
     * @param expireAt - 过期时间戳
     * @returns 操作结果
     */
  async refresh (user: string, expired?: boolean, expireAt?: number): Promise<CentrifugoResponse> {
    try {
      const params: Record<string, unknown> = { user }
      if (expired !== undefined) params.expired = expired
      if (expireAt !== undefined) params.expire_at = expireAt

      const response = await this.post<CentrifugoResponse>({
        method: 'refresh',
        params
      })
      return response
    } catch (error) {
      console.error('Centrifugo refresh error:', error)
      throw error
    }
  }

  /**
   * 获取节点统计信息
   * @returns 节点统计信息
   */
  async getStats (): Promise<CentrifugoStatsResult> {
    try {
      const response = await this.post<CentrifugoResponse>({
        method: 'stats'
      })
      return response.result as CentrifugoStatsResult
    } catch (error) {
      console.error('Centrifugo get stats error:', error)
      throw error
    }
  }
}

// 创建单例实例
// let centrifugoInstance: CentrifugoClient | null = null

// export function getCentrifugoClient (): CentrifugoClient {
//   if (!centrifugoInstance) {
//     const apiUrl = process.env.CENTRIFUGO_API_URL
//     const apiKey = process.env.CENTRIFUGO_API_KEY

//     if (!apiUrl || !apiKey) {
//       throw new Error('CENTRIFUGO_API_URL and CENTRIFUGO_API_KEY must be set in environment variables')
//     }

//     centrifugoInstance = new CentrifugoClient(apiUrl, apiKey)
//   }

//   return centrifugoInstance
// }

// // 导出单例实例
// export const centrifugo = getCentrifugoClient()
