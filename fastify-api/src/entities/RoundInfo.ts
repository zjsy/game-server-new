import { RowDataPacket } from 'mysql2'
import { safeParse } from '../utils/json.parse.utils.js'
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
  details: Record<string, unknown> | number[]; // 解析后的对象,目前只有sicbo是 number[]
}

// 将 RoundRow 转换为 Round（解析 JSON 字段）
export function mapRoundRow<K extends keyof RoundRow> (
  row: Pick<RoundRow, K>
): Pick<Round, K & keyof Round> {
  const result: any = { ...row }

  if ('result' in row) {
    result.result = row.result
      ? safeParse<number[]>(row.result as string, [])
      : null
  }
  if ('details' in row) {
    result.details = row.details
      ? safeParse<Record<string, unknown>>(row.details as string, {})
      : null
  }

  return result
}
