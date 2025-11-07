import { FastifyInstance } from 'fastify'
import { TableLoginResponse } from '../types/table.types.js'
import { TableRepository } from '../repositories/table.repository.js'
import crypto from 'crypto'

export class TableService {
  private tableRepository: TableRepository

  constructor (private fastify: FastifyInstance) {
    this.tableRepository = new TableRepository(fastify)
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
    const table = await this.tableRepository.findByTableNo(tableNo)
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

    // 4. 生成 JWT token
    const token = this.fastify.jwt.sign(
      {
        tableNo: table.table_no,
        tableId: table.id,
        lobbyNo: table.lobby_no,
        gameType: table.game_type,
      },
      {
        expiresIn: '24h', // token 有效期 24 小时
      }
    )

    // 5. 更新桌台登录状态
    await this.tableRepository.updateLoginStatus(table.table_no, token, loginIp)

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

    // 3. 生成新的 JWT token
    const expiresIn = '24h'
    const token = this.fastify.jwt.sign(
      {
        tableNo: table.table_no,
        userId: table.id.toString(),
        tableId: table.id,
        lobbyNo: table.lobby_no,
        gameType: table.game_type,
      },
      {
        expiresIn,
      }
    )

    // 4. 更新桌台的 token
    await this.tableRepository.updateLoginStatus(table.table_no, token, loginIp)

    this.fastify.log.info({ tableNo, loginIp }, 'Token refreshed successfully')

    // 5. 返回新 token
    return {
      token,
      expiresIn,
    }
  }
}
