export interface TableLoginRequest {
  t: string // table_no
  p: string // password
}

export interface DealerLoginRequest {
  dealerNo: string
}

export interface TableMaintainRequest {
  status: number
}

export interface GetRoundListRequest {
  gameType: number
  shoeNo: number
  type?: number
}

export type DealingRequest = {
  index: number;
  details: number;
}

export type StopBetRequest = {
  roundId: number;
}

export type SettleRequest<T> = {
  roundId: number;
  details: T;
  result: number[];
  goodType?: number;
}

export type CancelRequest = {
  roundId: number;
}
