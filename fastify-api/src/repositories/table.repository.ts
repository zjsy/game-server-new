import { BaseRepository } from './base.repository.js'
import { FastifyInstance } from 'fastify'
import { Dealer, DealerRow, Table, TableRow } from '../types/table.types.js'

export class TableRepository extends BaseRepository {
  constructor (protected fastify: FastifyInstance) {
    super(fastify)
  }

  /**
   * 根据 table_no 查询桌台信息
   * @param tableNo 桌台编号
   * @param fields 要查询的字段数组，默认查询所有字段
   * @returns 桌台信息或 null
   */
  findTable (where: Partial<Table>, fields?: (keyof Table)[]): Promise<Table | null> {
    return this.find<TableRow>('game_tables', where, fields)
  }

  /**
   * 更新桌台
   * @param tableNo 桌台编号
   * @param token JWT token
   * @param loginIp 登录 IP
   * @returns 影响的行数
   */
  async updateTable (tableNo: string, token: string, loginIp: string): Promise<number> {
    const { affectedRows } = await this.update<Table>('game_tables', { token, login_ip: loginIp, is_login: 1, }, { table_no: tableNo })
    return affectedRows
  }

  async findDealerByNo (dealerNo: string, fields: (keyof Dealer)[]): Promise< Dealer | null> {
    return this.find<DealerRow>('game_dealers', { dealer_no: dealerNo }, fields)
  }

  async updateDealer (dealerNo: string, fields: Partial<Dealer>): Promise<number> {
    const { affectedRows } = await this.update<Dealer>('game_dealers', fields, { dealer_no: dealerNo })
    return affectedRows
  }
}
