// 用户实体类型
export interface User {
  id: number
  username: string
  email: string
  created_at: Date
  updated_at: Date
}

// 创建用户输入
export interface CreateUserInput {
  username: string
  email: string
  password?: string
}

// 更新用户输入
export interface UpdateUserInput {
  username?: string
  email?: string
  password?: string
}

// 用户列表查询参数
export interface UserListQuery {
  page?: number
  limit?: number
  keyword?: string
}

// 用户列表响应
export interface UserListResponse {
  total: number
  page: number
  limit: number
  data: User[]
}
