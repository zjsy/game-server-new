export type TableCache = {
  id?: string | number;
  table_no?: string;
  table_name?: string;
  lobby_no?: string;
  type?: string | number;
  game_type?: string | number;
  shuffle?: string | number;
  maintain?: string | number;
  speed?: string | number;
  countdown?: string | number;
  limit_max?: string | number;
  video1?: string;
  video2?: string;
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

export type ConfigCache = {
  bakVideoUrl: string;
  resourceUrl: string;
}
