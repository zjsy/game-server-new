import { BaseRepository } from './base.repository.js'
import { FastifyInstance } from 'fastify'
import { Table } from '../types/table.types.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

interface TableRow extends RowDataPacket, Table {}

export class TableRepository extends BaseRepository {
  constructor (protected fastify: FastifyInstance) {
    super(fastify)
  }

  /**
   * 根据 table_no 查询桌台信息
   * @param tableNo 桌台编号
   * @returns 桌台信息或 null
   */
  async findByTableNo (tableNo: string): Promise<Table | null> {
    const rows = await this.query<TableRow[]>(
      'SELECT * FROM fg_game_table WHERE table_no = ? LIMIT 1',
      [tableNo],
      false // 使用读库
    )
    return rows[0] || null
  }

  /**
   * 更新桌台的登录状态和 token
   * @param tableNo 桌台编号
   * @param token JWT token
   * @param loginIp 登录 IP
   * @returns 影响的行数
   */
  async updateLoginStatus (tableNo: string, token: string, loginIp: string): Promise<number> {
    return this.withConnection(async (conn) => {
      const [result] = await conn.query<ResultSetHeader>(
        `UPDATE fg_game_table 
         SET token = ?, login_ip = ?, is_login = 1, updated_at = NOW()
         WHERE table_no = ?`,
        [token, loginIp, tableNo]
      )
      return result.affectedRows || 0
    }, true) // 使用写库
  }
}
