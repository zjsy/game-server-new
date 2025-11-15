import { FastifyPluginAsync } from 'fastify'
import type { AuthenticatedRequest } from '../../../middlewares/jwt-auth.js'
import { jwtAuthMiddleware } from '../../../middlewares/jwt-auth.js'
import { ErrorCode, success, BusinessError } from '../../../utils/http.utils.js'
import { TableService } from '../../../services/table.service.js'
import type { DealerLoginRequest, GetRoundListRequest, TableLoginRequest, TableMaintainRequest } from '../../../types/table.types.js'

const tableRoute: FastifyPluginAsync = async (fastify) => {
  const tableService = new TableService(fastify)

  // POST /api/table/table-login - table登录（不需要JWT鉴权）
  fastify.post('/table-login', {
    schema: {
      tags: ['tables'],  // 指定这个接口属于 tables 分类
      description: '桌台登录',
      body: {
        type: 'object',
        properties: {
          t: { type: 'string', description: '桌台编号' },
          p: { type: 'string', description: '密码' }
        }
      }
    }
  }, async (request, reply) => {
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

    return reply.send(success(result))
  })

  // POST /api/table/dealer-login - dealer登录（需要JWT鉴权）
  fastify.post('/dealer-login', {
    preHandler: [jwtAuthMiddleware],
    schema: {
      tags: ['tables'],  // 指定这个接口属于 tables 分类
      description: 'Dealer 登录',
      body: {
        type: 'object',
        properties: {
          dealerNo: { type: 'string', description: 'Dealer 编号' }
        }
      }
    }
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as DealerLoginRequest

    if (!data.dealerNo) {
      throw new BusinessError(ErrorCode.USER_NOT_EXIST, 'Dealer error or not exist')
    }

    fastify.log.info({ tableId, dealerNo: data.dealerNo }, 'Dealer login request')

    const result = await tableService.dealerLogin(tableId, data.dealerNo)
    return reply.send(success(result))
  })

  // POST /api/table/table-maintain - 桌台维护（需要JWT鉴权）
  fastify.post('/table-maintain', {
    preHandler: [jwtAuthMiddleware],
    schema: {
      tags: ['tables'],  // 指定这个接口属于 tables 分类
      description: '桌台维护',
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '维护状态，取值：start（开始维护），end（结束维护）' }
        }
      }
    }
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as TableMaintainRequest
    const result = await tableService.tableMaintain(tableId, data.status)
    return reply.send(success(result))
  })

  // GET /api/table/last-game - 查询最后一局游戏（需要JWT鉴权）
  fastify.get('/last-game', {
    preHandler: [jwtAuthMiddleware],
    schema: {
      tags: ['tables'],  // 指定这个接口属于 tables 分类
      description: '查询最后一局游戏'
    }
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId

    fastify.log.info({ tableId }, 'Last game request')

    const result = await tableService.lastGame(tableId)
    return reply.send(success(result))
  })

  // GET /api/table/get-round-list - 查询回合列表（需要JWT鉴权）
  fastify.get('/get-round-list', {
    preHandler: [jwtAuthMiddleware],
    schema: {
      tags: ['tables'],  // 指定这个接口属于 tables 分类
      description: '查询回合列表',
      querystring: {
        type: 'object',
        properties: {
          gameType: { type: 'string', description: '游戏类型' },
          shoeNo: { type: 'string', description: '靴号' },
          type: { type: 'string', description: '查询类型，取值：all（所有回合），completed（已完成回合）' }
        }
      }
    }
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableId = authRequest.tableId
    const data = request.body as GetRoundListRequest
    fastify.log.info({ tableId }, 'Get round list request')

    const result = await tableService.getRoundList(tableId, data.gameType, data.shoeNo, data.type)
    return reply.send(success(result))
  })

  // POST /api/table/refresh-token - 刷新 token（需要JWT鉴权）
  fastify.post('/refresh-token', {
    preHandler: [jwtAuthMiddleware],
    schema: {
      tags: ['tables'],  // 指定这个接口属于 tables 分类
      description: '刷新 Token'
    }
  }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest
    const tableNo = authRequest.tableNo

    // 获取客户端 IP
    const loginIp = request.ip || 'unknown'

    fastify.log.info({ tableNo, loginIp }, 'Refresh token request')

    const result = await tableService.refreshToken(tableNo, loginIp)
    return reply.send(success(result, 'Token 刷新成功'))
  })
}

export default tableRoute
