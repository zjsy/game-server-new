import { RowDataPacket } from 'mysql2'

export interface GameAgent {
  id: number;
  agent_sn: string;
  pid: number;
  level: number;
  nickname: string;
  avatar: string;
  sharing: number;
  commission: number;
  wallet_type: number;
  status: number;
  api: string;
}

export interface GameAgentRow extends RowDataPacket, GameAgent { }
