export enum GameType {
  BACCARAT,
  DRAGONTIGER,
  Roulette,
  Sicbo,
  NIUNIU,
  TONGZI,
  FASTSICBO,
  SEDIE,
}

export const enum RoundStatus {
  Betting, // 倒计时中betting
  Dealing, // 发牌中dealing
  Over, // 已结算over
  Cancel, // 取消结果
  Resettle, // 改结果
}

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

export enum BaccBetType {
  banker = 1,
  tie,
  player,
  small,
  big,
  bankerPair,
  playerPair,
  // 免佣庄
  noCommonBanker,
  super6,
  perfectPair,
  anyPair = 11,
  panda8,
  dragon7,
  playerBonus,
  bankerBonus,
  // // lg88 没有下列下注类型
  // pNatural,
  // bNatural,
  // // 老虎就是super6
  // // tiger,
  // bigTiger,
  // smallTiger,
  // tigerTie,
  // tigerPair,
  // // 牛牛玩法，赔率为庄闲点数差，和退回
  // ccPlayer,
  // ccBanker,
  // 点数
  playerPoint0 = 30,
  playerPoint1,
  playerPoint2,
  playerPoint3,
  playerPoint4,
  playerPoint5,
  playerPoint6,
  playerPoint7,
  playerPoint8,
  playerPoint9,
  bankerPoint0,
  bankerPoint1,
  bankerPoint2,
  bankerPoint3,
  bankerPoint4,
  bankerPoint5,
  bankerPoint6,
  bankerPoint7,
  bankerPoint8,
  bankerPoint9,
  tiePoint0,
  tiePoint1,
  tiePoint2,
  tiePoint3,
  tiePoint4,
  tiePoint5,
  tiePoint6,
  tiePoint7,
  tiePoint8,
  tiePoint9,
}

export enum DtBetType {
  Dragon = 1,
  Tie,
  Tiger,
  DragonOdd,
  DragonEven,
  DragonRed,
  DragonBlack,
  TigerOdd,
  TigerEven,
  TigerRed,
  TigerBlack,
}

export enum NNBetType {
  player1 = 1,
  player1Double,
  player1Many,
  player2,
  player2Double,
  player2Many,
  player3,
  player3Double,
  player3Many,
}

export enum ZXNiuBetType {
  playerNiu = 1,
  bankerNiu,
  bull,
  doubledNiu,
  // 五花五小四炸
  special = 7,
  playerDouble = 8,
  bankerDouble = 9,
}

export enum TZBetType {
  player1 = 1,
  player1Double,
  player2,
  player2Double,
  player3,
  player3Double,
  player5,
  player5Double,
}

export enum ZXTZBetType {
  player = 1,
  tie,
  banker,
  pair,
  doubledPair,
}

export enum SicboBetType {
  // 大小单双1:1 遇围骰庄家通吃
  big = 1, // 4-10
  small, // 11-17
  //总点数为 5, 7, 9, 11, 13, 15, 17 点 ( 遇围骰庄家通吃 )
  odd,
  //总点数为 4, 6, 8, 10, 12, 14, 16 点 ( 遇围骰庄家通吃 )
  even,
  // 全围 1 ：30
  anyTriple,
  // 围骰 (1:180)
  specificTriples1,
  specificTriples2,
  specificTriples3,
  specificTriples4,
  specificTriples5,
  specificTriples6,
  // 三军(单骰1：1 双1:2 全1：3)
  threeForces1,
  threeForces2,
  threeForces3,
  threeForces4,
  threeForces5,
  threeForces6,
  // 对子(1 赔 10)
  pairs1,
  pairs2,
  pairs3,
  pairs4,
  pairs5,
  pairs6,
  // 牌九式 (1 赔 5)
  zuhe12,
  zuhe13,
  zuhe14,
  zuhe15,
  zuhe16,
  zuhe23,
  zuhe24,
  zuhe25,
  zuhe26,
  zuhe34,
  zuhe35,
  zuhe36,
  zuhe45,
  zuhe46,
  zuhe56,
  // 1:60
  point4,
  point17,
  // 1:30
  point5,
  point16,
  // 1:17
  point6,
  point15,
  // 1:12
  point7,
  point14,
  // 1:8
  point8,
  point13,
  // 1:6
  point9,
  point10,
  point11,
  point12,
}

