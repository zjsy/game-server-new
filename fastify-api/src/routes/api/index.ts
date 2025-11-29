import { FastifyPluginAsync } from 'fastify'
import type { AuthenticatedRequest } from '../../middlewares/jwt-auth.js'
import { jwtAuthMiddleware } from '../../middlewares/jwt-auth.js'
import { ErrorCode, success, BusinessError } from '../../utils/http.utils.js'
import { TableService } from '../../services/common.service.js'
import type { DealerLoginRequest, GetRoundListRequest, TableLoginRequest, TableMaintainRequest } from '../../types/request.types.js'
import { DealerLoginSchema, TableLoginSchema, TableMaintainSchema } from '../../schemas/common.schema.js'

const commonRoute: FastifyPluginAsync = async (fastify) => {
  const tableService = new TableService(fastify)

  // POST /api/table-login - table登录（不需要JWT鉴权）
  fastify.post('/table-login', {
    schema: TableLoginSchema
  }, async (request, _reply) => {
    const data = request.body as TableLoginRequest

    // 验证请求参数
    if (!data.t || !data.p) {
      throw new BusinessError(ErrorCode.PARAMS_ERROR)
    }

    // 获取客户端 IP
    const loginIp = request.ip || 'unknown'

    fastify.log.info({ tableNo: data.t, loginIp }, 'Table login request')
    // 执行登录逻辑
    const result = await tableService.tableLogin(data.t, data.p, loginIp)

    return success(result)
  })

  // POST /api/dealer-login - dealer登录
  fastify.post('/dealer-login', {
    preHandler: [jwtAuthMiddleware],
    schema: DealerLoginSchema
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as DealerLoginRequest

    if (!data.dealerNo) {
      throw new BusinessError(ErrorCode.PARAMS_ERROR, 'dealer no cannot be empty')
    }

    fastify.log.info({ tableId, dealerNo: data.dealerNo }, 'Dealer login request')

    const result = await tableService.dealerLogin(tableId, data.dealerNo)
    return success(result)
  })

  // POST /api/table-maintain - 桌台维护
  fastify.post('/table-maintain', {
    preHandler: [jwtAuthMiddleware],
    schema: TableMaintainSchema
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as TableMaintainRequest
    const result = await tableService.tableMaintain(tableId, data.status)
    return success(result)
  })

  // GET /api/last-game - broadcast the last game message.
  fastify.get('/last-game', {
    preHandler: [jwtAuthMiddleware],
    schema: {
      tags: ['common'],
      description: 'broadcast the last game message.'
    }
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId

    fastify.log.info({ tableId }, 'Last game request')

    const result = await tableService.lastGame(tableId)
    return success(result)
  })

  // GET /api/get-round-list - query round list
  fastify.get('/get-round-list', {
    preHandler: [jwtAuthMiddleware],
    schema: {
      tags: ['common'],
      description: 'query round list',
      querystring: {
        type: 'object',
        properties: {
          gameType: { type: 'string', description: '游戏类型' },
          shoeNo: { type: 'string', description: '靴号' },
          type: { type: 'string', description: '查询类型,取值：all（所有回合）,completed（已完成回合）' }
        }
      }
    }
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as GetRoundListRequest
    fastify.log.info({ tableId }, 'Get round list request')

    const result = await tableService.getRoundList(tableId, data.gameType, data.shoeNo, data.type)
    return success(result)
  })

  // POST /api/refresh-token - refresh token
  fastify.post('/refresh-token', {
    preHandler: [jwtAuthMiddleware],
    schema: {
      tags: ['common'],
      description: 'refresh Token'
    }
  }, async (request, _reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo

    // 获取客户端 IP
    const loginIp = request.ip || 'unknown'

    fastify.log.info({ tableNo, loginIp }, 'Refresh token request')

    const result = await tableService.refreshToken(tableNo)
    return success(result, 'Token refreshed successfully')
  })
}

export default commonRoute
