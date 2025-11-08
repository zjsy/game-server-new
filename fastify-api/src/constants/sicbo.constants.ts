export enum SicboBetType {
  // 大小单双1:1 遇围骰庄家通吃
  big = 1,
  small,
  // 总点数为 5, 7, 9, 11, 13, 15, 17 点 ( 遇围骰庄家通吃 )
  odd,
  // 总点数为 4, 6, 8, 10, 12, 14, 16 点 ( 遇围骰庄家通吃 )
  even,
  // 全围 1:30
  anyTriple,
  // 围骰 (1:：180)
  specificTriples1,
  specificTriples2,
  specificTriples3,
  specificTriples4,
  specificTriples5,
  specificTriples6,
  // 三军(单骰1：1 双1:2 全1：3)
  threeForces1,
  threeForces2,
  threeForces3,
  threeForces4,
  threeForces5,
  threeForces6,
  // 对子(1 赔 10)
  pairs1,
  pairs2,
  pairs3,
  pairs4,
  pairs5,
  pairs6,
  // 牌九式 (1 赔 5)
  zuhe12,
  zuhe13,
  zuhe14,
  zuhe15,
  zuhe16,
  zuhe23,
  zuhe24,
  zuhe25,
  zuhe26,
  zuhe34,
  zuhe35,
  zuhe36,
  zuhe45,
  zuhe46,
  zuhe56,
  // 1:60
  point4,
  point17,
  // 1:30
  point5,
  point16,
  // 1:17
  point6,
  point15,
  // 1:12
  point7,
  point14,
  // 1:8
  point8,
  point13,
  // 1:6
  point9,
  point10,
  point11,
  point12,
}

const SicboOdds: { [key: number]: number } = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 30,
  6: 180,
  7: 180,
  8: 180,
  9: 180,
  10: 180,
  11: 180,
  // 三军重新处理
  18: 10,
  19: 10,
  20: 10,
  21: 10,
  22: 10,
  23: 10,
  24: 5,
  25: 5,
  26: 5,
  27: 5,
  28: 5,
  29: 5,
  30: 5,
  31: 5,
  32: 5,
  33: 5,
  34: 5,
  35: 5,
  36: 5,
  37: 5,
  38: 5,
  // 点数
  39: 60,
  40: 60,
  41: 30,
  42: 30,
  43: 17,
  44: 17,
  45: 12,
  46: 12,
  47: 8,
  48: 8,
  49: 6,
  50: 6,
  51: 6,
  52: 6,
}

export function getSicboOdds (betType: SicboBetType, dices: []) {
  if (betType < 12 || betType > 17) {
    return SicboOdds[betType]
  } else {
    // 根据什么军判断倍率
    let odd = 0
    switch (betType) {
      case 12:
        odd = getDiceCount(1, dices)
        break
      case 13:
        odd = getDiceCount(2, dices)
        break
      case 14:
        odd = getDiceCount(3, dices)
        break
      case 15:
        odd = getDiceCount(4, dices)
        break
      case 16:
        odd = getDiceCount(5, dices)
        break
      case 17:
        odd = getDiceCount(6, dices)
        break
      default:
    }
    // 倍率刚好是123,所以直接返回命中次数
    return odd
  }
}

export function getSicboOddsForLimit (betType: SicboBetType) {
  if (betType < 12 || betType > 17) {
    return SicboOdds[betType]
  } else {
    return 1
  }
}

