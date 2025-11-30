import { FastifyPluginAsync } from 'fastify'
import type { AuthenticatedRequest } from '../../../middlewares/jwt-auth.js'
import { jwtAuthMiddleware } from '../../../middlewares/jwt-auth.js'
import { BusinessError, ErrorCode, success } from '../../../utils/http.utils.js'
import { BaccService } from '../../../services/game/bacc.service.js'
import { ApiType } from '../../../infrastructure/lock.service.js'
import { DealingRequest, SettleRequest, CancelRequest, StopBetRequest } from '../../../types/request.types.js'
import { BaccDetails } from '../../../constants/bacc.constants.js'

const baccRoute: FastifyPluginAsync = async (fastify) => {
  const baccService = new BaccService(fastify)
  // POST /api/bacc/start-game - 开局
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
      const result = await baccService.startGame(tableId)
      return success(result, 'start game successful')
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.START_GAME, tableId)
    }
  })

  // POST /api/bacc/stop - stop bet
  fastify.post('/stop', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const { roundId } = request.body as StopBetRequest
    fastify.log.info({ tableId, roundId }, 'Stop bet request')

    const result = await baccService.stopBet(tableId, roundId)

    return success(result, 'stop bet successful')
  })

  // POST /api/bacc/dealing - 发牌
  fastify.post('/dealing', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as DealingRequest
    fastify.log.info({ tableId, data }, 'Dealing request')

    const result = await baccService.dealing(tableId, data.index, data.details)

    return success(result, 'dealing successful')
  })

  // POST /api/bacc/settle - 结算
  fastify.post('/settle', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as SettleRequest<BaccDetails>

    fastify.log.info({ tableId, data }, 'Settle request')
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.SETTLE_ROUND, tableId)
    if (!lockAcquired) {
      throw new BusinessError(ErrorCode.SETTLE_ROUND_LOCK)
    }
    try {
      const result = await baccService.settle(data)
      return success(result, 'settle successful')
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.SETTLE_ROUND, tableId)
    }
  })

  // POST /api/bacc/re-settle - 重新结算
  fastify.post('/re-settle', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as SettleRequest<BaccDetails>
    fastify.log.info({ tableId, data }, 'ReSettle request')
    // 尝试获取锁,TTL为3000毫秒
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.RESETTLE_ROUND, tableId)
    if (!lockAcquired) {
      throw new BusinessError(ErrorCode.RESETTLE_ROUND_LOCK)
    }
    try {
      const result = await baccService.reSettle(data)

      return success(result, 're-settle successful')
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.RESETTLE_ROUND, tableId) // 确保释放锁
    }
  })

  // POST /api/bacc/cancel-round - 取消局
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
      const result = await baccService.cancelRound(roundId)
      return success(result, 'cancel round successful')
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.CANCEL_ROUND, tableId)
    }
  })

  // POST /api/bacc/shuffle - 洗牌
  fastify.post('/shuffle', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId

    const result = await baccService.shuffle(tableId)

    return success({ shoeNo: result }, 'shuffle successful')
  })

  // POST /api/bacc/stop-shuffle - 停止洗牌
  // fastify.post('/stop-shuffle', async (request, reply) => {
  //   const authRequest = request as AuthenticatedRequest
  //   const tableId = authRequest.tableId

  //   const result = await baccService.stopShuffle(tableId)

  //   return success(result, 'stop shuffle successful')
  // })
}

export default baccRoute
