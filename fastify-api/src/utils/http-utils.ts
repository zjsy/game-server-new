import type { ApiResponse } from '../types/common.types.js'

export function success<T = unknown> (data: T, msg = 'success'): ApiResponse<T> {
  return { code: 0, msg, data }
}
export enum SiteErrorCode {
  UNKNOWN_ERR = 500,
  // CODE_OLD_CLIENT = 501,
  PARAMS_ERROR = 502, // 接口输入参数错误
  USER_NOT_EXIT = 503, // 用户名错误或不存在
  LOGIN_VERIFY_ERROR = 504, // 登录校验错误
  USER_IS_LOGGED = 505, // 用户已经登录
  TABLE_IS_LOGGED = 506, // 桌子已经登录
  TABLE_NOT_EXIT = 507, // 桌子不存在
  TABLE_IS_CLOSED = 508,
  TABLE_NOT_SHUFFLE = 509, // 有未完成局，无法换靴
  ROUND_NOT_EXIT = 510, // 该局不存在
  ROUND_NOT_SETTLE = 511, // 该局状态无法结算或取消
  ROUND_ALREADY_SETTLE = 512, // 该局已经结算
  NOT_ALLOW_START = 513, // 当前局还在倒计时或者没有结束0|1状态，不允许下把
  START_ROUND_LOCK = 514,
  SETTLE_ROUND_LOCK = 515,
  RESETTLE_ROUND_LOCK = 516,
  CANCEL_ROUND_LOCK = 517,
}

const ErrMsgSite = {
  500: 'system unknown error',
  502: 'params is error',
  503: 'dealer is not exit',
  504: 'login verify error',
  505: 'user is logged',
  506: 'table is logged',
  507: 'table is not exit',
  508: 'table is closed',
  509: 'table not shuffle, have not finish round',
  510: 'round not exit',
  511: 'round status can not settle or reSettle or cancel', // 该局状态无法结算
  512: 'round already settle', // 该局状态无法结算
  513: 'start err,not allow start,need new shoe or still in countdown or not end', // 当前局还在倒计时或者没有结束0|1状态，不允许下把
  514: 'start play locked,too busy',
  515: 'settle round locked,too busy', // 该局状态无法结算
  516: 'resettle round locked,too busy', // 该局状态无法结算
  517: 'cancel round locked,too busy', // 该局状态无法结算
}

export function fail (code: SiteErrorCode): ApiResponse<never> {
  return { code, msg: ErrMsgSite[code] || 'unknown error' }
}
