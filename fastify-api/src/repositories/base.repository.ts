import { FastifyInstance } from 'fastify'
import { PoolConnection, ResultSetHeader } from 'mysql2/promise'

export class BaseRepository {
  constructor (protected fastify: FastifyInstance) {}

  // ✅ 提供两种方式的辅助方法
  protected async withConnection<T>(
    callback: (conn: PoolConnection) => Promise<T>,
    useWrite = true
  ): Promise<T> {
    const pool = useWrite ? this.fastify.mysql.write : this.fastify.mysql.read
    const conn = await pool.getConnection()
    try {
      return await callback(conn)
    } finally {
      conn.release()
    }
  }

  protected async query<T>(
    sql: string,
    values?: unknown[],
    options?: { useWrite?: boolean; conn?: PoolConnection }
  ): Promise<T> {
    const { useWrite = false, conn } = options || {}

    // 如果传入了连接，直接使用
    if (conn) {
      const [rows] = await conn.query(sql, values)
      return rows as T
    }

    // 否则自动管理连接
    return this.withConnection(async (conn) => {
      const [rows] = await conn.query(sql, values)
      return rows as T
    }, useWrite)
  }

  // 支持外部连接的 execute
  async execute (
    sql: string,
    values?: unknown[],
    conn?: PoolConnection
  ) {
    // 如果传入了连接，直接使用
    if (conn) {
      return conn.execute<ResultSetHeader>(sql, values)
    }

    // 否则自动管理连接（写操作）
    return this.withConnection(async (conn) => {
      return conn.execute<ResultSetHeader>(sql, values)
    }, true)
  }

  // 事务
  async transaction<T>(callback: (conn: PoolConnection) => Promise<T>): Promise<T> {
    return this.withConnection(async (conn) => {
      try {
        await conn.beginTransaction()
        const result = await callback(conn)
        await conn.commit()
        return result
      } catch (err) {
        await conn.rollback()
        throw err
      } finally {
        conn.release()
      }
    })
  }

  /**
   * 单个记录更新
   * @param table 表名
   * @param data 要更新的数据
   * @param where 更新条件
   * @param conn 可选的数据库连接
   * @returns 更新结果
   */
  async update<T extends Record<string, unknown>> (
    table: string,
    data: Partial<T>,
    where?: Partial<T>,
    conn?: PoolConnection
  ): Promise<{ affectedRows: number; insertId?: number }> {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Update data cannot be empty')
    }

    // 构建 SET 子句 - 使用泛型约束的 key
    const setFields = Object.keys(data) as Array<keyof T>
    const setClause = setFields.map(field => `${String(field)} = ?`).join(', ')
    const setValues = setFields.map(field => data[field])

    let sql = `UPDATE ${table} SET ${setClause}`
    const values: unknown[] = [...setValues]

    // 构建 WHERE 子句 - 使用泛型约束的 key
    if (where && Object.keys(where).length > 0) {
      const whereFields = Object.keys(where) as Array<keyof T>
      const whereClause = whereFields.map(field => `${String(field)} = ?`).join(' AND ')
      const whereValues = whereFields.map(field => where[field])

      sql += ` WHERE ${whereClause}`
      values.push(...whereValues)
    }

    const [result] = await this.execute(sql, values, conn)
    return result as { affectedRows: number; insertId?: number }
  }

  protected get redis () {
    return this.fastify.redis
  }
}
