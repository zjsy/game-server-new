export type SeDieValue = 0 | 1 | 2 | 3 | 4
export type seDieDetails = { rc: SeDieValue }

export enum SeDieBetType {
  big = 1,
  small = 2,
  odd = 3,
  even = 4,
  fourRed,
  fourWhite,
  threeRed,
  threeWhite,
}

// 默认的赔率
export const SeDieOdds = {
  1: 0.96,
  2: 0.96,
  3: 0.96,
  4: 0.96,
  5: 12,
  6: 12,
  7: 2.6,
  8: 2.6,
}

export function generateSeDieResult (redCount: number) {
  const hits: SeDieBetType[] = []
  if (redCount === 0) {
    hits.push(SeDieBetType.small, SeDieBetType.even, SeDieBetType.fourWhite)
  } else if (redCount === 1) {
    hits.push(SeDieBetType.small, SeDieBetType.odd, SeDieBetType.threeWhite)
  } else if (redCount === 2) {
    hits.push(SeDieBetType.even)
  } else if (redCount === 3) {
    hits.push(SeDieBetType.big, SeDieBetType.odd, SeDieBetType.threeRed)
  } else {
    hits.push(SeDieBetType.big, SeDieBetType.even, SeDieBetType.fourRed)
  }
  return hits
}

export function getSeDieOdds (betType: SeDieBetType) {
  return SeDieOdds[betType]
}

// 2红2白下大小不算输赢,退回
export function calWinLoseForSeDie (betDetails: Record<string, number>, hitRes: SeDieBetType[]) {
  let winLose = 0
  for (const betKey in betDetails) {
    const betType = Number(betKey)
    const betAmount = betDetails[betKey]
    if (betType === SeDieBetType.big) {
      if (hitRes.includes(SeDieBetType.big)) {
        winLose += betAmount * getSeDieOdds(betType)
      } else if (hitRes.includes(SeDieBetType.small)) {
        winLose -= betAmount
      }// 2红2白不算输赢,winLose不变
    } else if (betType === SeDieBetType.small) {
      if (hitRes.includes(SeDieBetType.small)) {
        winLose += betAmount * getSeDieOdds(betType)
      } else if (hitRes.includes(SeDieBetType.big)) {
        winLose -= betAmount
      }
    } else {
      if (hitRes.includes(betType)) {
        winLose += betAmount * getSeDieOdds(betType)
      } else {
        winLose -= betAmount
      }
    }
  }
  return winLose
}

// export function calRollingForSeDie (totalBet:number, betDetails: Record<string, number>, hitRes:SeDieBetType[]) {
//   const bigBet = betDetails[SeDieBetType.big] ? betDetails[SeDieBetType.big] : 0
//   const smallBet = betDetails[SeDieBetType.small] ? betDetails[SeDieBetType.small] : 0
//   const evenBet = betDetails[SeDieBetType.even] ? betDetails[SeDieBetType.even] : 0
//   const oddBet = betDetails[SeDieBetType.odd] ? betDetails[SeDieBetType.odd] : 0
//   return totalBet -
//             bigBet -
//             smallBet -
//             evenBet -
//             oddBet +
//             Math.abs(bigBet - smallBet) +
//             Math.abs(evenBet - oddBet)
// }

// const SeDieLimitOdds = {
//   1: 1,
//   2: 1,
//   3: 1,
//   4: 1,
//   5: 5,
//   6: 5,
//   7: 2.5,
//   8: 2.5,
// }

// export function getSeDieOddsForLimit (betType: SeDieBetType) {
//   return SeDieLimitOdds[betType]
// }
