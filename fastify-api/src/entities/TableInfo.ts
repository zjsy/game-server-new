import { RowDataPacket } from 'mysql2'
import { RoundStatus } from '../constants/game.constants.js'

export interface Table {
  id: number;
  table_no: string;
  lobby_no: string;
  type: number;
  status: number;
  shuffle: number;
  maintain: number;
  game_type: number;
  speed: number;
  table_name: string;
  countdown: number;
  sort: number;
  limit_min: number;
  limit_max: number;
  video1: string;
  video2: string;
  login_dealer: number;
  is_login: number;
  site_url: string;
  login_ip: string;
  phone: string;
  password: string;
  token: string;
  goodroad: number;
  current_shoe: number;
  current_round_id: number;
}
export interface TableRow extends RowDataPacket, Table { }

export interface TableCache extends Omit<Table, 'status' | 'login_dealer' | 'is_login' | 'login_ip' | 'phone' | 'password' | 'token' | 'site_url' | 'limit_min' | 'sort'> {
  dealer: { id: number, nickname: string, avatar: string } | null;
  current_round_no: number;
  play_status: -1 | RoundStatus;
  round_end_time: number;
}

export type TableCacheRaw = Record<keyof TableCache, string>

export function mapToTableCache (hash: Record<string, string>): TableCache {
  return {
    id: Number(hash['id']),
    table_no: hash['table_no'],
    lobby_no: hash['lobby_no'],
    type: Number(hash['type']),
    shuffle: Number(hash['shuffle']),
    maintain: Number(hash['maintain']),
    game_type: Number(hash['game_type']),
    speed: Number(hash['speed']),
    table_name: hash['table_name'],
    countdown: Number(hash['countdown']),
    limit_max: Number(hash['limit_max']),
    video1: hash['video1'],
    video2: hash['video2'],
    goodroad: Number(hash['goodroad']),
    current_shoe: Number(hash['current_shoe']),
    current_round_id: Number(hash['current_round_id']),
    dealer: hash['dealer'] ? JSON.parse(hash['dealer']) : null,
    current_round_no: hash['current_round_no'] ? Number(hash['current_round_no']) : 0,
    play_status: hash['play_status'] ? Number(hash['play_status']) as RoundStatus : -1,
    round_end_time: hash['round_end_time'] ? Number(hash['round_end_time']) : 0,
  }
};
