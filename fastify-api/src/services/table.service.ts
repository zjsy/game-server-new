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

export class TableService {
  constructor (private fastify: FastifyInstance) {}

  // table登录
  async tableLogin (id: number): Promise<User | null> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {

    } finally {
      connection.release()
    }
  }

  // dealer登录
  async dealerLogin (id: number): Promise<User | null> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {

    } finally {
      connection.release()
    }
  }

  // 根据用户名查找用户
  async tableMaintain (username: string): Promise<User | null> {
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

  // 创建用户
  async tableClose (input: CreateUserInput): Promise<User> {
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
  async lastGame (id: number, input: UpdateUserInput): Promise<User | null> {
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

  async getRoundList (id: number, input: UpdateUserInput): Promise<User | null> {
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
}
