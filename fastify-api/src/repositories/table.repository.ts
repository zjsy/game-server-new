import { Dealer, DealerRow } from '../entities/Dealer.js'
import { mapToTableCache, Table, TableCache, TableRow } from '../entities/TableInfo.js'
import { toRedisHash } from '../utils/json.parse.utils.js'
import { BaseRepository } from './base.repository.js'
import { FastifyInstance } from 'fastify'

export class TableRepository extends BaseRepository {
  constructor (protected fastify: FastifyInstance) {
    super(fastify)
  }

  /**
   * 根据 table_no 查询桌台信息
   * @param tableNo 桌台编号
   * @param fields 要查询的字段数组,默认查询所有字段
   * @returns 桌台信息或 null
   */
  // 重载：不传 fields 返回整行
  findTable (where: Partial<Table>): Promise<TableRow>
  // 重载：传入字段数组时返回对应字段的子集
  findTable <K extends keyof TableRow>(where: Partial<Table>, fields: K[]): Promise<Pick<TableRow, K>>
  findTable <K extends keyof TableRow>(where: Partial<Table>, fields?: K[]) {
    return this.find<TableRow, K>('game_tables', where, fields)
  }

  /**
   * 更新桌台
   * @param tableNo 桌台编号
   * @param token JWT token
   * @param loginIp 登录 IP
   * @returns 影响的行数
   */
  async updateTable (where: Partial<Table>, fields: Partial<Table>): Promise<number> {
    const { affectedRows } = await this.update<Table>('game_tables', fields, where)
    return affectedRows
  }

  async findTableCache (tableId: string | number): Promise<TableCache | null> {
    const res = await this.redis.hgetall(`sys:t:${tableId}`)
    if (Object.keys(res).length === 0) {
      return null
    }
    return mapToTableCache(res)
  }

  async updateTableCache (tableId: string | number, table: Partial<TableCache>): Promise<void> {
    await this.redis.hmset(`sys:t:${tableId}`, toRedisHash(table))
  }

  async findDealerByNo (dealerNo: string, fields: (keyof Dealer)[]) {
    return this.find<DealerRow>('game_dealers', { dealer_no: dealerNo }, fields)
  }

  async updateDealer (dealerId: number, fields: Partial<Dealer>): Promise<number> {
    const { affectedRows } = await this.update<Dealer>('game_dealers', fields, { id: dealerId })
    return affectedRows
  }
}
