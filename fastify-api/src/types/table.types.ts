import { Round } from '../entities/RoundInfo.js'

export interface TableLoginRequest {
  t: string // table_no
  p: string // password
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
  token: string
  refreshToken: string // 新增 refresh token
  roundStopTime: number
  roundCountdown: number
}

export interface DealerLoginRequest {
  dealerNo: string
}

export interface DealerLoginResponse {
  nickname: string
  avatar: string
}

export interface TableMaintainRequest {
  status: number
}

export interface GetRoundListRequest {
  gameType: number
  shoeNo: number
  type?: number
}

export interface GetRoundListResponse {
  rounds: Round[]
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
  expiresIn: string
}
