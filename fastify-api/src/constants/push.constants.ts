/**
 * 接收服务端主动推送消息定义,用户监听
 */
export enum PushConst {
  // 在线人数定时广播
  ON_UPDATE_ONLINE_USER = 'onUpdateAllUser',
  // 某桌开始游戏广播(暂时设计为所有的厅都用一个接口广播)// TODO 分厅处理对前后端都有好处
  START_GAME = 'onStartPlay',
  // 倒计时结束
  END_COUNTDOWN = 'onEndPlay',
  // 某桌开牌后广播
  ON_GAME_RESULT = 'onPlayResult',
  // 某桌当前人数定时广播
  UPDATE_ROOM_USER = 'onUpdateRoomUser',
  // 某桌下注统计定时广播
  UPDATE_BET_INFO = 'onUpdateBetState',
  // 洗牌
  ON_SHUFFLE = 'onShuffle',
  // 进入维护
  ON_MAINTAIN = 'onMaintain',
  // 关桌
  ON_CLOSE_TABLE = 'onCloseTable',
  // 某桌换人通知
  CHANGE_DEALER = 'onChangeDealer',
  // 某桌开牌
  OPEN_CARD = 'onPokerInfo',
  // 更新用户balance 金额
  ON_SETTLE = 'onSettle',
  // 更新用户balance 金额, 重结算和取消服务端会主动推送余额
  SYNC_BALANCE = 'onSyncBalance',
  // 更改结果
  CHANGE_RESULT = 'onChangeResult',
  // 取消结果
  CANCEL_RESULT = 'onCancelResult',
  // 好路通知
  ON_GOOD_ROAD = 'onGoodRoad',
  // !以下的推送不是全局的, 而是给同桌的玩家推送
  // 最后一局
  LAST_ROUND = 'onLastRound',
  // 骰宝和轮盘重来
  REPLAY = 'onReplay',
  // 给同桌的人推送消息
  CHAT_MESSAGE = 'onChatMessage',
  // 进入7桌模式
  ENTER_7P_ROOM = 'enter7PRoom',
  // 离开7桌模式
  LEAVE_7P_ROOM = 'leave7PRoom',
  // 七桌房间下注推送
  ON_7P_ROOM_BET = 'onRoomBet',
  // 更新七桌房间用户信息(现在这个消息只改余额)
  UPDATE_7P_ROOM_USERINFO = 'onUpdateRoomUserInfo'
}
