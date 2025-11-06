/**
 * 接收服务端主动推送消息定义,用户监听
 */
export class PushConst {
    // 在线人数定时广播
    public static ON_UPDATE_ONLINE_USER: string = 'onUpdateAllUser';
    // 某桌开始游戏广播(暂时设计为所有的厅都用一个接口广播)// TODO 分厅处理对前后端都有好处
    public static START_GAME: string = 'onStartPlay';
    // 倒计时结束
    public static END_COUNTDOWN: string = 'onEndPlay';
    // 某桌开牌后广播
    public static ON_GAME_RESULT: string = 'onPlayResult';
    // 某桌当前人数定时广播
    public static UPDATE_ROOM_USER: string = 'onUpdateRoomUser';
    // 某桌下注统计定时广播
    public static UPDATE_BET_INFO: string = 'onUpdateBetState';
    // 洗牌
    public static ON_SHUFFLE: string = 'onShuffle';
    // 进入维护
    public static ON_MAINTAIN: string = 'onMaintain';
    // 桌状态变成可玩状态
    public static ON_PLAY: string = 'onPlayTable';
    // 关桌
    public static ON_CLOSE_TABLE: string = 'onCloseTable';
    // 开桌
    // public static ON_OPEN_TABLE: string = "onOpenTable"
    // 某桌换人通知
    public static CHANGE_DEALER: string = 'onChangeDealer';
    // 某桌开牌
    public static OPEN_CARD: string = 'onPokerInfo';
    // 某桌结算(七座模式按位置结算)(现在没有发)(前端计算结算和筹码移动)
    public static SETTLE: string = 'onSendWinorLoss';
    // 更新用户balance 金额
    public static SYNC_BALANCE: string = 'onSyncBalance';
    // 更改结果
    public static CHANGE_RESULT: string = 'onChangeResult';
    // 取消结果
    public static CANCEL_RESULT: string = 'onCancelResult';
    // 好路通知
    public static ON_GOOD_ROAD = 'onGoodRoad';
    // 最后一局
    public static LAST_ROUND: string = 'onLastRound';
    // 骰宝和轮盘重来
    public static REPLAY: string = 'onReplay';
    // 进入7桌模式
    public static ENTER_7P_ROOM: string = 'enter7PRoom';
    // 离开7桌模式
    public static LEAVE_7P_ROOM: string = 'leave7PRoom';
    // 七桌房间下注推送
    public static ON_7P_ROOM_BET = 'onRoomBet';
    // 更新七桌房间用户信息(现在这个消息只改余额)
    public static UPDATE_7P_ROOM_USERINFO = 'onUpdateRoomUserInfo';
}
