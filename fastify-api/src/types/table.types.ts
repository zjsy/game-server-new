// 桌实体类型
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
  current_shoe: number; // 靴序号
  current_round_id: number; // 靴序号
}

export interface TableLoginRequest {
  t: string // table_no
  p: string // password
}

export interface TableLoginResponse {
  id: number
  table_no: string
  table_name: string
  type: number
  current_shoe: number
  current_round_no: number
  current_round_id: number
  game_type: number
  countdown: number
  shuffle: number
  maintain: number
  playStatus: number
  video: string
  token: string
  roundStopTime: number
  roundCountdown: number
}

export interface DealerLoginRequest {
  dealerNo: string
}

export interface DealerLoginResponse {
  nickname: string
  avatar: string
}

export interface TableMaintainRequest {
  status: number
}

export interface Round {
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
  details: Record<string, any> | number[];
  start_time: Date;
  end_time: Date;
  settle_time: Date;
}

export interface GetRoundListRequest {
  gameType: number
  shoeNo: number
  type?: number
}

export interface GetRoundListResponse {
  rounds: Round[]
}

export interface RefreshTokenResponse {
  token: string
  expiresIn: string
}
