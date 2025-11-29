export enum DpBetType {
  dragon = 1,
  phoenix = 2,
  straight = 3,
  flush = 4,
  straightFlush = 5,
  threeKind = 6,
  super = 7,
}

export enum DpResultType {
  tie = 0,
  dragon = 1,
  phoenix = 2,
  // 顺子赢
  straight = 3,
  // 同花赢
  flush = 4,
  // 同花顺赢
  straightFlush = 5,
  // 豹子赢
  threeKind = 6,
  // 9对-A对 赢
  pair = 7,
}

type DpCards = [number, number, number]

export type DpDetails = {
  d: DpCards
  p: DpCards
}

export function calWinLoseForDp (betDetails: Record<number, number>, hitRes: number[], totalBetMoney: number) {
  if (hitRes.includes(DpResultType.tie)) {
    return { rolling: 0, winLose: 0 }
  } else {
    let winLose = 0
    let dragonBet = 0
    let phoenixBet = 0
    for (const betKey in betDetails) {
      const betType = Number(betKey)
      const betAmount = betDetails[betKey]
      // 算输赢
      if (betType === DpBetType.dragon) {
        if (hitRes.includes(DpResultType.dragon)) {
          winLose += 0.95 * betAmount
        } else {
          winLose -= betAmount
        }
        dragonBet = betAmount
      } else if (betType === DpBetType.phoenix) {
        if (hitRes.includes(DpResultType.phoenix)) {
          winLose += 0.95 * betAmount
        } else {
          winLose -= betAmount
        }
        phoenixBet = betAmount
      } else if (betType === DpBetType.straight) {
        if (hitRes.includes(DpResultType.straight)) {
          winLose += 7 * betAmount
        } else {
          winLose -= betAmount
        }
      } else if (betType === DpBetType.flush) {
        if (hitRes.includes(DpResultType.flush)) {
          winLose += 8 * betAmount
        } else {
          winLose -= betAmount
        }
      } else if (betType === DpBetType.straightFlush) {
        if (hitRes.includes(DpResultType.straightFlush)) {
          winLose += 100 * betAmount
        } else {
          winLose -= betAmount
        }
      } else if (betType === DpBetType.threeKind) {
        if (hitRes.includes(DpResultType.threeKind)) {
          winLose += 120 * betAmount
        } else {
          winLose -= betAmount
        }
      } else if (betType === DpBetType.super) {
        if (hitRes.includes(DpResultType.pair)) {
          winLose += 1 * betAmount
        } else if (hitRes.includes(DpResultType.straight)) {
          winLose += 2 * betAmount
        } else if (hitRes.includes(DpResultType.flush)) {
          winLose += 3 * betAmount
        } else if (hitRes.includes(DpResultType.straightFlush)) {
          winLose += 5 * betAmount
        } else if (hitRes.includes(DpResultType.threeKind)) {
          winLose += 10 * betAmount
        } else {
          winLose -= betAmount
        }
      }
    }
    const rolling = totalBetMoney - dragonBet - phoenixBet + Math.abs(dragonBet - phoenixBet)
    return { rolling, winLose }
  }
}

function getPoint (cards: number[]) {
  return cards
    .map(v => {
      return v % 13 === 0 ? 13 : v % 13
    })
    .sort((a, b) => {
      return a - b
    })
}

