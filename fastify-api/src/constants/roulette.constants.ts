export type rouletteDetails = {
  n: number;
}

export enum RouletteBetType {
  // 1:1
  red = 1, // 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
  black, // 2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35
  odd,
  even,
  small, // 1-18
  big, // 19-36
  // 打注 1 ：2
  dozen1, // 1-12
  dozen2, // 13-24
  dozen3, // 25,26
  // 行注 1:2
  row1, // 1,4,7,10,13,16,19,22,25,28,31,34
  row2, // 2,5,8,11,14,17,20,23,26,29,32,35
  row3, // 3,6,9,12,15,18,21,24,27,30,33,36
  // 线注 1:5
  line_010203040506, // 1-6
  line_040506070809, // 4-9,
  line_070809101112, // 7-12
  line_101112131415, // 10-15
  line_131415161718, // 13-18
  line_161718192021, // 16-21
  line_192021222324, // 19-24
  line_222324252627, // 22-27
  line_252627282930, // 25-30
  line_282930313233, // 28-33
  line_313233343536, // 31-36

  // 角注 1:8
  angle_01020405, // 1,2,4,5
  angle_02030506, // 2,3,5,6
  angle_04050708, // 4,5,7,8
  angle_05060809, // 5,6,8,9
  angle_07081011, // 7,8,10,11,
  angle_08091112, // 8,9,11,12
  angle_10111314, // 10,11,13,14
  angle_11121415, // 11,12,14,15
  angle_13141617, // 13,14,16,17
  angle_14151718, // 14,15,17,18
  angle_16171920, // 16,17,19,20
  angle_17182021, // 17,18,20,21
  angle_19202223, // 19,20,22,23
  angle_20212324, // 20,21,23,24
  angle_22232526, // 22,23,25,26,
  angle_23242627, // 23,24,26,27
  angle_25262829, // 25,26,28,29
  angle_26272930, // 26,27,29,30
  angle_28293132, // 28,29,31,32
  angle_29303233, // 29,30,32,33
  angle_31323435, // 31,32,34,35
  angle_32333536, // 32,33,35,36
  // 0,1,2,3
  four_00010203,
  // 街注 1:11
  street_010203, // 1,2,3
  street_040506, // 4,5,6
  street_070809, // 7,8,9,
  street_101112, // 10,11,12
  street_131415, // 13,14,15
  street_161718, // 16,17,18
  street_192021, // 19,20,21
  street_222324, // 22,23,24
  street_252627, // 25,26,27
  street_282930, // 28,29,30
  street_313233, // 31,32,33
  street_343536, // 34,35,36
  three_000102, // 0,1,2
  three_000203, // 0,2,3

  // 分注 1:17 2个号码,投注于两个号码之间的格线上 。如2和3）
  separate_0001, // 0,1
  separate_0002, // 0,2
  separate_0003, // 0,3
  separate_0102, // 1,2
  separate_0203, // 2,3
  separate_0104,
  separate_0205,
  separate_0306,
  separate_0405, // 4,5
  separate_0506, // 5,6
  separate_0407,
  separate_0508,
  separate_0609,
  separate_0708, // 7,8
  separate_0809, // 8,9
  separate_0710,
  separate_0811,
  separate_0912,
  separate_1011, // 10,11
  separate_1112, // 11,12
  separate_1013,
  separate_1114,
  separate_1215,
  separate_1314, // 13,14
  separate_1415, // 14,15
  separate_1316,
  separate_1417,
  separate_1518,
  separate_1617, // 16,17
  separate_1718, // 17,18
  separate_1619,
  separate_1720,
  separate_1821,
  separate_1920, // 19,20
  separate_2021, // 20,21
  separate_1922,
  separate_2023,
  separate_2124,
  separate_2223, // 22,23
  separate_2324, // 23,24
  separate_2225,
  separate_2326,
  separate_2427,
  separate_2526, // 25,26
  separate_2627, // 26,27
  separate_2528,
  separate_2629,
  separate_2730,
  separate_2829, // 28,29
  separate_2930, // 29,30
  separate_2831,
  separate_2932,
  separate_3033,
  separate_3132, // 31,32
  separate_3233, // 32,33
  separate_3134,
  separate_3235,
  separate_3336,
  separate_3435, // 34,35
  separate_3536, // 35,36
  // 直接命中 1:35
  direct_00,
  direct_01,
  direct_02,
  direct_03,
  direct_04,
  direct_05,
  direct_06,
  direct_07,
  direct_08,
  direct_09,
  direct_10,
  direct_11,
  direct_12,
  direct_13,
  direct_14,
  direct_15,
  direct_16,
  direct_17,
  direct_18,
  direct_19,
  direct_20,
  direct_21,
  direct_22,
  direct_23,
  direct_24,
  direct_25,
  direct_26,
  direct_27,
  direct_28,
  direct_29,
  direct_30,
  direct_31,
  direct_32,
  direct_33,
  direct_34,
  direct_35,
  direct_36,
}

