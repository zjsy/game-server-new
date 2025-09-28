/**
 * 需要服务器响应的请求,用户消息发送
 */
export class DealerRequestConst {
    // 桌登录
    public static loginTable: string = 'trader.traderHandler.tableLogin';
    // site.dealerHandler.close
    // site.dealerHandler.goodRoad
    // site.dealerHandler.lastGame
    // site.dealerHandler.maintain
    // site.dealerHandler.pushRoomStats
    // 荷官登录
    public static loginDealer: string = 'site.dealerHandler.dealerLogin';
    // 更新桌台倒计时
    public static updateCountdown: string = 'site.dealerHandler.updateCountdown';

    // 百家乐
    // site.baccHandler.lastGame
    // site.baccHandler.reSettle
    // 换靴
    public static baccChangeShoe: string = 'site.baccHandler.changeShoe';
    // 开局
    public static baccStartPlay: string = 'site.baccHandler.startPlay';
    // 倒计时结束
    public static baccCountdown: string = 'site.baccHandler.stopPlay';
    // 牌信息
    public static baccPokerInfo: string = 'site.baccHandler.pokerInfo';
    // 结算
    public static baccSettlement: string = 'site.baccHandler.settlement';
    // 取消局
    public static baccCancel: string = 'site.baccHandler.cancel';

    // 龙虎
    // site.dtHandler.lastGame
    // site.dtHandler.reSettle
    // 换靴
    public static dtChangeShoe: string = 'site.dtHandler.changeShoe';
    // 开局
    public static dtStartPlay: string = 'site.dtHandler.startPlay';
    // 倒计时结束
    public static dtCountdown: string = 'site.dtHandler.stopPlay';
    // 牌信息
    public static dtPokerInfo: string = 'site.dtHandler.pokerInfo';
    // 结算
    public static dtSettlement: string = 'site.dtHandler.settlement';
    // 取消局
    public static dtCancel: string = 'site.dtHandler.cancel';

    // 牛牛
    // site.dtHandler.reSettle
    // 开局
    public static bullStartPlay: string = 'site.niuniuHandler.startPlay';
    // 倒计时结束
    public static bullCountdown: string = 'site.niuniuHandler.stopPlay';
    // 牌信息
    public static bullPokerInfo: string = 'site.niuniuHandler.pokerInfo';
    // 结算
    public static bullSettlement: string = 'site.niuniuHandler.settlement';
    // 取消局
    public static bullCancel: string = 'site.niuniuHandler.cancel';

    // 轮盘
    // site.rouletteHandler.reSettle
    // site.rouletteHandler.lastGame
    // site.rouletteHandler.reSpin
    // 开局
    public static rouleStartPlay: string = 'site.rouletteHandler.startPlay';
    // 倒计时结束
    public static rouleCountdown: string = 'site.rouletteHandler.stopPlay';
    // 结算
    public static rouleSettlement: string = 'site.rouletteHandler.settlement';
    // 取消局
    public static rouleCancel: string = 'site.rouletteHandler.cancel';
    // 轮盘
    // site.seDieHandler.reSettle
    // 开局
    public static sedieStartPlay: string = 'site.seDieHandler.startPlay';
    // 倒计时结束
    public static sedieCountdown: string = 'site.seDieHandler.stopPlay';
    // 结算
    public static sedieSettlement: string = 'site.seDieHandler.settlement';
    // 取消局
    public static sedieCancel: string = 'site.seDieHandler.cancel';

    // 骰宝
    // site.sicboHandler.reSettle
    // site.sicboHandler.cocked
    // site.sicboHandler.lastGame
    // 开局
    public static sicboStartPlay: string = 'site.sicboHandler.startPlay';
    // 倒计时结束
    public static sicboCountdown: string = 'site.sicboHandler.stopPlay';
    // 结算
    public static sicboSettlement: string = 'site.sicboHandler.settlement';
    // 取消局
    public static sicboCancel: string = 'site.sicboHandler.cancel';
}
