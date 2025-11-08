/**
 * 百家乐赔率
 */
export enum BaccBetType {
  // 普通百家乐
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
  // lg88 没有下列下注类型
  pNatural,
  bNatural,
  // 老虎就是super6
  // tiger,
  bigTiger,
  smallTiger,
  tigerTie,
  tigerPair,
  ccPlayer,
  ccBanker,
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

const BaccOdds: Record<BaccBetType, number> = {
  [BaccBetType.banker]: 0.95,
  [BaccBetType.tie]: 8,
  [BaccBetType.player]: 1,
  [BaccBetType.small]: 1.5,
  [BaccBetType.big]: 0.5,
  [BaccBetType.bankerPair]: 11,
  [BaccBetType.playerPair]: 11,
  [BaccBetType.noCommonBanker]: 1, // 免佣庄
  [BaccBetType.super6]: 12, // super6
  [BaccBetType.perfectPair]: 25,
  [BaccBetType.anyPair]: 5,
  [BaccBetType.panda8]: 25,
  [BaccBetType.dragon7]: 40,
  [BaccBetType.playerBonus]: 10, // bonus
  [BaccBetType.bankerBonus]: 10, // bonus
  [BaccBetType.pNatural]: 4,
  [BaccBetType.bNatural]: 4,
  [BaccBetType.bigTiger]: 50,
  [BaccBetType.smallTiger]: 22,
  [BaccBetType.tigerTie]: 40,
  [BaccBetType.tigerPair]: 0, // tigerPair
  [BaccBetType.ccPlayer]: 0, // ccPlayer
  [BaccBetType.ccBanker]: 0, // ccbanker
  [BaccBetType.playerPoint0]: 8,
  [BaccBetType.playerPoint1]: 10.5,
  [BaccBetType.playerPoint2]: 10.5,
  [BaccBetType.playerPoint3]: 10.5,
  [BaccBetType.playerPoint4]: 9.5,
  [BaccBetType.playerPoint5]: 9.5,
  [BaccBetType.playerPoint6]: 5.5,
  [BaccBetType.playerPoint7]: 5.5,
  [BaccBetType.playerPoint8]: 5.5,
  [BaccBetType.playerPoint9]: 5.5,
  [BaccBetType.bankerPoint0]: 8,
  [BaccBetType.bankerPoint1]: 10.5,
  [BaccBetType.bankerPoint2]: 10.5,
  [BaccBetType.bankerPoint3]: 10.5,
  [BaccBetType.bankerPoint4]: 9.5,
  [BaccBetType.bankerPoint5]: 9.5,
  [BaccBetType.bankerPoint6]: 5.5,
  [BaccBetType.bankerPoint7]: 5.5,
  [BaccBetType.bankerPoint8]: 5.5,
  [BaccBetType.bankerPoint9]: 5.5,
  [BaccBetType.tiePoint0]: 150,
  [BaccBetType.tiePoint1]: 215,
  [BaccBetType.tiePoint2]: 220,
  [BaccBetType.tiePoint3]: 200,
  [BaccBetType.tiePoint4]: 220,
  [BaccBetType.tiePoint5]: 110,
  [BaccBetType.tiePoint6]: 45,
  [BaccBetType.tiePoint7]: 45,
  [BaccBetType.tiePoint8]: 80,
  [BaccBetType.tiePoint9]: 80,
}

const bonusOdds = {
  4: 1,
  5: 2,
  6: 4,
  7: 6,
  8: 10,
  9: 30,
}

export function getBonusOdds (diff:keyof typeof bonusOdds) {
  return bonusOdds[diff]
}

export function getBaccOdds (beytype: BaccBetType) {
  return BaccOdds[beytype]
}

// 获取限红odds
export function getBaccOddsForLimit (betType: BaccBetType) {
  let odds = 1
  if (betType === BaccBetType.banker) {
    odds = 1
  } else if (betType === BaccBetType.super6) {
    // super6
    odds = 12
  } else if (betType === BaccBetType.bankerBonus || betType === BaccBetType.playerBonus) {
    // bonus
    odds = 1
  } else if (betType === BaccBetType.ccBanker || betType === BaccBetType.ccPlayer) {
    // cowcow bacc
    odds = 1
  } else if (betType === BaccBetType.tigerPair) {
    // tiger pair
    odds = 4
  } else {
    odds = BaccOdds[betType]
  }
  return odds
}

// 暂时没用
export function parseBaccResult (details: { b: number[]; p: number[] }, points: { bp: number; pp: number }) {
  const bankerPokers = details.b
  const playerPokers = details.p
  const bP = points.bp
  const pP = points.pp
  const resArr = []
  if (bP > pP) {
    resArr.push(BaccBetType.banker)
    // 庄例牌
    // if (bankerPokers.length === 2 && bP > 7) {
    //     resArr.push(BaccBetType.bNatural);
    // }
    // 熊7 龙八
    if (bankerPokers.length === 3 && bP === 7) {
      resArr.push(BaccBetType.dragon7)
    }

    // 大小老虎
    // if (bankerPokers.length === 3 && bP === 6) {
    //     resArr.push(BaccBetType.bigTiger);
    // }
    // if (bankerPokers.length === 2 && bP === 6) {
    //     resArr.push(BaccBetType.smallTiger);
    // }
  } else if (bP < pP) {
    // 闲例牌
    // if (bankerPokers.length === 2 && bP > 7) {
    //     resArr.push(BaccBetType.pNatural);
    // }
    if (playerPokers.length === 3 && pP === 8) {
      resArr.push(BaccBetType.panda8)
    }
    resArr.push(BaccBetType.player)
  } else {
    resArr.push(BaccBetType.tie)
    // 和点数
    if (bP === 0) {
      resArr.push(BaccBetType.tiePoint0)
    } else if (bP === 1) {
      resArr.push(BaccBetType.tiePoint1)
    } else if (bP === 2) {
      resArr.push(BaccBetType.tiePoint2)
    } else if (bP === 3) {
      resArr.push(BaccBetType.tiePoint3)
    } else if (bP === 4) {
      resArr.push(BaccBetType.tiePoint4)
    } else if (bP === 5) {
      resArr.push(BaccBetType.tiePoint5)
    } else if (bP === 6) {
      resArr.push(BaccBetType.tiePoint6)
    } else if (bP === 7) {
      resArr.push(BaccBetType.tiePoint7)
    } else if (bP === 8) {
      resArr.push(BaccBetType.tiePoint8)
    } else if (bP === 9) {
      resArr.push(BaccBetType.tiePoint9)
    }
  }
  // 大小
  if (bankerPokers.length === 3 || playerPokers.length === 3) {
    resArr.push(BaccBetType.big)
  } else {
    resArr.push(BaccBetType.small)
  }
  // 庄对
  const isbPair = (bankerPokers[0] + 1) % 13 === (bankerPokers[1] + 1) % 13
  if (isbPair) {
    resArr.push(BaccBetType.bankerPair)
  }
  const ispPair = (playerPokers[0] + 1) % 13 === (playerPokers[1] + 1) % 13
  if (ispPair) {
    resArr.push(BaccBetType.playerPair)
  }
  if (isbPair || ispPair) {
    resArr.push(BaccBetType.anyPair)
  }
  if (bankerPokers[0] === bankerPokers[1] || playerPokers[0] === playerPokers[1]) {
    resArr.push(BaccBetType.perfectPair)
  }

  if (pP === 0) {
    resArr.push(BaccBetType.playerPoint0)
  } else if (pP === 1) {
    resArr.push(BaccBetType.playerPoint1)
  } else if (pP === 2) {
    resArr.push(BaccBetType.playerPoint2)
  } else if (pP === 3) {
    resArr.push(BaccBetType.playerPoint3)
  } else if (pP === 4) {
    resArr.push(BaccBetType.playerPoint4)
  } else if (pP === 5) {
    resArr.push(BaccBetType.playerPoint5)
  } else if (pP === 6) {
    resArr.push(BaccBetType.playerPoint6)
  } else if (pP === 7) {
    resArr.push(BaccBetType.playerPoint7)
  } else if (pP === 8) {
    resArr.push(BaccBetType.playerPoint8)
  } else if (pP === 9) {
    resArr.push(BaccBetType.playerPoint9)
  }

  if (bP === 0) {
    resArr.push(BaccBetType.bankerPoint0)
  } else if (bP === 1) {
    resArr.push(BaccBetType.bankerPoint1)
  } else if (bP === 2) {
    resArr.push(BaccBetType.bankerPoint2)
  } else if (bP === 3) {
    resArr.push(BaccBetType.bankerPoint3)
  } else if (bP === 4) {
    resArr.push(BaccBetType.bankerPoint4)
  } else if (bP === 5) {
    resArr.push(BaccBetType.bankerPoint5)
  } else if (bP === 6) {
    resArr.push(BaccBetType.bankerPoint6)
  } else if (bP === 7) {
    resArr.push(BaccBetType.bankerPoint7)
  } else if (bP === 8) {
    resArr.push(BaccBetType.bankerPoint8)
  } else if (bP === 9) {
    resArr.push(BaccBetType.bankerPoint9)
  }

  return resArr
}
