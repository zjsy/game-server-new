// 桌实体类型
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
  current_shoe: number; // 靴序号
  current_round_id: number; // 靴序号
}
export interface TableRow extends RowDataPacket, Table { }
export interface Dealer {
  id: number
  dealer_no: string
  nickname: string
  status: number
  avatar: string
  is_login: number
}
export interface DealerRow extends RowDataPacket, Dealer { }

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
  refreshToken: string // 新增 refresh token
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
export interface RoundRow extends RowDataPacket, Round { }

export interface GameConfig {
  id: number;
  name: string;
  value: string;
}
export interface GameConfigRow extends RowDataPacket, GameConfig { }

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
  refreshToken: string
  expiresIn: string
}

export interface BetTempOrder {
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
  bet: Record<string, any>;
  status: number;
  bet_ip: string;
  user_type: number;
}

export interface BetTempOrderRow extends RowDataPacket, BetTempOrder { }

export interface BetOrder extends BetTempOrder {
  status: number;
  rolling: number;
  round_result: string;
  round_details: Record<string, any>;
  settle_result: number;
  comm: number;
  settle_time: Date;
}

export interface BetOrderRow extends RowDataPacket, BetOrder { }

export interface UserBetStats {
  user_id: number
  continuous_win: number
  today_bet_count: number
  today_bet_money: number
  today_rolling: number
  today_winlose: number
  total_bet_count: number
  total_bet_money: number
  total_rolling: number
  total_winlose: number
}

export interface UserBetStatsRow extends RowDataPacket, UserBetStats { }

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
  user_type: number;
  wallet_type: number;
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

export interface UserWallet {
  user_id: number;
  agent_id: number;
  currency: string;
  balance: number;
}

export interface UserWalletRow extends RowDataPacket, UserWallet { }

export interface Transactions {
  id: number
  transaction_no: string
  user_id: number
  agent_id: number
  username: string
  operate_time: Date
  type: number
  change: number
  after_balance: number
  remark: string
}

export interface TransactionsRow extends RowDataPacket, Transactions { }

export interface UserBlockTables {
  user_id: number;
  table_id: number;
}

export interface UserBlockTablesRow extends RowDataPacket, UserBlockTables { }

export interface GameAgent {
  id: number;
  agent_sn: string;
  pid: number;
  level: number;
  nickname: string;
  avatar: string;
  sharing: number;
  commission: number;
  wallet_type: number;
  status: number;
  api: string;
}

export interface GameAgentRow extends RowDataPacket, GameAgent { }
