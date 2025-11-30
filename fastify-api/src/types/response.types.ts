// 通用 HTTP 响应类型定义
// 统一结构: { code: number; msg: string; data?: T }

import { Round } from '../entities/RoundInfo.js'

export type ApiResponse<T = unknown> = {
  code: number
  msg: string
  data?: T
}

export interface TableLoginResponse {
  id: number
  table_no: string
  table_name: string
  type: number
  current_shoe: number
  current_round_no: number
  current_round_id: number
  game_type: number
  countdown: number
  shuffle: number
  maintain: number
  playStatus: number
  video: string
  roundStopTime: number
  roundCountdown: number
  token: string
  refreshToken: string // 新增 refresh token
  expiresIn: number // token 有效期，单位秒
}

export interface DealerLoginResponse {
  nickname: string
  avatar: string
}

export type StartResponse = {
  id: number;
  tableId: number
  shoeNo: number
  roundNo: number
  roundSn: string
  startTime: Date
}

export interface GetRoundListResponse {
  rounds: Round[]
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
  expiresIn: number
}

export type SettleResponse = {
  settledAt: Date;
  goodRoad?: number;
}
