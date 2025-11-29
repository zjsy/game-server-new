export enum NNBetType {
  banker1 = 1,
  banker1Double,
  banker1Many,
  player1,
  player1Double,
  player1Many,
  banker2,
  banker2Double,
  banker2Many,
  player2,
  player2Double,
  player2Many,
  banker3,
  banker3Double,
  banker3Many,
  player3,
  player3Double,
  player3Many,
}

export enum BullResult {
  noBull = 0,
  point1 = 1,
  point2,
  point3,
  point4,
  point5,
  point6,
  point7,
  point8,
  point9,
  bullBull = 10,
  fiveFlower = 11,
}

type FixedNumberArray = [number, number, number, number, number]
// 0 无牛 1 -9 点数 10 牛牛 11 五花
export type BullDetails = {
  h: number;
  b: FixedNumberArray;
  bP: number;
  p1: FixedNumberArray;
  p1P: number;
  p2: FixedNumberArray;
  p2P: number;
  p3: FixedNumberArray;
  p3P: number;
}

export function calWinLoseForBull (betDetails: Record<number, number>, hitRes: number[], details: BullDetails) {
  let winLose = 0
  let rolling = 0 // 需要加的钱
  const bullOdds = 0.95
  for (const betKey in betDetails) {
    const betType = Number(betKey)
    const betAmount = betDetails[betKey]
    if (betType === NNBetType.banker1) {
      const res = hitRes[0]
      if (res === 1) {
        winLose += bullOdds * betAmount
      } else {
        winLose += -betAmount
      }
      rolling += betAmount
    } else if (betType === NNBetType.banker1Double) {
      const res = hitRes[0]
      if (res === 1) {
        if (details.bP < 7) {
          winLose += bullOdds * betAmount
          rolling += betAmount
        } else if (details.bP < 10) {
          winLose += bullOdds * 2 * betAmount
          rolling += 2 * betAmount
        } else if (details.bP === 10) {
          winLose += bullOdds * 3 * betAmount
          rolling += 3 * betAmount
        } else {
          winLose += bullOdds * 5 * betAmount
          rolling += 5 * betAmount
        }
      } else {
        // 输
        if (details.p1P < 7) {
          winLose += -betAmount
          rolling += betAmount
        } else if (details.p1P < 10) {
          winLose += -betAmount * 2
          rolling += 2 * betAmount
        } else if (details.p1P === 10) {
          winLose += -betAmount * 3
          rolling += 3 * betAmount
        } else {
          winLose += -betAmount * 5
          rolling += 5 * betAmount
        }
      }
    } else if (betType === NNBetType.banker1Many) {
      const res = hitRes[0]
      if (res === 1) {
        const times = details.bP - details.p1P > 1 ? details.bP - details.p1P : 1
        winLose += bullOdds * times * betAmount
        rolling += times * betAmount
      } else {
        const times = details.p1P - details.bP > 1 ? details.p1P - details.bP : 1
        winLose += -betAmount * times
        rolling += times * betAmount
      }
    } else if (betType === NNBetType.player1) {
      const res = hitRes[0]
      if (res === 0) {
        winLose += betAmount * bullOdds
      } else {
        winLose += -betAmount
      }
      rolling += betAmount
    } else if (betType === NNBetType.player1Double) {
      const res = hitRes[0]
      if (res === 0) {
        if (details.p1P < 7) {
          winLose += bullOdds * betAmount
          rolling += betAmount
        } else if (details.p1P < 10) {
          winLose += bullOdds * 2 * betAmount
          rolling += betAmount * 2
        } else if (details.p1P === 10) {
          winLose += bullOdds * 3 * betAmount
          rolling += betAmount * 3
        } else {
          winLose += bullOdds * 5 * betAmount
          rolling += betAmount * 5
        }
      } else {
        // 输
        if (details.bP < 7) {
          winLose += -betAmount
          rolling += betAmount
        } else if (details.bP < 10) {
          winLose += -betAmount * 2
          rolling += betAmount * 2
        } else if (details.bP === 10) {
          winLose += -betAmount * 3
          rolling += betAmount * 3
        } else {
          winLose += -betAmount * 5
          rolling += betAmount * 5
        }
      }
    } else if (betType === NNBetType.player1Many) {
      const res = hitRes[0]
      if (res === 0) {
        const times = details.p1P - details.bP > 1 ? details.p1P - details.bP : 1
        winLose += bullOdds * times * betAmount
        rolling += betAmount * times
      } else {
        const times = details.bP - details.p1P > 1 ? details.bP - details.p1P : 1
        winLose += -betAmount * times
        rolling += betAmount * times
      }
    } else if (betType === NNBetType.banker2) {
      const res = hitRes[1]
      if (res === 1) {
        winLose += bullOdds * betAmount
      } else {
        winLose += -betAmount
      }
      rolling += betAmount
    } else if (betType === NNBetType.banker2Double) {
      const res = hitRes[1]
      if (res === 1) {
        if (details.bP < 7) {
          winLose += bullOdds * betAmount
          rolling += betAmount
        } else if (details.bP < 10) {
          winLose += bullOdds * 2 * betAmount
          rolling += betAmount * 2
        } else if (details.bP === 10) {
          winLose += bullOdds * 3 * betAmount
          rolling += betAmount * 3
        } else {
          winLose += bullOdds * 5 * betAmount
          rolling += betAmount * 5
        }
      } else {
        // 输
        if (details.p2P < 7) {
          winLose += -betAmount
          rolling += betAmount
        } else if (details.p2P < 10) {
          winLose += -betAmount * 2
          rolling += betAmount * 2
        } else if (details.p2P === 10) {
          winLose += -betAmount * 3
          rolling += betAmount * 3
        } else {
          winLose += -betAmount * 5
          rolling += betAmount * 5
        }
      }
    } else if (betType === NNBetType.banker2Many) {
      const res = hitRes[1]
      if (res === 1) {
        const times = details.bP - details.p2P > 1 ? details.bP - details.p2P : 1
        winLose += bullOdds * times * betAmount
        rolling += betAmount * times
      } else {
        const times = details.p2P - details.bP > 1 ? details.p2P - details.bP : 1
        winLose += -betAmount * times
        rolling += betAmount * times
      }
    } else if (betType === NNBetType.player2) {
      const res = hitRes[1]
      if (res === 0) {
        winLose += bullOdds * betAmount
      } else {
        winLose += -betAmount
      }
      rolling += betAmount
    } else if (betType === NNBetType.player2Double) {
      const res = hitRes[1]
      if (res === 0) {
        if (details.p2P < 7) {
          winLose += bullOdds * betAmount
          rolling += betAmount
        } else if (details.p2P < 10) {
          winLose += bullOdds * 2 * betAmount
          rolling += betAmount * 2
        } else if (details.p2P === 10) {
          winLose += bullOdds * 3 * betAmount
          rolling += betAmount * 3
        } else {
          winLose += bullOdds * 5 * betAmount
          rolling += betAmount * 5
        }
      } else {
        // 输
        if (details.bP < 7) {
          winLose += -betAmount
          rolling += betAmount
        } else if (details.bP < 10) {
          winLose += -betAmount * 2
          rolling += betAmount * 2
        } else if (details.bP === 10) {
          winLose += -betAmount * 3
          rolling += betAmount * 3
        } else {
          winLose += -betAmount * 5
          rolling += betAmount * 5
        }
      }
    } else if (betType === NNBetType.player2Many) {
      const res = hitRes[1]
      if (res === 0) {
        const times = details.p2P - details.bP > 1 ? details.p2P - details.bP : 1
        winLose += bullOdds * times * betAmount
        rolling += betAmount * times
      } else {
        const times = details.bP - details.p2P > 1 ? details.bP - details.p2P : 1
        winLose += -betAmount * times
        rolling += betAmount * times
      }
    } else if (betType === NNBetType.banker3) {
      const res = hitRes[2]
      if (res === 1) {
        winLose += bullOdds * betAmount
      } else {
        winLose += -betAmount
      }
      rolling += betAmount
    } else if (betType === NNBetType.banker3Double) {
      const res = hitRes[2]
      if (res === 1) {
        if (details.bP < 7) {
          winLose += bullOdds * betAmount
          rolling += betAmount
        } else if (details.bP < 10) {
          winLose += bullOdds * 2 * betAmount
          rolling += betAmount * 2
        } else if (details.bP === 10) {
          winLose += bullOdds * 3 * betAmount
          rolling += betAmount * 3
        } else {
          winLose += bullOdds * 5 * betAmount
          rolling += betAmount * 5
        }
      } else {
        // 输
        if (details.p3P < 7) {
          winLose += -betAmount
          rolling += betAmount
        } else if (details.p3P < 10) {
          winLose += -betAmount * 2
          rolling += betAmount * 2
        } else if (details.p3P === 10) {
          winLose += -betAmount * 3
          rolling += betAmount * 3
        } else {
          winLose += -betAmount * 5
          rolling += betAmount * 5
        }
      }
    } else if (betType === NNBetType.banker3Many) {
      const res = hitRes[2]
      if (res === 1) {
        const times = details.bP - details.p3P > 1 ? details.bP - details.p3P : 1
        winLose += bullOdds * times * betAmount
        rolling += betAmount * times
      } else {
        const times = details.p3P - details.bP > 1 ? details.p3P - details.bP : 1
        winLose += -betAmount * times
        rolling += betAmount * times
      }
    } else if (betType === NNBetType.player3) {
      const res = hitRes[2]
      if (res === 0) {
        winLose += bullOdds * betAmount
      } else {
        winLose += -betAmount
      }
      rolling += betAmount
    } else if (betType === NNBetType.player3Double) {
      const res = hitRes[2]
      if (res === 0) {
        if (details.p3P < 7) {
          winLose += bullOdds * betAmount
          rolling += betAmount
        } else if (details.p3P < 10) {
          winLose += bullOdds * 2 * betAmount
          rolling += betAmount * 2
        } else if (details.p3P === 10) {
          winLose += bullOdds * 3 * betAmount
          rolling += betAmount * 3
        } else {
          winLose += bullOdds * 5 * betAmount
          rolling += betAmount * 5
        }
      } else {
        // 输
        if (details.bP < 7) {
          winLose += -betAmount
          rolling += betAmount
        } else if (details.bP < 10) {
          winLose += -betAmount * 2
          rolling += betAmount * 2
        } else if (details.bP === 10) {
          winLose += -betAmount * 3
          rolling += betAmount
        } else {
          winLose += -betAmount * 5
          rolling += betAmount * 5
        }
      }
    } else if (betType === NNBetType.player3Many) {
      const res = hitRes[2]
      if (res === 0) {
        const times = details.p3P - details.bP > 1 ? details.p3P - details.bP : 1
        winLose += bullOdds * betAmount * times
        rolling += betAmount * times
      } else {
        const times = details.bP - details.p3P > 1 ? details.bP - details.p3P : 1
        winLose += -betAmount * times
        rolling += betAmount * times
      }
    }
  }
  return { winLose, rolling }
}

// export function getBullOddsForLimit (betType:NNBetType):number {
//   if (betType % 3 === 0) {
//     return 5
//   } else if (betType % 3 === 1) {
//     return 1
//   } else {
//     return 2
//   }
// }
