import { ApiResponse } from '../types/response.types.js'

export function success<T = unknown> (data: T, msg = 'success'): ApiResponse<T> {
  return { code: 0, msg, data }
}

export enum ErrorCode {
  UNKNOWN_ERR = 500,
  // CODE_OLD_CLIENT = 501,
  PARAMS_ERROR = 502, // 接口输入参数验证错误
  LOGIN_VERIFY_ERROR = 503, // 登录校验错误
  DEALER_NOT_EXIST = 504, // Dealer不存在
  DEALER_IS_LOGGED = 505, // Dealer已经登录
  TABLE_IS_LOGGED = 506, // 桌子已经登录
  TABLE_NOT_EXIST = 507, // 桌子不存在
  TABLE_IS_DISABLED = 508,
  NOT_ALLOW_SHUFFLE = 509, // 有未完成局,无法换靴
  ROUND_NOT_EXIST = 510, // 该局不存在
  ROUND_NOT_SETTLE = 511, // 该局状态无法结算或取消
  ROUND_ALREADY_SETTLE = 512, // 该局已经结算
  NOT_ALLOW_START = 513, // 当前局还在倒计时或者没有结束0|1状态,不允许下把
  START_ROUND_LOCK = 514,
  SETTLE_ROUND_LOCK = 515,
  RESETTLE_ROUND_LOCK = 516,
  CANCEL_ROUND_LOCK = 517,
  INVALID_TOKEN = 518, // token 类型错误
  TOKEN_EXPIRED = 519, // token 已过期
}

const ErrorMsg = {
  [ErrorCode.UNKNOWN_ERR]: 'system unknown error',
  [ErrorCode.PARAMS_ERROR]: 'params is error',
  [ErrorCode.LOGIN_VERIFY_ERROR]: 'login verify error',
  [ErrorCode.DEALER_NOT_EXIST]: 'dealer is not exit',
  [ErrorCode.DEALER_IS_LOGGED]: 'dealer is logged',
  [ErrorCode.TABLE_IS_LOGGED]: 'table is logged',
  [ErrorCode.TABLE_NOT_EXIST]: 'table is not exit',
  [ErrorCode.TABLE_IS_DISABLED]: 'table is disabled',
  [ErrorCode.NOT_ALLOW_SHUFFLE]: 'table not shuffle, have not finish round',
  [ErrorCode.ROUND_NOT_EXIST]: 'round not exit',
  [ErrorCode.ROUND_NOT_SETTLE]: 'round status can not settle or reSettle or cancel',
  [ErrorCode.ROUND_ALREADY_SETTLE]: 'round already settle',
  [ErrorCode.NOT_ALLOW_START]: 'start err,not allow start,need new shoe or still in countdown or not end',
  [ErrorCode.START_ROUND_LOCK]: 'start play locked,too busy',
  [ErrorCode.SETTLE_ROUND_LOCK]: 'settle round locked,too busy',
  [ErrorCode.RESETTLE_ROUND_LOCK]: 'resettle round locked,too busy',
  [ErrorCode.CANCEL_ROUND_LOCK]: 'cancel round locked,too busy',
  [ErrorCode.INVALID_TOKEN]: 'invalid token type',
  [ErrorCode.TOKEN_EXPIRED]: 'token has expired',
}

/**
 * 业务异常类
 * 抛出此异常时,HTTP 状态码为 200,错误信息在响应体的 code 字段中
 */
export class BusinessError extends Error {
  constructor (
    public readonly code: ErrorCode,
    message?: string
  ) {
    super(message || ErrorMsg[code] || 'unknown error')
    this.name = 'BusinessError'
  }
}

export function fail (code: ErrorCode): ApiResponse<never> {
  return { code, msg: ErrorMsg[code] || 'unknown error' }
}
