import { FastifyPluginAsync } from 'fastify'
import type { AuthenticatedRequest } from '../../../middlewares/jwt-auth.js'
import { jwtAuthMiddleware } from '../../../middlewares/jwt-auth.js'
import { fail, success } from '../../../utils/http-utils.js'
import { TableService } from '../../../services/table.service.js'
import type { TableLoginRequest } from '../../../types/table.types.js'

const tableRoute: FastifyPluginAsync = async (fastify) => {
  const tableService = new TableService(fastify)

  // POST /api/table/table-login - table登录（不需要JWT鉴权）
  fastify.post('/table-login', async (request, reply) => {
    const data = request.body as TableLoginRequest

    // 验证请求参数
    if (!data.t || !data.p) {
      return reply.send({
        code: 400,
        message: 'Table number (t) or password (p) is missing.',
      })
    }

    // 获取客户端 IP
    const loginIp = request.ip || 'unknown'

    fastify.log.info({ tableNo: data.t, loginIp }, 'Table login request')

    try {
      // 执行登录逻辑
      const result = await tableService.tableLogin(data.t, data.p, loginIp)

      return success(result, 'login successful')
    } catch (err) {
      fastify.log.error({ err, tableNo: data.t }, 'Table login failed')
      return reply.send(fail(400, err instanceof Error ? err.message : 'login failed'))
    }
  })

  // POST /api/table/dealer-login - dealer登录（需要JWT鉴权）
  fastify.post('/dealer-login', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo
    const data = request.body as { dealerNo: string }

    if (!tableNo) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: '未找到桌台信息',
      })
    }

    fastify.log.info({ tableNo, dealerNo: data.dealerNo }, 'Dealer login request')

    try {
      const result = await tableService.dealerLogin(tableNo, data.dealerNo)
      return success(result, 'Dealer登录成功')
    } catch (err) {
      fastify.log.error({ err, tableNo }, 'Dealer login failed')
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : 'Dealer登录失败',
      })
    }
  })

  // POST /api/table/table-maintain - 桌台维护（需要JWT鉴权）
  fastify.post('/table-maintain', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo
    const data = request.body

    if (!tableNo) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: '未找到桌台信息',
      })
    }

    fastify.log.info({ tableNo, data }, 'Table maintain request')

    try {
      const result = await tableService.tableMaintain(tableNo, data)
      return success(result, '维护成功')
    } catch (err) {
      fastify.log.error({ err, tableNo }, 'Table maintain failed')
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : '维护失败',
      })
    }
  })

  // GET /api/table/last-game - 查询最后一局游戏（需要JWT鉴权）
  fastify.get('/last-game', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo

    if (!tableNo) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: '未找到桌台信息',
      })
    }

    fastify.log.info({ tableNo }, 'Last game request')

    try {
      const result = await tableService.lastGame(tableNo)
      return success(result)
    } catch (err) {
      fastify.log.error({ err, tableNo }, 'Last game query failed')
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : '查询失败',
      })
    }
  })

  // GET /api/table/get-round-list - 查询回合列表（需要JWT鉴权）
  fastify.get('/get-round-list', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo

    if (!tableNo) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: '未找到桌台信息',
      })
    }

    fastify.log.info({ tableNo }, 'Get round list request')

    try {
      const result = await tableService.getRoundList(tableNo)
      return success(result)
    } catch (err) {
      fastify.log.error({ err, tableNo }, 'Get round list query failed')
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : '查询失败',
      })
    }
  })

  // POST /api/table/refresh-token - 刷新 token（需要JWT鉴权）
  fastify.post('/refresh-token', {
    preHandler: [jwtAuthMiddleware],
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo

    if (!tableNo) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: '未找到桌台信息',
      })
    }

    // 获取客户端 IP
    const loginIp = request.ip || 'unknown'

    fastify.log.info({ tableNo, loginIp }, 'Refresh token request')

    try {
      const result = await tableService.refreshToken(tableNo, loginIp)
      return success(result, 'Token 刷新成功')
    } catch (err) {
      fastify.log.error({ err, tableNo }, 'Refresh token failed')
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : 'Token 刷新失败',
      })
    }
  })
}

export default tableRoute
