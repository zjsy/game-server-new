/**
 * 需要服务器响应的请求,用户消息发送
 */
export class PlayerRequestConst {
  // 网关分配
  public static GATEWAY: string = "gate.gateHandler.queryEntry";
  // 登录,这个接口需要做认证
  public static LOGIN: string = "connector.entryHandler.enter";
  // 获取游戏配置
  public static GET_CONFIG: string = "hall.hallHandler.getConfig";
  // 用户信息定时(可以只要获取就行)
  public static USER_INFO: string = "hall.hallHandler.getUserInfo";
  // 获取用户的balance
  public static USER_BALANCE: string = "hall.hallHandler.getUserBalance";
  // 获取当前所有的桌子信息,// TODO 最好分厅获取
  public static LOBBY_TABEL_INFOS: string = "hall.hallHandler.getLobbyTables";
  // 获取某个桌子的详细信息,(包括视频流地址信息)
  public static GET_TABLE_INFO: string = "room.roomHandler.enterTableRoom";
  // 进入7桌模式
  public static ENTER_7_ROOM: string = "room.roomHandler.enter7Room";
  // 离开某个桌子房间
  public static LEAVE_TABLE: string = "room.roomHandler.leaveTable";
  // 统一下注
  public static UNIFIED_BET: string = "room.roomHandler.bet";
  // 报表
  public static GET_REPORT: string = "hall.hallHandler.getBetInfo";
}
