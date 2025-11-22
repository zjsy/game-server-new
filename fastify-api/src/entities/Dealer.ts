import { RowDataPacket } from 'mysql2'
export interface Dealer {
  id: number
  dealer_no: string
  nickname: string
  status: number
  avatar: string
  is_login: number
}
export interface DealerRow extends RowDataPacket, Dealer { }
