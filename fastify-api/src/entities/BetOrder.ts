import { RowDataPacket } from 'mysql2'
import { safeParse } from '../utils/json.parse.utils.js'

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

export function mapTempBetOrderRow <K extends keyof BetTempOrderRow> (row: Pick<BetTempOrderRow, K>): Pick<BetTempOrder, K & keyof BetTempOrder> {
  const result: any = { ...row }

  // 只有当包含这些字段时才解析
  if ('bet' in row && typeof row.bet === 'string') {
    result.bet = safeParse<Record<string, number>>(row.bet, {})
  }
  if ('round_result' in row) {
    result.round_result = row.round_result
      ? safeParse<number[]>(row.round_result as string, [])
      : null
  }
  if ('round_details' in row) {
    result.round_details = row.round_details
      ? safeParse<Record<string, unknown>>(row.round_details as string, {})
      : null
  }

  return result
}

export interface BetOrderRaw extends BetTempOrderRaw {
  status: number;
  rolling: number;
  round_result: string | null; // JSON字符串
  round_details: string | null; // JSON字符串
  settle_result: number;
  comm: number;
  settle_time: Date;
}

export interface BetOrderRow extends RowDataPacket, BetOrderRaw { }

export interface BetOrder extends Omit<BetOrderRaw, 'bet' | 'round_result' | 'round_details'> {
  bet: Record<string, number>; // 解析后的对象
  round_result: number[] | null; // 解析后的数组
  round_details: Record<string, unknown> | null; // 解析后的对象
}

// 将 BetOrderRow 转换为 BetOrder（解析 JSON 字段）
export function mapBetOrderRow<K extends keyof BetOrderRow> (
  row: Pick<BetOrderRow, K>
): Pick<BetOrder, K & keyof BetOrder> {
  const result: any = { ...row }

  // 只有当包含这些字段时才解析
  if ('bet' in row && typeof row.bet === 'string') {
    result.bet = safeParse<Record<string, number>>(row.bet, {})
  }
  if ('round_result' in row) {
    result.round_result = row.round_result
      ? safeParse<number[]>(row.round_result as string, [])
      : null
  }
  if ('round_details' in row) {
    result.round_details = row.round_details
      ? safeParse<Record<string, unknown>>(row.round_details as string, {})
      : null
  }

  return result
}
