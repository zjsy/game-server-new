import { FastifyInstance } from 'fastify'
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

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
   * 插入记录
   * @param table 表名
   * @param data 要插入的数据
   * @param conn 可选的数据库连接
   * @returns 插入后的记录（包含自增ID）或null
   */
  async insert<T>(
    table: string,
    data: Partial<T>,
    conn?: PoolConnection
  ): Promise<number | null> {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Insert data cannot be empty')
    }

    // 构建字段和值
    const fields = Object.keys(data)
    const placeholders = fields.map(() => '?').join(', ')
    const values = fields.map(field => data[field as keyof T])

    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`

    // 执行插入
    const [result] = await this.execute(sql, values, conn)

    // 如果有自增ID，查询并返回完整记录
    if (result.insertId) {
      return result.insertId
    }

    // 如果没有自增ID，返回null或者尝试根据插入的数据查询
    return null
  }

  /**
   * 删除记录
   * @param table 表名
   * @param where 删除条件(必须提供, 避免误删全部)
   * @param conn 可选的数据库连接
   * @returns 删除的行数(affectedRows)，若未删除返回0
   */
  async delete<T>(
    table: string,
    where?: Partial<T>,
    conn?: PoolConnection
  ): Promise<number | null> {
    if (!where || Object.keys(where).length === 0) {
      throw new Error('Delete where condition cannot be empty')
    }

    const { whereClause, whereValues } = this.buildWhereClause(where as Partial<Record<string, unknown>>)
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`

    const [result] = await this.execute(sql, whereValues, conn)
    return (result.affectedRows ?? 0)
  }

  /**
   * 单个记录获取
   * @param table 表名
   * @param where 查询条件
   * @param fields 要查询的字段
   * @param conn 可选的数据库连接
   * @returns 单个记录或null
   */
  async find<T extends RowDataPacket, E = T>(
    table: string,
    where?: Partial<Pick<E, keyof E>>,
    fields?: (keyof E)[],
    conn?: PoolConnection
  ): Promise<T | null> {
    const selectFields = fields && fields.length > 0 ? fields.map(f => String(f)).join(', ') : '*'
    let sql = `SELECT ${selectFields} FROM ${table}`
    const values: unknown[] = []

    // 构建 WHERE 子句
    if (where && Object.keys(where).length > 0) {
      const { whereClause, whereValues } = this.buildWhereClause(where)
      sql += ` WHERE ${whereClause}`
      values.push(...whereValues)
    }

    sql += ' LIMIT 1'

    const rows = await this.query<T[]>(sql, values, { useWrite: false, conn })
    return rows.length > 0 ? rows[0] : null
  }

  /**
   * 多个记录获取
   * @param table 表名
   * @param where 查询条件
   * @param fields 要查询的字段
   * @param options 查询选项（分页、排序等）
   * @param conn 可选的数据库连接
   * @returns 记录数组
   */
  async get<T extends RowDataPacket, E = T>(
    table: string,
    where?: Partial<Pick<E, keyof E>>,
    fields?: (keyof E)[],
    options?: {
      orderBy?: string
      orderDirection?: 'ASC' | 'DESC'
      limit?: number
      offset?: number
    },
    conn?: PoolConnection
  ): Promise<T[]> {
    const selectFields = fields && fields.length > 0 ? fields.map(f => String(f)).join(', ') : '*'
    let sql = `SELECT ${selectFields} FROM ${table}`
    const values: unknown[] = []

    // 构建 WHERE 子句
    if (where && Object.keys(where).length > 0) {
      const { whereClause, whereValues } = this.buildWhereClause(where)
      sql += ` WHERE ${whereClause}`
      values.push(...whereValues)
    }

    // 排序
    if (options?.orderBy) {
      const direction = options.orderDirection || 'ASC'
      sql += ` ORDER BY ${options.orderBy} ${direction}`
    }

    // 分页
    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`
      if (options.offset) {
        sql += ` OFFSET ${options.offset}`
      }
    }

    return await this.query<T[]>(sql, values, { useWrite: false, conn })
  }

  /**
   * 单个记录更新
   * @param table 表名
   * @param data 要更新的数据
   * @param where 更新条件
   * @param conn 可选的数据库连接
   * @returns 更新结果
   */
  async update<E = Record<string, unknown>>(
    table: string,
    data: Partial<E>,
    where?: Partial<E>,
    conn?: PoolConnection
  ): Promise<{ affectedRows: number; insertId?: number }> {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Update data cannot be empty')
    }

    // 构建 SET 子句
    const setFields = Object.keys(data) as Array<keyof E>
    const setClause = setFields.map(field => `${String(field)} = ?`).join(', ')
    const setValues = setFields.map(field => data[field])

    let sql = `UPDATE ${table} SET ${setClause}`
    const values: unknown[] = [...setValues]

    // 构建 WHERE 子句
    if (where && Object.keys(where).length > 0) {
      const { whereClause, whereValues } = this.buildWhereClause(where)
      sql += ` WHERE ${whereClause}`
      values.push(...whereValues)
    }

    const [result] = await this.execute(sql, values, conn)
    return result as { affectedRows: number; insertId?: number }
  }

  private buildWhereClause<T extends Record<string, unknown>>(
    where: Partial<T>
  ): { whereClause: string; whereValues: unknown[] } {
    // if (!where || Object.keys(where).length === 0) {
    //   return { clause: '', values: [] }
    // }
    const whereFields = Object.keys(where) as Array<keyof T>
    const whereClause = whereFields.map(field => `${String(field)} = ?`).join(' AND ')
    const whereValues = whereFields.map(field => where[field])
    return { whereClause, whereValues }
  }

  protected get redis () {
    return this.fastify.redis
  }

  /**
 * 批量删除匹配前缀的 key
 * @param pattern 匹配模式,如 'front:stats:r_123:u_*'
 */
  async batchDeleteByPrefix (pattern: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100 // 每次扫描的数量
      })

      let deletedCount = 0
      const pipeline = this.redis.pipeline()

      stream.on('data', (keys: string[]) => {
        if (keys.length) {
          keys.forEach(key => pipeline.del(key))
          deletedCount += keys.length
        }
      })

      stream.on('end', async () => {
        if (deletedCount > 0) {
          await pipeline.exec()
        }
        resolve(deletedCount)
      })

      stream.on('error', (err) => {
        reject(err)
      })
    })
  }
}