export function parseDpResult (details: DpDetails) {
  const dCards = details.d
  const pCards = details.p
  const dP = getPoint(dCards)
  const pP = getPoint(pCards)
  const resArr = []
  const isDrThree = isThreeKind(dP)
  const isPhThree = isThreeKind(pP)

  if (isDrThree) {
    if (isPhThree) {
      // 双豹子
      if (dP[0] > pP[0]) {
        resArr.push(DpResultType.dragon, DpResultType.threeKind)
      } else {
        resArr.push(DpResultType.phoenix, DpResultType.threeKind)
      }
    } else {
      // 龙豹子,凤无
      if (is235(pCards, pP)) {
        resArr.push(DpResultType.phoenix)
      } else {
        // 龙豹子赢
        resArr.push(DpResultType.dragon, DpResultType.threeKind)
      }
    }
  } else {
    if (isPhThree) {
      if (is235(dCards, dP)) {
        resArr.push(DpResultType.dragon)
      } else {
        resArr.push(DpResultType.phoenix, DpResultType.threeKind)
      }
    } else {
      // 都没豹子,判断同花或者顺子
      const isDrFlush = isFlush(dCards)
      const isPhFlush = isFlush(pCards)
      const isDrStraight = isStraight(dP)
      const isPhStraight = isStraight(pP)
      if (isDrFlush) {
        if (isPhFlush) {
          // 双金花
          if (isDrStraight) {
            if (isPhStraight) {
              // 双同花顺
              if (dP[0] > pP[0]) {
                resArr.push(DpResultType.dragon, DpResultType.straight, DpResultType.flush, DpResultType.straightFlush)
              } else if (dP[0] < pP[0]) {
                resArr.push(DpResultType.phoenix, DpResultType.straight, DpResultType.flush, DpResultType.straightFlush)
              } else {
                // 一样的同花顺
                resArr.push(DpResultType.tie)
              }
            } else {
              resArr.push(DpResultType.dragon, DpResultType.straight, DpResultType.flush, DpResultType.straightFlush)
            }
          } else {
            if (isPhStraight) {
              resArr.push(DpResultType.phoenix, DpResultType.straight, DpResultType.flush, DpResultType.straightFlush)
            } else {
              // 都没同花顺,比较三张牌大小
              const res = checkByPoint(dP, pP)
              if (res === DpResultType.tie) {
                resArr.push(DpResultType.tie)
              } else {
                resArr.push(res, DpResultType.flush)
              }
            }
          }
        } else {
          resArr.push(DpResultType.dragon, DpResultType.flush)
        }
      } else {
        // 龙无金花,凤金花
        if (isPhFlush) {
          resArr.push(DpResultType.phoenix, DpResultType.flush)
        } else {
          // 再判断顺子
          if (isDrStraight) {
            if (isPhStraight) {
              // 判断是否 1qk
              if (dP[0] === 1 && dP[1] === 12) {
                if (pP[0] === 1 && pP[1] === 12) {
                  resArr.push(DpResultType.tie)
                } else {
                  resArr.push(DpResultType.dragon, DpResultType.straight)
                }
              } else {
                if (dP[0] > pP[0]) {
                  resArr.push(DpResultType.dragon, DpResultType.straight)
                } else {
                  resArr.push(DpResultType.phoenix, DpResultType.straight)
                }
              }
            } else {
              resArr.push(DpResultType.dragon, DpResultType.straight)
            }
          } else {
            if (isPhStraight) {
              resArr.push(DpResultType.phoenix, DpResultType.straight)
            } else {
              // 都没顺子,先判断对子
              const dPair = dP[0] === dP[1] || dP[1] === dP[2]
              const pPair = pP[0] === pP[1] || pP[1] === pP[2]
              if (dPair) {
                if (pPair) {
                  // 判断对子点数
                  if (dP[1] === 1) {
                    if (pP[1] === 1) {
                      // 判断第三张
                      if (dP[2] > pP[2]) {
                        resArr.push(DpResultType.dragon, DpResultType.pair)
                      } else if (dP[2] < pP[2]) {
                        resArr.push(DpResultType.phoenix, DpResultType.pair)
                      } else {
                        resArr.push(DpResultType.tie)
                      }
                    } else {
                      resArr.push(DpResultType.dragon, DpResultType.pair)
                    }
                  } else {
                    if (pP[1] === 1) {
                      resArr.push(DpResultType.phoenix, DpResultType.pair)
                    } else {
                      // 判断第三张
                      if (dP[1] > pP[1]) {
                        resArr.push(DpResultType.dragon)
                        if (dP[1] > 8) {
                          resArr.push(DpResultType.pair)
                        }
                      } else if (dP[1] < pP[1]) {
                        resArr.push(DpResultType.phoenix)
                        if (pP[1] > 8) {
                          resArr.push(DpResultType.pair)
                        }
                      } else {
                        // 判断第三张点数
                        const dOtherCard = getNoPairCard(dCards, dP[1])
                        const pOtherCard = getNoPairCard(pCards, pP[1])
                        if (dOtherCard === 1) {
                          if (pOtherCard === 1) {
                            resArr.push(DpResultType.tie)
                          } else {
                            resArr.push(DpResultType.dragon)
                          }
                        } else {
                          if (pOtherCard === 1) {
                            resArr.push(DpResultType.phoenix)
                          } else {
                            if (dOtherCard > pOtherCard) {
                              resArr.push(DpResultType.dragon)
                            } else if (dOtherCard < pOtherCard) {
                              resArr.push(DpResultType.phoenix)
                            } else {
                              resArr.push(DpResultType.tie)
                            }
                          }
                        }
                      }
                    }
                  }
                } else {
                  resArr.push(DpResultType.dragon)
                  if (dP[1] > 8 || dP[1] === 1) {
                    resArr.push(DpResultType.pair)
                  }
                }
              } else {
                if (pPair) {
                  resArr.push(DpResultType.phoenix)
                  if (pP[1] === 1 || pP[1] > 8) {
                    resArr.push(DpResultType.pair)
                  }
                } else {
                  // 都没对子,比较三张牌大小
                  resArr.push(checkByPoint(dP, pP))
                }
              }
            }
          }
        }
      }
    }
  }
  // 排序
  return resArr
}

