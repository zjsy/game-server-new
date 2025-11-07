import { FastifyInstance } from 'fastify'
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserListQuery,
  UserListResponse,
} from '../types/table.types.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

// 数据库返回的用户行类型
interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export class BaccService {
  constructor (private fastify: FastifyInstance) {}

  // 开局
  async startGame (): Promise<User | null> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {
      return null
    } finally {
      connection.release()
    }
  }

  // 根据用户名查找用户
  async stopBet (username: string): Promise<User | null> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {
      return null
    } finally {
      connection.release()
    }
  }

  // 开牌
  async dealing (input: CreateUserInput): Promise<null> {
    const connection = await this.fastify.mysql.write.getConnection()
    try {
      return null
    } finally {
      connection.release()
    }
  }

  // 更新用户
  async settle (id: number, input: UpdateUserInput): Promise< null> {
    const connection = await this.fastify.mysql.write.getConnection()
    try {
    } finally {
      connection.release()
    }
  }

  // 删除用户
  async reSettle (id: number): Promise<boolean> {
    const connection = await this.fastify.mysql.write.getConnection()
    try {
      return null
    } finally {
      connection.release()
    }
  }

  // 取消局
  async cancelRound (query: UserListQuery = {}): Promise<UserListResponse> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {

    } finally {
      connection.release()
    }
  }

  async shuffle (query: UserListQuery = {}): Promise<UserListResponse> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {

    } finally {
      connection.release()
    }
  }

  async stopShuffle (query: UserListQuery = {}): Promise<UserListResponse> {
    const connection = await this.fastify.mysql.read.getConnection()
    try {

    } finally {
      connection.release()
    }
  }
}
