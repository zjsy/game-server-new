import fp from 'fastify-plugin'
import { RepositoryManager } from '../repositories/repository-manager.js'

/**
 * Repository 插件
 * 将 RepositoryManager 注册到 Fastify 实例
 *
 * 使用方式:
 * - 在 Service 中通过 fastify.repositories.game 访问 GameRepository
 * - 在 Service 中通过 fastify.repositories.table 访问 TableRepository
 * - 在 Service 中通过 fastify.repositories.user 访问 UserRepository
 *
 * @example
 * class MyService {
 *   constructor(private fastify: FastifyInstance) {
 *     const gameRepo = fastify.repositories.game
 *     const tableRepo = fastify.repositories.table
 *   }
 * }
 */

declare module 'fastify' {
  interface FastifyInstance {
    repositories: RepositoryManager
  }
}

export default fp(async (fastify) => {
  // 创建 RepositoryManager 单例
  const repositories = new RepositoryManager(fastify)

  // 注册到 fastify 实例
  fastify.decorate('repositories', repositories)

  fastify.log.info('Repository plugin registered successfully')
}, {
  name: 'repository',
  dependencies: ['mysql', 'redis'] // 依赖数据库和 Redis 插件
})
