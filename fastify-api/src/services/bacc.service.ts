import { FastifyInstance } from 'fastify'
import { User, CreateUserInput, UpdateUserInput, UserListQuery, UserListResponse } from '../types/user.types.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

// 数据库返回的用户行类型
interface UserRow extends RowDataPacket {
  id: number
  username: string
  email: string
  created_at: Date
  updated_at: Date
}

export class BaccService {
  constructor (private fastify: FastifyInstance) {}

  // 根据 ID 查找用户
  async startGame (id: number): Promise<User | null> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {
      const [rows] = await connection.query<UserRow[]>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      )
      return rows[0] || null
    } finally {
      connection.release()
    }
  }

  // 根据用户名查找用户
  async stopBet (username: string): Promise<User | null> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {
      const [rows] = await connection.query<UserRow[]>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      )
      return rows[0] || null
    } finally {
      connection.release()
    }
  }

  // 开牌
  async dealing (input: CreateUserInput): Promise<User> {
    const connection = await this.fastify.mysql.write.getConnection()
    try {
      const now = new Date()
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO users (username, email, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [input.username, input.email, now, now]
      )

      const userId = result.insertId
      const user = await this.findById(userId)

      if (!user) {
        throw new Error('Failed to create user')
      }

      this.fastify.log.info({ userId }, 'User created')
      return user
    } finally {
      connection.release()
    }
  }

  // 更新用户
  async settle (id: number, input: UpdateUserInput): Promise<User | null> {
    const connection = await this.fastify.mysql.write.getConnection()
    try {
      const updates: string[] = []
      const values: (string | Date | number)[] = []

      if (input.username) {
        updates.push('username = ?')
        values.push(input.username)
      }

      if (input.email) {
        updates.push('email = ?')
        values.push(input.email)
      }

      if (updates.length === 0) {
        return this.findById(id)
      }

      updates.push('updated_at = ?')
      values.push(new Date())
      values.push(id)

      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      )

      if (result.affectedRows === 0) {
        return null
      }

      this.fastify.log.info({ userId: id }, 'User updated')
      return this.findById(id)
    } finally {
      connection.release()
    }
  }

  // 删除用户
  async reSettle (id: number): Promise<boolean> {
    const connection = await this.fastify.mysql.write.getConnection()
    try {
      const [result] = await connection.query<ResultSetHeader>(
        'DELETE FROM users WHERE id = ?',
        [id]
      )

      const deleted = result.affectedRows > 0
      if (deleted) {
        this.fastify.log.info({ userId: id }, 'User deleted')
      }

      return deleted
    } finally {
      connection.release()
    }
  }

  // 获取用户列表
  async cancelGame (query: UserListQuery = {}): Promise<UserListResponse> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {
      const page = query.page || 1
      const limit = query.limit || 10
      const offset = (page - 1) * limit

      let sql = 'SELECT * FROM users'
      const params: (string | number)[] = []

      if (query.keyword) {
        sql += ' WHERE username LIKE ? OR email LIKE ?'
        const keyword = `%${query.keyword}%`
        params.push(keyword, keyword)
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const [rows] = await connection.query<UserRow[]>(sql, params)

      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM users'
      if (query.keyword) {
        countSql += ' WHERE username LIKE ? OR email LIKE ?'
      }

      const [countRows] = await connection.query<RowDataPacket[]>(
        countSql,
        query.keyword ? [`%${query.keyword}%`, `%${query.keyword}%`] : []
      )

      const total = countRows[0].total

      return {
        total,
        page,
        limit,
        data: rows
      }
    } finally {
      connection.release()
    }
  }

  async shuffle (query: UserListQuery = {}): Promise<UserListResponse> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {
      const page = query.page || 1
      const limit = query.limit || 10
      const offset = (page - 1) * limit

      let sql = 'SELECT * FROM users'
      const params: (string | number)[] = []

      if (query.keyword) {
        sql += ' WHERE username LIKE ? OR email LIKE ?'
        const keyword = `%${query.keyword}%`
        params.push(keyword, keyword)
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const [rows] = await connection.query<UserRow[]>(sql, params)

      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM users'
      if (query.keyword) {
        countSql += ' WHERE username LIKE ? OR email LIKE ?'
      }

      const [countRows] = await connection.query<RowDataPacket[]>(
        countSql,
        query.keyword ? [`%${query.keyword}%`, `%${query.keyword}%`] : []
      )

      const total = countRows[0].total

      return {
        total,
        page,
        limit,
        data: rows
      }
    } finally {
      connection.release()
    }
  }

  async stopShuffle (query: UserListQuery = {}): Promise<UserListResponse> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {
      const page = query.page || 1
      const limit = query.limit || 10
      const offset = (page - 1) * limit

      let sql = 'SELECT * FROM users'
      const params: (string | number)[] = []

      if (query.keyword) {
        sql += ' WHERE username LIKE ? OR email LIKE ?'
        const keyword = `%${query.keyword}%`
        params.push(keyword, keyword)
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const [rows] = await connection.query<UserRow[]>(sql, params)

      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM users'
      if (query.keyword) {
        countSql += ' WHERE username LIKE ? OR email LIKE ?'
      }

      const [countRows] = await connection.query<RowDataPacket[]>(
        countSql,
        query.keyword ? [`%${query.keyword}%`, `%${query.keyword}%`] : []
      )

      const total = countRows[0].total

      return {
        total,
        page,
        limit,
        data: rows
      }
    } finally {
      connection.release()
    }
  }
}
