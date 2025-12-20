import { BaccDetails } from '../constants/bacc.constants.js'
import { BullDetails } from '../constants/bull.constants.js'
import { DpDetails } from '../constants/dp.constants.js'
import { DtDetails } from '../constants/dt.constants.js'
import { FastSicBoDetails } from '../constants/fast-sicbo.constants.js'
import { rouletteDetails } from '../constants/roulette.constants.js'
import { seDieDetails } from '../constants/sedie.constants.js'
import { sicBoDetails } from '../constants/sicbo.constants.js'

export type betJson = {
  type: number;
  value: number;
}

export type GameDetails = BaccDetails | DtDetails | sicBoDetails | BullDetails | DpDetails | FastSicBoDetails | seDieDetails | rouletteDetails | null
export type SettleRoundData<T extends GameDetails> = {
  // roundId: number;
  round_sn: string;
  result: number[];
  details: T
}

// type PlayerLocation = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7'
export type UserLocations = {
  p1: null | number;
  p2: null | number;
  p3: null | number;
  p4: null | number;
  p5: null | number;
  p6: null | number;
  p7: null | number;
}
