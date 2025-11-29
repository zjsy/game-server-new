export const enum UserType {
  Player,
  Robot,
  Demo,
}

// 游戏类型
export const enum GameType {
  Baccarat,
  DragonTiger,
  Roulette,
  SicBo,
  Bull,
  FastSicBo,
  DragonPhoenix,
  SeDie,
  Tongzi = 10
}

// 钱包类型
export const enum UserWalletType {
  Single,
  Transfer,
}

// 桌状态,TODO:最好调整顺序
export const enum TableStatus {
  Close, // 关
  Open, // 开
  Shuffle, // 洗牌
  Maintain, // 维护
}

export const enum RoundStatus {
  Betting, // 倒计时中betting
  Dealing, // 发牌中dealing
  Over, // 已结算over
  Cancel, // 取消结果
  Resettle, // 改结果
}

// 注单状态
export const enum OrderStatus {
  Pending,
  Settled,
  Resettled,
  Cancel,
}

// 交易类型
export const enum TransactionsType {
  Bet,
  Settle,
  Cancel,
  Resettle,
  Reverse,
}

export const ResettleOrderFields = [
  'id',
  'game_type',
  'round_id',
  'user_id',
  'username',
  'agent_id',
  'user_type',
  'table_no',
  'table_id',
  'currency',
  'status',
  'bet_time',
  'bet_amount',
  'bet',
  'rolling',
  'settle_result',
  'comm',
] as const

// 导出类型,用于类型标注
export type ResettleOrderField = typeof ResettleOrderFields[number]
