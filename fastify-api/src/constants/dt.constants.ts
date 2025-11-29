export type DtDetails = {
  d: number;
  t: number;
}
export enum DTBetType {
  dragon = 1,
  tie,
  tiger,
  dragonOdd,
  dragonEven,
  dragonRed,
  dragonBlack,
  tigerOdd,
  tigerEven,
  tigerRed,
  tigerBlack,
}

const DtOdds: Record<DTBetType, number> = {
  [DTBetType.dragon]: 1,
  [DTBetType.tie]: 8,
  [DTBetType.tiger]: 1,
  [DTBetType.dragonOdd]: 0.75,
  [DTBetType.dragonEven]: 1.05,
  [DTBetType.dragonRed]: 0.9,
  [DTBetType.dragonBlack]: 0.9,
  [DTBetType.tigerOdd]: 0.75,
  [DTBetType.tigerEven]: 1.05,
  [DTBetType.tigerRed]: 0.9,
  [DTBetType.tigerBlack]: 0.9,
}

export function getDtOdds (betType: DTBetType) {
  return DtOdds[betType]
}

// const DtLimitOdds: { [key: number]: number } = {
//   1: 1,
//   2: 8,
//   3: 1,
//   4: 1,
//   5: 1,
//   6: 1,
//   7: 1,
//   8: 1,
//   9: 1,
//   10: 1,
//   11: 1,
// }

// export function getDtOddsForLimit (betType: DTBetType) {
//   return DtLimitOdds[betType]
// }

export function parseDtResult (details: { d: number; t: number }) {
  const dragon = details.d
  const tiger = details.t
  const dragonPoint = dragon % 13 === 0 ? 13 : dragon % 13
  const tigerPoint = tiger % 13 === 0 ? 13 : tiger % 13
  const resArr = []
  if (dragonPoint > tigerPoint) {
    resArr.push(1)
  } else if (dragonPoint === tigerPoint) {
    resArr.push(2)
  } else {
    resArr.push(3)
  }
  if (dragonPoint % 2 === 0) {
    resArr.push(5)
  } else {
    resArr.push(4)
  }
  if (dragon < 14 || (dragon > 26 && dragon < 40)) {
    resArr.push(7)
  } else {
    resArr.push(6)
  }
  if (tigerPoint % 2 === 0) {
    resArr.push(9)
  } else {
    resArr.push(8)
  }
  if (tiger < 14 || (tiger > 26 && tiger < 40)) {
    resArr.push(11)
  } else {
    resArr.push(10)
  }
  return resArr
}

export function calWinLoseForDt (betDetails: Record<string, number>, hitRes:number[]) {
  let winLose = 0
  for (const betKey in betDetails) {
    const betType = Number(betKey)
    const betAmount = betDetails[betKey]
    // 算输赢
    if (betType === DTBetType.dragon) {
      if (hitRes.includes(DTBetType.dragon)) {
        winLose += betAmount
      } else if (hitRes.includes(DTBetType.tiger)) {
        winLose -= betAmount
      } else if (hitRes.includes(DTBetType.tie)) {
        winLose -= betAmount * 0.5
      }
    } else if (betType === DTBetType.tiger) {
      if (hitRes.includes(DTBetType.tiger)) {
        winLose += betAmount
      } else if (hitRes.includes(DTBetType.dragon)) {
        winLose -= betAmount
      } else if (hitRes.includes(DTBetType.tie)) {
        winLose -= betAmount * 0.5
      }
    } else {
      if (hitRes.includes(betType)) {
        winLose += betAmount * getDtOdds(betType) + betAmount
      } else {
        winLose -= betAmount
      }
    }
  }
  return winLose
}

export function calRollingForDt (totalBet:number, betDetails: Record<string, number>, hitRes:number[]) {
  const dragonBet = betDetails[DTBetType.dragon] ? betDetails[DTBetType.dragon] : 0
  const tigerBet = betDetails[DTBetType.tiger] ? betDetails[DTBetType.tiger] : 0
  if (hitRes.includes(DTBetType.tie)) {
    return totalBet - dragonBet - tigerBet + 0.5 * Math.abs(dragonBet - tigerBet)
  } else {
    return totalBet - dragonBet - tigerBet + Math.abs(dragonBet - tigerBet)
  }
}
