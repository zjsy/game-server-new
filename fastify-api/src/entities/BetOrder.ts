import { RowDataPacket } from 'mysql2'

export interface BetTempOrderRaw {
  id: number;
  lobby_no: string;
  table_no: string;
  user_id: number;
  username: string;
  agent_id: number;
  round_id: number;
  dealer: number;
  table_id: number;
  shoe_no: number;
  round_no: number;
  bet_time: Date;
  currency: string;
  bet_amount: number;
  bet_source: string;
  game_type: number;
  bet: string; // JSON字符串
  status: number;
  bet_ip: string;
  user_type: number;
}

export interface BetTempOrderRow extends RowDataPacket, BetTempOrderRaw { }

export interface BetTempOrder extends Omit<BetTempOrderRaw, 'bet'> {
  bet: Record<string, number>; // 解析后的对象
}

export interface BetOrderRaw extends BetTempOrderRaw {
  status: number;
  rolling: number;
  round_result: string; // JSON字符串
  round_details: string; // JSON字符串
  settle_result: number;
  comm: number;
  settle_time: Date;
}

export interface BetOrderRow extends RowDataPacket, BetOrderRaw { }

export interface BetOrder extends Omit<BetOrderRaw, 'bet' | 'round_result' | 'round_details'> {
  bet: Record<string, number>; // 解析后的对象
  round_result: number[]; // 解析后的数组
  round_details: Record<string, unknown>; // 解析后的对象
}
