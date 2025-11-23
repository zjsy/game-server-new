export type BaccDetails = {
  p: number[];
  b: number[];
}

/** -
 * 龙虎结果详情
 */
export type DtDetails = {
  d: number;
  t: number;
}

export type betJson = {
  type: number;
  value: number;
}

export type UserLocations = {
  p1: null | number;
  p2: null | number;
  p3: null | number;
  p4: null | number;
  p5: null | number;
  p6: null | number;
  p7: null | number;
}
type FixedNumberArray = [number, number, number, number, number]

export type NiuDetails = {
  h: number;
  b: FixedNumberArray; // 1* 2 * 2 * 3 * 4
  bP: number; // 0 五牛 1 -9 点数 10 牛牛 11 五花
  p1: FixedNumberArray;
  p1P: number;
  p2: FixedNumberArray;
  p2P: number;
  p3: FixedNumberArray;
  p3P: number;
}

export type SettleRoundData<T extends BaccDetails | DtDetails | NiuDetails | null> = {
  // roundId: number;
  round_sn: string;
  result: number[];
  details: T
}