// 这里初始化一个map,提前计算好56种结果的命中 56种结果 A(6,1) + A(6,2) + C(6,3)
// 顺序必须从小到大, 数组可以写原始的枚举类型，但是太长了，现在这样写很容易出错。。。。，
// TODO:后续至少核对一遍
const sicboResMap = new Map([
  ['111', [5, 6, 12, 18]],
  ['222', [5, 7, 13, 19, 43]],
  ['333', [5, 8, 14, 20, 49]],
  ['444', [5, 9, 15, 21, 52]],
  ['555', [5, 10, 16, 22, 44]],
  ['666', [5, 11, 17, 23]],
  ['112', [2, 4, 12, 13, 18, 24, 39]],
  ['113', [2, 3, 12, 14, 18, 25, 41]],
  ['114', [2, 4, 12, 15, 18, 26, 43]],
  ['115', [2, 3, 12, 16, 18, 27, 45]],
  ['116', [2, 4, 12, 17, 18, 28, 47]],
  ['122', [2, 3, 12, 13, 19, 24, 41]],
  ['223', [2, 3, 13, 14, 19, 29, 45]],
  ['224', [2, 4, 13, 15, 19, 30, 47]],
  ['225', [2, 3, 13, 16, 19, 31, 49]],
  ['226', [2, 4, 13, 17, 19, 32, 50]],
  ['133', [2, 3, 12, 14, 20, 25, 45]],
  ['233', [2, 4, 13, 14, 20, 29, 47]],
  ['334', [2, 4, 14, 15, 20, 33, 50]],
  ['335', [1, 3, 14, 16, 20, 34, 51]],
  ['336', [1, 4, 14, 17, 20, 35, 52]],
  ['144', [2, 3, 12, 15, 21, 26, 49]],
  ['244', [2, 4, 13, 15, 21, 30, 50]],
  ['344', [1, 3, 14, 15, 21, 33, 51]],
  ['445', [1, 3, 15, 16, 21, 36, 48]],
  ['446', [1, 4, 15, 17, 21, 37, 46]],
  ['155', [1, 3, 12, 16, 22, 27, 51]],
  ['255', [1, 4, 13, 16, 22, 31, 52]],
  ['355', [1, 3, 14, 16, 22, 34, 48]],
  ['455', [1, 4, 15, 16, 22, 36, 46]],
  ['556', [1, 4, 16, 17, 22, 38, 42]],
  ['166', [1, 3, 12, 17, 23, 28, 48]],
  ['266', [1, 4, 13, 17, 23, 32, 46]],
  ['366', [1, 3, 14, 17, 23, 35, 44]],
  ['466', [1, 4, 15, 17, 23, 37, 42]],
  ['566', [1, 3, 16, 17, 23, 38, 40]],
  ['123', [2, 4, 12, 13, 14, 24, 25, 29, 43]],
  ['124', [2, 3, 12, 13, 15, 24, 26, 30, 45]],
  ['125', [2, 4, 12, 13, 16, 24, 27, 31, 47]],
  ['126', [2, 3, 12, 13, 17, 24, 28, 32, 49]],
  ['134', [2, 4, 12, 14, 15, 25, 26, 33, 47]],
  ['135', [2, 3, 12, 14, 16, 25, 27, 34, 49]],
  ['136', [2, 4, 12, 14, 17, 25, 28, 35, 50]],
  ['145', [2, 4, 12, 15, 16, 26, 27, 36, 50]],
  ['146', [1, 3, 12, 15, 17, 26, 28, 37, 51]],
  ['156', [1, 4, 12, 16, 17, 27, 28, 38, 52]],
  ['234', [2, 3, 13, 14, 15, 29, 30, 33, 49]],
  ['235', [2, 4, 13, 14, 16, 29, 31, 34, 50]],
  ['236', [1, 3, 13, 14, 17, 29, 32, 35, 51]],
  ['245', [1, 3, 13, 15, 16, 30, 31, 36, 51]],
  ['246', [1, 4, 13, 15, 17, 30, 32, 37, 52]],
  ['256', [1, 3, 13, 16, 17, 31, 32, 38, 48]],
  ['345', [1, 4, 14, 15, 16, 33, 34, 36, 52]],
  ['346', [1, 3, 14, 15, 17, 33, 35, 37, 48]],
  ['356', [1, 4, 14, 16, 17, 34, 35, 38, 46]],
  ['456', [1, 3, 15, 16, 17, 36, 37, 38, 44]],
  // [
  //     '456',
  //     [
  //         SicboBetType.big,
  //         SicboBetType.odd,
  //         SicboBetType.threeForces4,
  //         SicboBetType.threeForces5,
  //         SicboBetType.threeForces6,
  //         SicboBetType.zuhe45,
  //         SicboBetType.zuhe46,
  //         SicboBetType.zuhe56,
  //         SicboBetType.point15,
  //     ],
  // ],
])

export function getSicboRes (key: string) {
  return sicboResMap.get(key)
}

// 1-6点数
export function getDiceCount (num: number, dices: number[]) {
  return dices.reduce((count, item) => {
    if (num === item) {
      return count + 1
    } else {
      return count
    }
  }, 0)
}
