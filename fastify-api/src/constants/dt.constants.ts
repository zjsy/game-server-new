// 龙虎 1 龙  2 和 3虎 4龙单 5龙双 6龙红 7龙黑 8虎单  09虎双 10虎红 11虎黑
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

const DtOdds: { [key: number]: number } = {
  1: 1,
  2: 8,
  3: 1,
  4: 0.75,
  5: 1.05,
  6: 0.9,
  7: 0.9,
  8: 0.75,
  9: 1.05,
  10: 0.9,
  11: 0.9,
}

export function getDtOdds (betType: DTBetType) {
  return DtOdds[betType]
}

const DtLimitOdds: { [key: number]: number } = {
  1: 1,
  2: 8,
  3: 1,
  4: 1,
  5: 1,
  6: 1,
  7: 1,
  8: 1,
  9: 1,
  10: 1,
  11: 1,
}

export function getDtOddsForlimit (betType: DTBetType) {
  return DtLimitOdds[betType]
}

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
