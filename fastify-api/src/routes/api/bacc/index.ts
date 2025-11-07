import { FastifyPluginAsync } from 'fastify'
import type { AuthenticatedRequest } from '../../../middlewares/jwt-auth.js'
import { jwtAuthMiddleware } from '../../../middlewares/jwt-auth.js'
import { success } from '../../../utils/http-utils.js'
import { BaccService } from '../../../services/bacc.service.js'

const baccRoute: FastifyPluginAsync = async (fastify) => {
  const baccService = new BaccService(fastify)
  // POST /api/bacc/start-game - 开局（需要JWT鉴权）
  fastify.post('/start-game', {
    preHandler: [jwtAuthMiddleware],
  }, async (request) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo // 从JWT payload获取
    const data = request.body as { countdown?: number }

    fastify.log.info({ tableNo, data }, 'Start game request')

    // 执行业务逻辑
    const result = await baccService.startGame(tableNo, data)

    return success(result, '开局成功')
  })

  // POST /api/bacc/dealing - 发牌（需要JWT鉴权）
  fastify.post('/dealing', {
    preHandler: [jwtAuthMiddleware],
  }, async (request) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo
    const data = request.body as { cards?: string[] }

    fastify.log.info({ tableNo, data }, 'Dealing request')

    // 执行业务逻辑
    const result = await baccService.dealing(tableNo, data)

    return {
      code: true,
      msg: '发牌成功',
      data,
    }
  })

  // POST /api/bacc/settle - 结算（需要JWT鉴权）
  fastify.post('/settle', {
    preHandler: [jwtAuthMiddleware],
  }, async (request) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo
    const data = request.body as { roundId?: number, result?: string }

    fastify.log.info({ tableNo, data }, 'Settle request')

    // 执行业务逻辑
    const result = await baccService.settle(tableNo, data)

    return {
      success: true,
      message: '结算成功',
      tableNo,
      data,
    }
  })

  // POST /api/bacc/re-settle - 重新结算
  fastify.post('/re-settle', async (request, reply) => {
    const { tableNo } = request.body as { tableNo: string }

    if (!tableNo) {
      return reply.code(400).send({ error: 'tableNo is required' })
    }

    // 查询桌台信息
    const tableInfo = await baccService.reSettle(tableNo)

    return {
      tableNo,
      status: 'online',
      currentRound: 123,
    }
  })

  // POST /api/bacc/cancel-round - 取消局
  fastify.post('/cancel-round', async (request, reply) => {
    const { tableNo } = request.body as { tableNo: string }

    if (!tableNo) {
      return reply.code(400).send({ error: 'tableNo is required' })
    }

    // 查询桌台信息
    const tableInfo = await baccService.cancelRound(tableNo)

    return {
      tableNo,
      status: 'online',
      currentRound: 123,
    }
  })

  // POST /api/bacc/shuffle - 洗牌
  fastify.post('/shuffle', async (request, reply) => {
    const { tableNo } = request.body as { tableNo: string }

    if (!tableNo) {
      return reply.code(400).send({ error: 'tableNo is required' })
    }

    // 查询桌台信息
    const tableInfo = await baccService.shuffle(tableNo)

    return {
      tableNo,
      status: 'online',
      currentRound: 123,
    }
  })

  // GET /api/bacc/stop-shuffle - 停止洗牌
  fastify.get('/stop-shuffle', async (request, reply) => {
    const { tableNo } = request.query as { tableNo: string }

    if (!tableNo) {
      return reply.code(400).send({ error: 'tableNo is required' })
    }

    // 查询桌台信息
    const tableInfo = await baccService.stopShuffle(tableNo)

    return {
      tableNo,
      status: 'online',
      currentRound: 123,
    }
  })
}

export default baccRoute
