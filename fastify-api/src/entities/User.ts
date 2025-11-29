import { RowDataPacket } from 'mysql2'
import { UserType, UserWalletType } from '../constants/game.constants.js'

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
  user_type: UserType;
  wallet_type: UserWalletType;
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

export interface UserCache extends Omit<User, 'user_sn' | 'source' | 'is_online' | 'commission' | 'comm_status' | 'last_login_device'> {
  point: number;
  comm: number; // 佣金
  device: number; // 设备
  // login_count?: number ;
  // currentTable?: string; // 大房间名字
  // continuousWin?: number; // 连续输赢
}

export type UserCacheRaw = Record<keyof UserCache, string>

export function mapToUserCache (hash: Record<string, string>): UserCache {
  return {
    id: Number(hash['id']),
    username: hash['username'],
    avatar: hash['avatar'],
    currency: hash['currency'],
    agent_id: Number(hash['agent_id']),
    agent_sn: hash['agent_sn'],
    nickname: hash['nickname'],
    user_type: Number(hash['user_type']),
    wallet_type: Number(hash['wallet_type']),
    status: Number(hash['status']),
    bet_status: Number(hash['bet_status']),
    last_login_ip: hash['last_login_ip'],
    point: hash['point'] ? Number(hash['point']) : 0,
    comm: hash['comm'] ? Number(hash['comm']) : 0, // 佣金
    device: hash['device'] ? Number(hash['device']) : 0, // 设备
  }
}
