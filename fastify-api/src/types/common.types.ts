// 通用 HTTP 响应类型定义
// 统一结构: { code: number; msg: string; data?: T }

export type ApiResponse<T = unknown> = {
  code: number
  msg: string
  data?: T
}

export type BaccDetails = {
  p: number[];
  b: number[];
}

/** -
 * 龙虎结果详情
 */
export type DtDetails = {
  d: number;
  t: number;
}

export type betJson = {
  type: number;
  value: number;
}

export type UserLocations = {
  p1: null | number;
  p2: null | number;
  p3: null | number;
  p4: null | number;
  p5: null | number;
  p6: null | number;
  p7: null | number;
}
type FixedNumberArray = [number, number, number, number, number]

export type NiuDetails = {
  h: number;
  b: FixedNumberArray; // 1* 2 * 2 * 3 * 4
  bP: number; // 0 五牛 1 -9 点数 10 牛牛 11 五花
  p1: FixedNumberArray;
  p1P: number;
  p2: FixedNumberArray;
  p2P: number;
  p3: FixedNumberArray;
  p3P: number;
}

export type TableCache = {
  id?: string | number;
  table_no?: string;
  table_name?: string;
  lobby_no?: string;
  type?: string;
  game_type?: string | number;
  shuffle?: string | number;
  maintain?: string | number;
  speed?: string | number;
  countdown?: string | number;
  limit_max?: string | number;
  video1?: string;
  video2?: string;
  login_dealer?: string | number;
  dealerInfo?: string;
  // 随着开局变化的信息
  current_shoe?: string | number;
  current_round_no?: string | number;
  current_round_id?: string | number;
  play_status?: string | number;
  round_end_time?: number;
  goodroad?: number;
}

export type UserCache = {
  id: string;
  username: string;
  avatar: string;
  currency: string; // 前端显示的是币种
  agent_id: string | number;
  agent_sn: string;
  nickname: string;
  user_type: string | number;
  wallet_type: string | number;
  status: string | number;
  bet_status: string | number;
  last_login_ip: string; // IP是因为，session里面的ip是代理的ip,所以真实ip使用这个
  // login_time: number | string;
  point?: string | number;
  comm?: string | number; // 佣金
  device?: string | number; // 设备
  currentTable?: string; // 大房间名字
  continuousWin?: string | number; // 连续输赢
}