const RouletteOdds: { [key: number]: number } = {
  // 直接命中 1:35
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 1,
  6: 1,
  7: 2,
  8: 2,
  9: 2,
  10: 2,
  11: 2,
  12: 2,
  13: 5,
  14: 5,
  15: 5,
  16: 5,
  17: 5,
  18: 5,
  19: 5,
  20: 5,
  21: 5,
  22: 5,
  23: 5,
  24: 8,
  25: 8,
  26: 8,
  27: 8,
  28: 8,
  29: 8,
  30: 8,
  31: 8,
  32: 8,
  33: 8,
  34: 8,
  35: 8,
  36: 8,
  37: 8,
  38: 8,
  39: 8,
  40: 8,
  41: 8,
  42: 8,
  43: 8,
  44: 8,
  45: 8,
  46: 8,
  47: 11,
  48: 11,
  49: 11,
  50: 11,
  51: 11,
  52: 11,
  53: 11,
  54: 11,
  55: 11,
  56: 11,
  57: 11,
  58: 11,
  59: 11,
  60: 11,
  61: 17,
  62: 17,
  63: 17,
  64: 17,
  65: 17,
  66: 17,
  67: 17,
  68: 17,
  69: 17,
  70: 17,
  71: 17,
  72: 17,
  73: 17,
  74: 17,
  75: 17,
  76: 17,
  77: 17,
  78: 17,
  79: 17,
  80: 17,
  81: 17,
  82: 17,
  83: 17,
  84: 17,
  85: 17,
  86: 17,
  87: 17,
  88: 17,
  89: 17,
  90: 17,
  91: 17,
  92: 17,
  93: 17,
  94: 17,
  95: 17,
  96: 17,
  97: 17,
  98: 17,
  99: 17,
  100: 17,
  101: 17,
  102: 17,
  103: 17,
  104: 17,
  105: 17,
  106: 17,
  107: 17,
  108: 17,
  109: 17,
  110: 17,
  111: 17,
  112: 17,
  113: 17,
  114: 17,
  115: 17,
  116: 17,
  117: 17,
  118: 17,
  119: 17,
  120: 17,
  121: 35,
  122: 35,
  123: 35,
  124: 35,
  125: 35,
  126: 35,
  127: 35,
  128: 35,
  129: 35,
  130: 35,
  131: 35,
  132: 35,
  133: 35,
  134: 35,
  135: 35,
  136: 35,
  137: 35,
  138: 35,
  139: 35,
  140: 35,
  141: 35,
  142: 35,
  143: 35,
  144: 35,
  145: 35,
  146: 35,
  147: 35,
  148: 35,
  149: 35,
  150: 35,
  151: 35,
  152: 35,
  153: 35,
  154: 35,
  155: 35,
  156: 35,
  157: 35,
}

export function getRouletteOdds (betType: RouletteBetType) {
  return RouletteOdds[betType]
}

