import { FastifyInstance } from 'fastify'
import { PoolConnection } from 'mysql2/promise'

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

  protected async query<T>(sql: string, values?: any[], useWrite = false): Promise<T> {
    return this.withConnection(async (conn) => {
      const [rows] = await conn.query(sql, values)
      return rows as T
    }, useWrite)
  }

  protected get redis () {
    return this.fastify.redis
  }
}
