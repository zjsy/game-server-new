import { RowDataPacket } from 'mysql2'
export interface Transactions {
  id: number
  transaction_no: string
  user_id: number
  agent_id: number
  username: string
  operate_time: Date
  type: number
  change: number
  after_balance: number
  remark: string
}

export interface TransactionsRow extends RowDataPacket, Transactions { }
