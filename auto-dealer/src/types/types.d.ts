import { RoundStatus } from "../const/GameConst";

export type StartResponse = {
  id: number;
  tableId: number;
  shoeNo: number;
  roundNo: number;
  roundSn: string;
  startTime: Date;
};

export type SettleRequest<T> = {
  roundId: number;
  details: T;
  result?: number[];
  goodType?: number;
};

export type BaseResponse<T> = {
  code: number;
  msg?: string;
  data: T;
};

export type ShuffleResponse = {
  shoeNo: number;
};

export type LoginTableResponse = {
  id?: number;
  table_no: string;
  table_name?: string;
  type: number;
  current_shoe: number;
  current_round_no: number;
  current_round_id: number;
  game_type: number;
  countdown: number;
  shuffle?: number;
  maintain?: number;
  playStatus: number;
  video?: string;
  token: string;
  refreshToken: string;
  roundStopTime?: number;
  roundCountdown?: number;
};

export type TableInfo = {
  tableNo: string;
  countdown: number;
  roundNo: number;
  type: number;
  gameType: number;
  playStatus: RoundStatus;
  currentShoe: number;
  currentRoundId: number;
};
