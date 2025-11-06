// 用户对象 Schema
export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', description: '用户ID' },
    username: { type: 'string', description: '用户名' },
    email: { type: 'string', format: 'email', description: '邮箱' },
    created_at: { type: 'string', format: 'date-time', description: '创建时间' },
    updated_at: { type: 'string', format: 'date-time', description: '更新时间' }
  }
}

// 创建用户 Schema
export const createUserSchema = {
  description: '创建新用户',
  tags: ['users'],
  body: {
    type: 'object',
    required: ['username', 'email'],
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 20,
        description: '用户名，3-20个字符'
      },
      email: {
        type: 'string',
        format: 'email',
        description: '用户邮箱'
      },
      password: {
        type: 'string',
        minLength: 6,
        description: '密码，至少6个字符（可选）'
      }
    }
  },
  response: {
    201: {
      description: '创建成功',
      type: 'object',
      properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        email: { type: 'string' },
        created_at: { type: 'string' }
      }
    },
    400: {
      description: '请求参数错误',
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
}

// 获取用户详情 Schema
export const getUserSchema = {
  description: '获取用户详情',
  tags: ['users'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: '用户ID'
      }
    }
  },
  response: {
    200: {
      description: '成功返回用户信息',
      ...userSchema
    },
    404: {
      description: '用户不存在',
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
}

// 获取用户列表 Schema
export const listUsersSchema = {
  description: '获取用户列表',
  tags: ['users'],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 1, minimum: 1, description: '页码' },
      limit: { type: 'number', default: 10, minimum: 1, maximum: 100, description: '每页数量' },
      keyword: { type: 'string', description: '搜索关键词' }
    }
  },
  response: {
    200: {
      description: '用户列表',
      type: 'object',
      properties: {
        total: { type: 'number', description: '总数' },
        page: { type: 'number', description: '当前页' },
        limit: { type: 'number', description: '每页数量' },
        data: {
          type: 'array',
          items: userSchema
        }
      }
    }
  }
}

// 更新用户 Schema
export const updateUserSchema = {
  description: '更新用户信息',
  tags: ['users'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: '用户ID'
      }
    }
  },
  body: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 20,
        description: '用户名'
      },
      email: {
        type: 'string',
        format: 'email',
        description: '邮箱'
      }
    }
  },
  response: {
    200: {
      description: '更新成功',
      ...userSchema
    },
    404: {
      description: '用户不存在',
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
}

// 删除用户 Schema
export const deleteUserSchema = {
  description: '删除用户',
  tags: ['users'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: '用户ID'
      }
    }
  },
  response: {
    200: {
      description: '删除成功',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    404: {
      description: '用户不存在',
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
}
