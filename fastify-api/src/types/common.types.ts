// 通用 HTTP 响应类型定义
// 统一结构: { code: number; msg: string; data?: T }

export type ApiResponse<T = unknown> = {
  code: number
  msg: string
  data?: T
}
