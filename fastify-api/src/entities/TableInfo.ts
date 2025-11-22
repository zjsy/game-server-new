import { RowDataPacket } from 'mysql2'

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
