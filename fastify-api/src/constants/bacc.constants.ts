import { BaccDetails } from '../types/common.types.js'

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

export function getBonusOdds (diff:number) {
  return bonusOdds[diff as keyof typeof bonusOdds] || 0
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

function getBaccPoint (cards:number[]) {
  return cards.reduce((prev, next) => {
    return prev + (next % 13 > 9 || next % 13 === 0 ? 0 : next % 13)
  }, 0) % 10
}

export function parseBaccPoint (details: BaccDetails) {
  return {
    bp: getBaccPoint(details.b),
    pp: getBaccPoint(details.p),
  }
}

export function parseBaccResult (details: BaccDetails, points: { bp: number; pp: number }) {
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

export function calWinloseForBacc (betDetails: Record<string, number>, hitRes:number[], details: BaccDetails, points: { bp: number; pp: number } | null) {
  let winLose = 0
  for (const betKey in betDetails) {
    const betType = Number(betKey)
    const betAmount = betDetails[betKey]
    if (betType === BaccBetType.banker) {
      if (hitRes.includes(BaccBetType.banker)) {
        winLose += betAmount * 0.95
      } else if (hitRes.includes(BaccBetType.player)) {
        winLose -= betAmount
      }
    } else if (betType === BaccBetType.player) {
      if (hitRes.includes(BaccBetType.player)) {
        winLose += betAmount
      } else if (hitRes.includes(BaccBetType.banker)) {
        winLose -= betAmount
      }
    } else if (betType === BaccBetType.super6) {
      if (points) {
        if (hitRes.includes(BaccBetType.banker) && points.bp === 6) {
          if (details.b.length === 2) {
            winLose += 12 * betAmount
          } else {
            winLose += 20 * betAmount
          }
        } else {
          winLose -= betAmount
        }
      }
    } else if (betType === BaccBetType.noCommonBanker) {
      if (points) {
        if (hitRes.includes(BaccBetType.banker)) {
          if (points.bp === 6) {
            winLose += 0.5 * betAmount
          } else {
            winLose += betAmount
          }
        } else if (hitRes.includes(BaccBetType.player)) {
          winLose -= betAmount
        }
      }
    } else if (betType === BaccBetType.bankerBonus) {
      if (points) {
        if (hitRes.includes(BaccBetType.banker)) {
          const bPoint = points.bp
          const pPoint = points.pp
          const isBNatural = bPoint > 7 && details.b.length === 2
          if (isBNatural) {
            winLose += betAmount
          } else {
            const diff = bPoint - pPoint
            if (diff > 3) {
              winLose += betAmount * getBonusOdds(diff)
            } else {
              winLose -= betAmount
            }
          }
        } else if (hitRes.includes(BaccBetType.tie)) {
          const isNaturalTie = points.pp > 7 && points.bp > 7
          if (isNaturalTie) {
            winLose += betAmount
          } else {
            winLose -= betAmount
          }
        } else {
          winLose -= betAmount
        }
      }
    } else if (betType === BaccBetType.playerBonus) {
      if (points) {
        if (hitRes.includes(BaccBetType.player)) {
          const bPoint = points.bp
          const pPoint = points.pp
          const isPNatural = pPoint > 7 && details.p.length === 2
          if (isPNatural) {
            winLose += betAmount
          } else {
            const diff = pPoint - bPoint
            if (diff > 3) {
              winLose += betAmount * getBonusOdds(diff)
            } else {
              winLose -= betAmount
            }
          }
        } else if (hitRes.includes(BaccBetType.tie)) {
          const isNaturalTie = points.pp > 7 && points.bp > 7
          if (isNaturalTie) {
            winLose += betAmount
          } else {
            winLose -= betAmount
          }
        } else {
          winLose -= betAmount
        }
      }
    } else if (betType === BaccBetType.bNatural) {
      if (points) {
        const isNatural = details.b.length === 2 && points.bp > 7
        if (hitRes.includes(BaccBetType.banker) && isNatural) {
          winLose += 4 * betAmount
        } else if (hitRes.includes(BaccBetType.player)) {
          winLose -= betAmount
        }
      }
    } else if (betType === BaccBetType.pNatural) {
      if (points) {
        const isNatural = details.p.length === 2 && points.pp > 7
        if (hitRes.includes(BaccBetType.player) && isNatural) {
          winLose += 4 * betAmount
        } else if (hitRes.includes(BaccBetType.player)) {
          winLose -= betAmount
        }
      }
    } else if (betType === BaccBetType.tigerPair) {
      if (hitRes.includes(BaccBetType.playerPair)) {
        if (hitRes.includes(BaccBetType.bankerPair)) {
          if (details.b[0] === details.p[0]) {
            winLose += 100 * betAmount
          } else {
            winLose += 20 * betAmount
          }
        } else {
          winLose += 4 * betAmount
        }
      } else {
        if (hitRes.includes(BaccBetType.bankerPair)) {
          winLose += 4 * betAmount
        } else {
          winLose -= betAmount
        }
      }
    } else if (betType === BaccBetType.ccPlayer) {
      if (points) {
        if (hitRes.includes(BaccBetType.player)) {
          // win
          const pPoint = points.pp
          const odds = pPoint === 9 ? 8.55 : pPoint
          winLose += odds * betAmount
        } else if (hitRes.includes(BaccBetType.banker)) {
          // lose
          const bPoint = points.bp
          winLose -= bPoint * betAmount
        }
      }
    } else if (betType === BaccBetType.ccBanker) {
      if (points) {
        if (hitRes.includes(BaccBetType.banker)) {
          // win
          const bPoint = points.bp
          const odds = bPoint === 9 ? 8.55 : bPoint
          winLose += odds * betAmount
        } else if (hitRes.includes(BaccBetType.player)) {
          // lose
          const pPoint = points.pp
          winLose -= pPoint * betAmount
        }
      }
    } else {
      if (hitRes.includes(betType)) {
        // 命中直接按倍率加钱并返回本金
        winLose += betAmount * getBaccOdds(betType)
      } else {
        winLose -= betAmount
      }
    }
  }
  return winLose
}

export function calRollingForBacc (totalBet:number, betDetails: Record<string, number>, hitRes:number[]) {
  const playerBet = betDetails[BaccBetType.player] ? betDetails[BaccBetType.player] : 0
  const bankerBet = betDetails[BaccBetType.banker] ? betDetails[BaccBetType.banker] : 0
  const noCommBankerBet = betDetails[BaccBetType.noCommonBanker] ? betDetails[BaccBetType.noCommonBanker] : 0
  const bankerBonus = betDetails[BaccBetType.bankerBonus] ? betDetails[BaccBetType.bankerBonus] : 0
  const playerBonus = betDetails[BaccBetType.playerBonus] ? betDetails[BaccBetType.playerBonus] : 0
  if (hitRes.includes(BaccBetType.tie)) {
    // 开和时候，庄闲下注不算洗码
    return totalBet - playerBet - bankerBet - noCommBankerBet - bankerBonus - playerBonus
  } else {
    return totalBet - playerBet - bankerBet - noCommBankerBet + Math.abs(playerBet - bankerBet - noCommBankerBet)
  }
}
