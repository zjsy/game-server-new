import { DiceValue } from './sicbo.constants.js'

export type FastSicBoDetails = {
  d: DiceValue;
}

export enum FastSicBoBetType {
  big = 1,
  small = 2,
  odd = 3,
  even = 4,
  dice1 = 5,
  dice2 = 6,
  dice3 = 7,
  dice4 = 8,
  dice5 = 9,
  dice6 = 10,
}

const FastSicBoOdds: Record<FastSicBoBetType, number> = {
  [FastSicBoBetType.big]: 0.95,
  [FastSicBoBetType.small]: 0.95,
  [FastSicBoBetType.odd]: 0.95,
  [FastSicBoBetType.even]: 0.95,
  [FastSicBoBetType.dice1]: 4.75,
  [FastSicBoBetType.dice2]: 4.75,
  [FastSicBoBetType.dice3]: 4.75,
  [FastSicBoBetType.dice4]: 4.75,
  [FastSicBoBetType.dice5]: 4.75,
  [FastSicBoBetType.dice6]: 4.75,
}

export function getFastSicBoOdds (betType: FastSicBoBetType) {
  return FastSicBoOdds[betType]
}

export function calWinLoseForFastSicBo (betDetails: Record<string, number>, hitRes: number[]) {
  let winLose = 0
  for (const betKey in betDetails) {
    const betType = Number(betKey)
    const betAmount = betDetails[betKey]
    if (hitRes.includes(betType)) {
      winLose += betAmount * getFastSicBoOdds(betType) + betAmount
    } else {
      winLose -= betAmount
    }
  }
  return winLose
}

export function parseFastSicBoResult (res: number) {
  const resArr = []
  if (res < 4) {
    resArr.push(FastSicBoBetType.small)
  } else {
    resArr.push(FastSicBoBetType.big)
  }
  if (res % 2 === 0) {
    resArr.push(FastSicBoBetType.even)
  } else {
    resArr.push(FastSicBoBetType.odd)
  }
  resArr.push(res + 4)
  return resArr
}
