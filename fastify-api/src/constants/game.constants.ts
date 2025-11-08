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
  Sicbo,
  Niuniu,
  TONGZI,
  FASTSICBO,
  SeDie = 7,
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
  Maintain, // 后面加的,黄家丽华现在没用到
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
