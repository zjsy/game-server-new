import { FastifyPluginAsync } from 'fastify'
import type { AuthenticatedRequest } from '../../../middlewares/jwt-auth.js'
import { jwtAuthMiddleware } from '../../../middlewares/jwt-auth.js'
import { BusinessError, ErrorCode, success } from '../../../utils/http.utils.js'
import { RouletteService } from '../../../services/game/roulette.service.js'
import { ApiType } from '../../../infrastructure/lock.service.js'
import { SettleRequest, CancelRequest, StopBetRequest } from '../../../types/request.types.js'
import { rouletteDetails } from '../../../constants/roulette.constants.js'

const rouletteRoute: FastifyPluginAsync = async (fastify) => {
  const rouletteService = new RouletteService(fastify)
  // POST /api/roulette/start-game - 开局
  fastify.post('/start-game', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId // 从JWT payload获取
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.START_GAME, tableId)
    if (!lockAcquired) {
      throw new BusinessError(ErrorCode.START_ROUND_LOCK)
    }
    try {
      const result = await rouletteService.startGame(tableId)
      return success(result, 'start game successful')
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.START_GAME, tableId)
    }
  })

  // POST /api/roulette/stop - stop bet
  fastify.post('/stop', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const { roundId } = request.body as StopBetRequest
    fastify.log.info({ tableId, roundId }, 'Stop bet request')

    const result = await rouletteService.stopBet(tableId, roundId)

    return success(result, 'stop bet successful')
  })

  // POST /api/roulette/settle - 结算
  fastify.post('/settle', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as SettleRequest<rouletteDetails>

    fastify.log.info({ tableId, data }, 'Settle request')
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.SETTLE_ROUND, tableId)
    if (!lockAcquired) {
      throw new BusinessError(ErrorCode.SETTLE_ROUND_LOCK)
    }
    try {
      const result = await rouletteService.settle(data)
      return success(result, 'settle successful')
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.SETTLE_ROUND, tableId)
    }
  })

  // POST /api/roulette/re-settle - 重新结算
  fastify.post('/re-settle', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as SettleRequest<rouletteDetails>
    fastify.log.info({ tableId, data }, 'ReSettle request')
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.RESETTLE_ROUND, tableId)
    if (!lockAcquired) {
      throw new BusinessError(ErrorCode.RESETTLE_ROUND_LOCK)
    }
    try {
      const result = await rouletteService.reSettle(data)

      return success(result, 'resettle successful')
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.RESETTLE_ROUND, tableId)
    }
  })

  // POST /api/roulette/cancel-round - 取消局
  fastify.post('/cancel-round', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const { roundId } = request.body as CancelRequest
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.CANCEL_ROUND, tableId)

    if (!lockAcquired) {
      throw new BusinessError(ErrorCode.CANCEL_ROUND_LOCK)
    }
    try {
      const result = await rouletteService.cancelRound(roundId)
      return success(result, 'cancel round successful')
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.CANCEL_ROUND, tableId)
    }
  })
}

export default rouletteRoute
