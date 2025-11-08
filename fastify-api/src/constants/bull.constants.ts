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

export function getBullOddsForLimit (betType) {
  if (betType % 3 === 0) {
    return 5
  } else if (betType % 3 === 1) {
    return 1
  } else {
    return 2
  }
}
