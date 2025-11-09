/**
 * 色碟赔率
 */
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

export function getSedieOdds (betType: SeDieBetType) {
  return SeDieOdds[betType]
}

const SeDieLimitOdds = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 5,
  6: 5,
  7: 2.5,
  8: 2.5,
}
export function getSedieOddsForLimit (betType: SeDieBetType) {
  return SeDieLimitOdds[betType]
}