const rouletteResMap = new Map([
  [0, [46, 59, 60, 61, 62, 63, 121]],
  [1, [1, 3, 5, 7, 10, 13, 24, 46, 47, 59, 61, 64, 66, 122]],
  [2, [2, 4, 5, 7, 11, 13, 24, 25, 46, 47, 59, 60, 62, 64, 65, 67, 123]],
  [3, [1, 3, 5, 7, 12, 13, 25, 46, 47, 60, 63, 65, 68, 124]],
  [4, [2, 4, 5, 7, 10, 13, 14, 24, 26, 48, 66, 69, 71, 125]],
  [5, [1, 3, 5, 7, 11, 13, 14, 24, 25, 26, 27, 48, 67, 69, 70, 72, 126]],
  [6, [2, 4, 5, 7, 12, 13, 14, 25, 27, 48, 68, 70, 73, 127]],
  [7, [1, 3, 5, 7, 10, 14, 15, 26, 28, 49, 71, 74, 76, 128]],
  [8, [2, 4, 5, 7, 11, 14, 15, 26, 27, 28, 29, 49, 72, 74, 75, 77, 129]],
  [9, [1, 3, 5, 7, 12, 14, 15, 27, 29, 49, 73, 75, 78, 130]],
  [10, [2, 4, 5, 7, 10, 15, 16, 28, 30, 50, 76, 79, 81, 131]],
  [11, [2, 3, 5, 7, 11, 15, 16, 28, 29, 30, 31, 50, 77, 79, 80, 82, 132]],
  [12, [1, 4, 5, 7, 12, 15, 16, 29, 31, 50, 78, 80, 83, 133]],
  [13, [2, 3, 5, 8, 10, 16, 17, 30, 32, 51, 81, 84, 86, 134]],
  [14, [1, 4, 5, 8, 11, 16, 17, 30, 31, 32, 33, 51, 82, 84, 85, 87, 135]],
  [15, [2, 3, 5, 8, 12, 16, 17, 31, 33, 51, 83, 85, 88, 136]],
  [16, [1, 4, 5, 8, 10, 17, 18, 32, 34, 52, 86, 89, 91, 137]],
  [17, [2, 3, 5, 8, 11, 17, 18, 32, 33, 34, 35, 52, 87, 89, 90, 92, 138]],
  [18, [1, 4, 5, 8, 12, 17, 18, 33, 35, 52, 88, 90, 93, 139]],
  [19, [1, 3, 6, 8, 10, 18, 19, 34, 36, 53, 91, 94, 96, 140]],
  [20, [2, 4, 6, 8, 11, 18, 19, 34, 35, 36, 37, 53, 92, 94, 95, 97, 141]],
  [21, [1, 3, 6, 8, 12, 18, 19, 35, 37, 53, 93, 95, 98, 142]],
  [22, [2, 4, 6, 8, 10, 19, 20, 36, 38, 54, 96, 99, 101, 143]],
  [23, [1, 3, 6, 8, 11, 19, 20, 36, 37, 38, 39, 54, 97, 99, 100, 102, 144]],
  [24, [2, 4, 6, 8, 12, 19, 20, 37, 39, 54, 98, 100, 103, 145]],
  [25, [1, 3, 6, 9, 10, 20, 21, 38, 40, 55, 101, 104, 106, 146]],
  [26, [2, 4, 6, 9, 11, 20, 21, 38, 39, 40, 41, 55, 102, 104, 105, 107, 147]],
  [27, [1, 3, 6, 9, 12, 20, 21, 39, 41, 55, 103, 105, 108, 148]],
  [28, [2, 4, 6, 9, 10, 21, 22, 40, 42, 56, 106, 109, 111, 149]],
  [29, [2, 3, 6, 9, 11, 21, 22, 40, 41, 42, 43, 56, 107, 109, 110, 112, 150]],
  [30, [1, 4, 6, 9, 12, 21, 22, 41, 43, 56, 108, 110, 113, 151]],
  [31, [2, 3, 6, 9, 10, 22, 23, 42, 44, 57, 111, 114, 116, 152]],
  [32, [1, 4, 6, 9, 11, 22, 23, 42, 44, 43, 45, 57, 112, 114, 115, 117, 153]],
  [33, [2, 3, 6, 9, 12, 22, 23, 43, 45, 57, 113, 115, 118, 154]],
  [34, [1, 4, 6, 9, 10, 23, 44, 58, 116, 119, 155]],
  [35, [2, 3, 6, 9, 11, 23, 44, 45, 58, 117, 119, 120, 156]],
  [36, [1, 4, 6, 9, 12, 23, 45, 58, 118, 120, 157]],
])
// 0-36的数字
export function getRouletteResult (res: number) {
  const result = rouletteResMap.get(res)
  if (!result) {
    throw new Error('Roulette result mapping not found')
  }
  return result
}

export function calWinLoseForRoulette (betDetails: Record<string, number>, hitRes: number[]): number {
  let winLose = 0
  for (const betKey in betDetails) {
    const betType = Number(betKey)
    const betAmount = betDetails[betKey]
    // 算输赢
    if (hitRes.includes(betType)) {
      winLose += betAmount * getRouletteOdds(betType)
    } else {
      winLose -= betAmount
    }
  }
  return winLose
}

export function calRollingForRoulette (totalBet:number, betDetails: Record<string, number>, hitRes:number[]) {
  const bigBet = betDetails[RouletteBetType.big] ? betDetails[RouletteBetType.big] : 0
  const smallBet = betDetails[RouletteBetType.small] ? betDetails[RouletteBetType.small] : 0
  const evenBet = betDetails[RouletteBetType.even] ? betDetails[RouletteBetType.even] : 0
  const oddBet = betDetails[RouletteBetType.odd] ? betDetails[RouletteBetType.odd] : 0
  const redBet = betDetails[RouletteBetType.red] ? betDetails[RouletteBetType.red] : 0
  const blackBet = betDetails[RouletteBetType.black] ? betDetails[RouletteBetType.black] : 0
  return totalBet -
            bigBet -
            smallBet -
            evenBet -
            oddBet -
            redBet -
            blackBet +
            Math.abs(bigBet - smallBet) +
            Math.abs(evenBet - oddBet) +
            Math.abs(redBet - blackBet)
}

export type rouStats = {
  red: number;
  black: number;
  odd: number;
  even: number;
}

export function isRed (res: number): Boolean {
  return [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].indexOf(res) !== -1
}
