import { RowDataPacket } from 'mysql2'
export interface RoundRaw {
  id: number;
  table_id: number;
  lobby_no: string;
  table_no: string;
  game_type: number;
  shoe_no: number;
  round_no: number;
  round_sn: string;
  dealer: number;
  status: number;
  result: string;
  details: string;
  start_time: Date;
  end_time: Date;
  settle_time: Date;
}
export interface RoundRow extends RowDataPacket, RoundRaw { }

export interface Round extends Omit<RoundRaw, 'result' | 'details'> {
  result: number[]; // 解析后的数组
  details: Record<string, unknown>; // 解析后的对象
}