export enum RouletteBetType {
  // 1:1
  red = 1, // 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
  black, //2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35
  odd,
  even,
  small, // 1-18
  big, // 19-36
  // 打注 1 ：2
  dozen1, //1-12
  dozen2, // 13-24
  dozen3, // 25,26
  //行注 1:2
  row1, //1,4,7,10,13,16,19,22,25,28,31,34
  row2, //2,5,8,11,14,17,20,23,26,29,32,35
  row3, //3,6,9,12,15,18,21,24,27,30,33,36
  // 线注 1:5
  line_010203040506, // 1-6
  line_040506070809, // 4-9,
  line_070809101112, // 7-12
  line_101112131415, // 10-15
  line_131415161718, // 13-18
  line_161718192021, // 16-21
  line_192021222324, // 19-24
  line_222324252627, // 22-27
  line_252627282930, // 25-30
  line_282930313233, // 28-33
  line_313233343536, // 31-36

  // 角注 1:8
  angle_01020405, // 1,2,4,5
  angle_02030506, // 2,3,5,6
  angle_04050708, // 4,5,7,8
  angle_05060809, // 5,6,8,9
  angle_07081011, // 7,8,10,11,
  angle_08091112, // 8,9,11,12
  angle_10111314, // 10,11,13,14
  angle_11121415, // 11,12,14,15
  angle_13141617, // 13,14,16,17
  angle_14151718, // 14,15,17,18
  angle_16171920, // 16,17,19,20
  angle_17182021, // 17,18,20,21
  angle_19202223, // 19,20,22,23
  angle_20212324, // 20,21,23,24
  angle_22232526, // 22,23,25,26,
  angle_23242627, // 23,24,26,27
  angle_25262829, // 25,26,28,29
  angle_26272930, // 26,27,29,30
  angle_28293132, // 28,29,31,32
  angle_29303233, // 29,30,32,33
  angle_31323435, // 31,32,34,35
  angle_32333536, // 32,33,35,36
  // 0,1,2,3
  four_00010203,
  // 街注 1:11
  street_010203, // 1,2,3
  street_040506, // 4,5,6
  street_070809, // 7,8,9,
  street_101112, // 10,11,12
  street_131415, // 13,14,15
  street_161718, // 16,17,18
  street_192021, // 19,20,21
  street_222324, // 22,23,24
  street_252627, // 25,26,27
  street_282930, // 28,29,30
  street_313233, // 31,32,33
  street_343536, // 34,35,36
  three_000102, // 0,1,2
  three_000203, // 0,2,3

  // 分注 1:17 2个号码，投注于两个号码之间的格线上 。如2和3）
  separate_0001, // 0,1
  separate_0002, // 0,2
  separate_0003, // 0,3
  separate_0102, // 1,2
  separate_0203, // 2,3
  separate_0104,
  separate_0205,
  separate_0306,
  separate_0405, // 4,5
  separate_0506, // 5,6
  separate_0407,
  separate_0508,
  separate_0609,
  separate_0708, // 7,8
  separate_0809, // 8,9
  separate_0710,
  separate_0811,
  separate_0912,
  separate_1011, // 10,11
  separate_1112, // 11,12
  separate_1013,
  separate_1114,
  separate_1215,
  separate_1314, // 13,14
  separate_1415, // 14,15
  separate_1316,
  separate_1417,
  separate_1518,
  separate_1617, // 16,17
  separate_1718, // 17,18
  separate_1619,
  separate_1720,
  separate_1821,
  separate_1920, // 19,20
  separate_2021, // 20,21
  separate_1922,
  separate_2023,
  separate_2124,
  separate_2223, // 22,23
  separate_2324, // 23,24
  separate_2225,
  separate_2326,
  separate_2427,
  separate_2526, // 25,26
  separate_2627, // 26,27
  separate_2528,
  separate_2629,
  separate_2730,
  separate_2829, // 28,29
  separate_2930, // 29,30
  separate_2831,
  separate_2932,
  separate_3033,
  separate_3132, // 31,32
  separate_3233, // 32,33
  separate_3134,
  separate_3235,
  separate_3336,
  separate_3435, // 34,35
  separate_3536, // 35,36
  // 直接命中 1:35
  direct_00,
  direct_01,
  direct_02,
  direct_03,
  direct_04,
  direct_05,
  direct_06,
  direct_07,
  direct_08,
  direct_09,
  direct_10,
  direct_11,
  direct_12,
  direct_13,
  direct_14,
  direct_15,
  direct_16,
  direct_17,
  direct_18,
  direct_19,
  direct_20,
  direct_21,
  direct_22,
  direct_23,
  direct_24,
  direct_25,
  direct_26,
  direct_27,
  direct_28,
  direct_29,
  direct_30,
  direct_31,
  direct_32,
  direct_33,
  direct_34,
  direct_35,
  direct_36,
}
