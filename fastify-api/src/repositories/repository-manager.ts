import type { FastifyInstance } from 'fastify'
import { TableRepository } from './table.repository.js'
import { GameRepository } from './game.repository.js'
import { UserRepository } from './user.repository.js'

/**
 * Repository 管理器
 * 统一管理所有 Repository 实例,提供单一访问入口
 * 所有 Service 通过 fastify.repositories 访问各个 Repository
 */
export class RepositoryManager {
  public readonly table: TableRepository
  public readonly game: GameRepository
  public readonly user: UserRepository

  constructor (fastify: FastifyInstance) {
    // 初始化所有 Repository 实例
    this.table = new TableRepository(fastify)
    this.game = new GameRepository(fastify)
    this.user = new UserRepository(fastify)

    fastify.log.info('RepositoryManager initialized successfully')
  }
}