function isThreeKind (points: number[]) {
  return points[0] === points[1] && points[0] === points[2]
}

function isSpade (x:number) {
  return x >= 1 && x <= 13
}

function isHeart (x:number) {
  return x >= 14 && x <= 26
}

function isClub (x:number) {
  return x >= 27 && x <= 39
}

function isDiamond (x:number) {
  return x >= 40 && x <= 52
}
// 同花
function isFlush (pokers: number[]) {
  const isSpadeFlush = pokers.every(isSpade)
  const isHeartFlush = pokers.every(isHeart)
  const isClubFlush = pokers.every(isClub)
  const isDiamondFlush = pokers.every(isDiamond)
  return isSpadeFlush || isHeartFlush || isClubFlush || isDiamondFlush
}

function is235 (pokers: number[], points: number[]) {
  if (isFlush(pokers)) {
    return false
  }
  return points[0] === 2 && points[1] === 3 && points[2] === 5
}

function isStraight (points: number[]) {
  return (points[1] - points[0] === 1 && points[2] - points[1] === 1) || (points[0] === 1 && points[1] === 12 && points[2] === 13)
}

function getNoPairCard (pokers: number[], pairPoint: number) {
  for (let i = 0; i < 3; i++) {
    const p = pokers[i] % 13 === 0 ? 13 : pokers[i] % 13
    if (p !== pairPoint) {
      return p
    }
  }
  // 确保总是返回一个数字
  throw new Error('No non-pair card found')
}

function checkByPoint (dP: number[], pP: number[]) {
  // 都没同花顺,比较三张牌大小
  if (dP[0] === 1) {
    if (pP[0] === 1) {
      // 反向比较大小
      if (dP[2] > pP[2]) {
        return DpResultType.dragon
      } else if (dP[2] < pP[2]) {
        return DpResultType.phoenix
      } else {
        // 比较第三张
        if (dP[1] > pP[1]) {
          return DpResultType.dragon
        } else if (dP[1] < pP[1]) {
          return DpResultType.phoenix
        } else {
          return DpResultType.tie
        }
      }
    } else {
      return DpResultType.dragon
    }
  } else {
    if (pP[0] === 1) {
      return DpResultType.phoenix
    } else {
      if (dP[2] > pP[2]) {
        return DpResultType.dragon
      } else if (dP[2] < pP[2]) {
        return DpResultType.phoenix
      } else {
        // 比较第二张
        if (dP[1] > pP[1]) {
          return DpResultType.dragon
        } else if (dP[1] < pP[1]) {
          return DpResultType.phoenix
        } else {
          // 比较第三张
          if (dP[0] > pP[0]) {
            return DpResultType.dragon
          } else if (dP[0] < pP[0]) {
            return DpResultType.phoenix
          } else {
            return DpResultType.tie
          }
        }
      }
    }
  }
}
