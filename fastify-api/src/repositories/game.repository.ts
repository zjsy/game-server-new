import { BaseRepository } from './base.repository.js'
import { FastifyInstance } from 'fastify'

export class GameRepository extends BaseRepository {
  constructor (protected fastify: FastifyInstance) {
    super(fastify)
  }
}
