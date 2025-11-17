import { FastifyPluginAsync } from 'fastify'
import type { AuthenticatedRequest } from '../../../middlewares/jwt-auth.js'
import { jwtAuthMiddleware } from '../../../middlewares/jwt-auth.js'
import { success } from '../../../utils/http.utils.js'
import { BaccService } from '../../../services/bacc.service.js'
import { ApiType } from '../../../services/lock.service.js'
import { BaccDetails, CancelRequest, DealingRequest, SettleRequest } from '../../../types/common.types.js'

const baccRoute: FastifyPluginAsync = async (fastify) => {
  const baccService = new BaccService(fastify)
  // POST /api/bacc/start-game - 开局（需要JWT鉴权）
  fastify.post('/start-game', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId // 从JWT payload获取
    fastify.log.info({ tableId }, 'Start game request')
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.START_GAME, tableId) // 尝试获取锁，TTL为5000毫秒
    if (!lockAcquired) {
      return { code: false, msg: '资源被锁定，请稍后再试' }
    }
    try {
    // 执行业务逻辑
      const result = await baccService.startGame(tableId)
      return reply.send(success(result, '开局成功'))
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.START_GAME, tableId) // 确保释放锁
    }
  })

  // POST /api/bacc/dealing - 发牌（需要JWT鉴权）
  fastify.post('/dealing', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as DealingRequest
    fastify.log.info({ tableId, data }, 'Dealing request')
    // 执行业务逻辑
    const result = await baccService.dealing(tableId, data.index, data.details)

    return reply.send(success(result, '发牌成功'))
  })

  // POST /api/bacc/settle - 结算（需要JWT鉴权）
  fastify.post('/settle', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as SettleRequest<BaccDetails>

    fastify.log.info({ tableId, data }, 'Settle request')
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.SETTLE_ROUND, tableId) // 尝试获取锁，TTL为5000毫秒
    if (!lockAcquired) {
      return { code: false, msg: '资源被锁定，请稍后再试' }
    }
    try {
    // 执行业务逻辑
      const result = await baccService.settle(data)
      return reply.send(success(result, '结算成功'))
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.SETTLE_ROUND, tableId) // 确保释放锁
    }
  })

  // POST /api/bacc/re-settle - 重新结算
  fastify.post('/re-settle', async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as SettleRequest<BaccDetails>
    fastify.log.info({ tableId, data }, 'ReSettle request')
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.RESETTLE_ROUND, tableId) // 尝试获取锁，TTL为5000毫秒
    if (!lockAcquired) {
      return { code: false, msg: '资源被锁定，请稍后再试' }
    }
    try {
    // 查询桌台信息
      const result = await baccService.reSettle(data)

      return reply.send(success(result, '结算成功'))
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.RESETTLE_ROUND, tableId) // 确保释放锁
    }
  })

  // POST /api/bacc/cancel-round - 取消局
  fastify.post('/cancel-round', async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const { roundId } = request.body as CancelRequest
    const lockAcquired = await fastify.lockManager.setApiLock(ApiType.CANCEL_ROUND, tableId) // 尝试获取锁，TTL为5000毫秒

    if (!lockAcquired) {
      return { code: false, msg: '资源被锁定，请稍后再试' }
    }
    try {
    // 查询桌台信息
      const result = await baccService.cancelRound(roundId)
      return reply.send(success(result, '取消成功'))
    } finally {
      await fastify.lockManager.releaseApiLock(ApiType.CANCEL_ROUND, tableId) // 确保释放锁
    }
  })

  // POST /api/bacc/shuffle - 洗牌
  fastify.post('/shuffle', async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId

    // 查询桌台信息
    const result = await baccService.shuffle(tableId)

    return reply.send(success({
      shoeNo: result,
    }, '洗牌成功'))
  })

  // GET /api/bacc/stop-shuffle - 停止洗牌
  // fastify.get('/stop-shuffle', async (request, reply) => {
  //   const authRequest = request as AuthenticatedRequest
  //   const tableId = authRequest.tableId

  //   // 查询桌台信息
  //   const result = await baccService.stopShuffle(tableId)

  //   return reply.send(success(result, '洗牌成功'))
  // })
}

export default baccRoute
