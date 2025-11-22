import { RowDataPacket } from 'mysql2'

export interface UserBetStats {
  user_id: number
  continuous_win: number
  today_bet_count: number
  today_bet_money: number
  today_rolling: number
  today_winlose: number
  total_bet_count: number
  total_bet_money: number
  total_rolling: number
  total_winlose: number
}

export interface UserBetStatsRow extends RowDataPacket, UserBetStats { }
