import { RowDataPacket } from 'mysql2'

export interface User {
  id: number;
  user_sn: string;
  username: string;
  currency: string;
  agent_sn: string;
  agent_id: number;
  nickname: string;
  avatar: string;
  // email: string;
  // phone: string;
  // password: string;
  user_type: number;
  wallet_type: number;
  commission: number;
  comm_status: number;
  is_online: number;
  source: string;
  status: number;
  bet_status: number;
  // bet_limit_groups: string;
  last_login_device: number;
  last_login_ip: string;
  // last_login_time: Date;
  // created_at: Date;
  // updated_at: Date;
}

export interface UserRow extends RowDataPacket, User { }
