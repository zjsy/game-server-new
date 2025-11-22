import { RowDataPacket } from 'mysql2'

export interface UserWallet {
  user_id: number;
  agent_id: number;
  currency: string;
  balance: number;
}

export interface UserWalletRow extends RowDataPacket, UserWallet { }
