import { FastifyPluginAsync } from 'fastify'
import { TableService } from '../../../services/table.service.js'
import { BaccService } from '../../../services/bacc.service.js'
import {
  createUserSchema,
  getUserSchema,
  listUsersSchema,
  updateUserSchema,
  deleteUserSchema
} from '../../../schemas/table.schema.js'
import type { CreateUserInput, UpdateUserInput, UserListQuery } from '../../../types/user.types.js'

const usersRoute: FastifyPluginAsync = async (fastify) => {
  const tableService = new TableService(fastify)

  // GET /api/login-table - 登录桌台
  fastify.get<{ Querystring: UserListQuery }>('/', {
    schema: listUsersSchema
  }, async (request) => {
    const result = await tableService.list(request.query)
    return result
  })

  // POST /api/users - 创建新用户
  fastify.post<{ Body: CreateUserInput }>('/', {
    schema: createUserSchema
  }, async (request, reply) => {
    // 检查用户名是否已存在
    const existingUser = await userService.findByUsername(request.body.username)
    if (existingUser) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: '用户名已存在'
      })
    }

    const user = await userService.create(request.body)
    return reply.code(201).send(user)
  })
}

export default usersRoute
