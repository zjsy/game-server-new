import { Actor } from "pinus-robot";
import {
  PinusWSClient,
  PinusWSClientEvent,
} from "./pinus-client/PinusWSClient";
import * as crypto from "crypto";
import * as log4js from "log4js";
import axios from "axios";
import { DealerRequestConst } from "./const/pomelo/DealerRequestConst";
import { GameType } from "./const/GameConst";
import {
  BaccCardPositionEnum,
  generateBaccRoundResult,
  getShoeNoDate,
  parseBaccResult,
} from "./utils/BaccUtils";
import {
  DtCardPositionEnum,
  generateDtRoundResult,
  parseDtResult,
} from "./utils/DtUtils";
import {
  BullCardPositionEnum,
  generateNiuNiuRoundResult,
} from "./utils/BullUtils";
import { generateRouletteRoundResult } from "./utils/RouletteUtils";
import { generateSicboRoundResult } from "./utils/SicboUtils";
import { generateSedieRoundResult } from "./utils/SedieUtils";

let config = require(__dirname + "\\config\\log4js.json");
log4js.configure(config);

const logger = log4js.getLogger("dealer");

export class Robot {
  constructor(private actor: Actor) {
    // robot 获取不到agent node 的id
    // ?acotr.id 无论是多个代理还是单个代理都是，连续的数字，但是执行顺序上是倒排的
    logger.warn("机器人代理id", actor.id);
  }

  pinusClient = new PinusWSClient();

  private getIdleTable(baseUrl: string) {
    logger.info(`获取桌登录,代理ID为->`, this.actor.id);
    // return axios.post(baseUrl + 'get-one-idle-table', {
    //     type: 0,
    // });
    return axios.post(baseUrl + "get-one-idle-table");
  }

  public async connectServer(config: dealerConfig) {
    let res;
    try {
      const response = await this.getIdleTable(config.openApiUrl);
      // if (response.statusCode !== 200) {
      //     logger.error('请求空闲桌失败');
      //     return;
      // }
      res = response.data;
    } catch (res1) {
      logger.error("请求空闲桌失败", res1.response.statusText);
      return;
    }

    if (!res || res.code !== 0) {
      logger.error("没有空闲的桌");
      return;
    }
    const data = res.data;
    logger.warn("桌信息", data);
    this.dealerInfo.dealerNo = data.dealerNo;
    let host = config.socketHost;
    let port = config.socketPort;
    this.pinusClient.on(PinusWSClientEvent.EVENT_IO_ERROR, (event: Error) => {
      // 错误处理
      console.error("connect error", event);
    });
    this.pinusClient.on(
      PinusWSClientEvent.EVENT_CLOSE,
      function (event: Error) {
        // 关闭处理
        console.info("close");
      }
    );
    this.pinusClient.on(
      PinusWSClientEvent.EVENT_HEART_BEAT_TIMEOUT,
      (event: Error) => {
        // 心跳timeout
        console.warn("heart beat timeout", event);
      }
    );
    this.pinusClient.on(PinusWSClientEvent.EVENT_KICK, (event: Error) => {
      // 踢出
      console.info("kick", event);
    });

    this.actor.emit("incr", "initConn");
    this.actor.emit("start", "initConn", this.actor.id);
    this.pinusClient.init(
      {
        host: host,
        port: port,
      },
      async () => {
        this.actor.emit("end", "initConn", this.actor.id);
        // 连接成功执行函数
        logger.info("server连接成功");
        const token = crypto
          .createHash("md5")
          .update("fungame2020928lg88casino" + data.tableNo + data.lobbyNo)
          .digest("hex");
        this.loginTable({
          lobbyNo: data.lobbyNo,
          tableNo: data.tableNo,
          loginType: 0,
          token: token,
        });
      }
    );
  }

  private tableInfo = {
    lobby: "HJLH",
    table_no: "006",
    countdown: 35,
    roundNo: 1,
    type: 0,
    gameType: 0,
  };

  private dealerInfo = {
    dealerNo: "",
  };

  loginTable(data: {
    lobbyNo: string;
    tableNo: string;
    loginType: number;
    token: string;
  }) {
    this.actor.emit("incr", "loginTableReq");
    this.actor.emit("start", "loginTableQuery", this.actor.id);
    this.pinusClient.request(
      DealerRequestConst.loginTable,
      data,
      (res: any) => {
        // 消息回调
        this.actor.emit("end", "loginTableQuery", this.actor.id);
        logger.warn(`桌登录`, res);
        if (res.code === 200) {
          this.loginDealer({ dealerNo: this.dealerInfo.dealerNo });
          const data = res.data;
          this.tableInfo.lobby = data.lobby_no;
          this.tableInfo.countdown = data.countdown;
          this.tableInfo.roundNo = data.current_round_no;
          this.tableInfo.type = data.type;
          this.tableInfo.gameType = data.game_type;
          const gameType = data.game_type;
          if (data.playStatus === 0) {
            let countdown = data.countdown;
            if (data.roundCountdown !== undefined) {
              countdown = data.roundCountdown;
            }
            setTimeout(() => {
              this.settlement(data.current_round_id);
            }, (countdown + 3) * 1000);
          } else if (data.playStatus === 1) {
            this.settlement(data.current_round_id);
          } else {
            if (
              gameType === GameType.BACCARAT ||
              gameType === GameType.DRAGONTIGER
            ) {
              if (data.current_shoe / 100 < getShoeNoDate()) {
                // 如果靴号小于今天，换靴
                this.changeShoes();
              }
            }
            setTimeout(() => {
              this.startPlay();
            }, 3000);
          }
        }
      }
    );
  }

  loginDealer(data: { dealerNo: string }) {
    this.actor.emit("incr", "loginDealerReq");
    this.actor.emit("start", "loginDealerReq", this.actor.id);
    this.pinusClient.request(
      DealerRequestConst.loginDealer,
      data,
      (res: any) => {
        // 消息回调
        this.actor.emit("end", "loginDealerReq", this.actor.id);
        logger.warn(`荷官登录`, res);
      }
    );
  }
  /**
   *
   * @param data 获取大厅信息
   */
  changeShoes(data?: {}) {
    this.actor.emit("incr", "changeShoesReq");
    this.actor.emit("start", "changeShoesReq", this.actor.id);
    let requestKey;
    if (this.tableInfo.gameType === GameType.BACCARAT) {
      requestKey = DealerRequestConst.baccChangeShoe;
    } else if (this.tableInfo.gameType === GameType.DRAGONTIGER) {
      requestKey = DealerRequestConst.dtChangeShoe;
    }
    this.pinusClient.request(requestKey, data, (res: any) => {
      this.actor.emit("end", "changeShoesReq", this.actor.id);
      if (res.code == 200) {
        logger.info("换靴成功!");
      }
    });
  }

  /**
   * 进桌
   * @param result
   * @param username
   */
  startPlay() {
    this.actor.emit("incr", "startPlayReq");
    this.actor.emit("start", "startPlayReq", this.actor.id);
    let requestKey;
    if (this.tableInfo.gameType === GameType.BACCARAT) {
      requestKey = DealerRequestConst.baccStartPlay;
    } else if (this.tableInfo.gameType === GameType.DRAGONTIGER) {
      requestKey = DealerRequestConst.dtStartPlay;
    } else if (this.tableInfo.gameType === GameType.Sicbo) {
      requestKey = DealerRequestConst.sicboStartPlay;
    } else if (this.tableInfo.gameType === GameType.Roulette) {
      requestKey = DealerRequestConst.rouleStartPlay;
    } else if (this.tableInfo.gameType === GameType.NIUNIU) {
      requestKey = DealerRequestConst.bullStartPlay;
    } else if (this.tableInfo.gameType === GameType.SEDIE) {
      requestKey = DealerRequestConst.sedieStartPlay;
    }
    this.pinusClient.request(requestKey, {}, (res: any) => {
      this.actor.emit("end", "startPlayReq", this.actor.id);
      logger.info("开局", res);
      if (res.code === 200) {
        const data = res.data;
        this.tableInfo.roundNo = data.roundNo;
        setTimeout(() => {
          this.settlement(data.id);
        }, this.tableInfo.countdown * 1000 + 3000);
      } else {
        logger.warn("开局失败", res);
        process.exit();
      }
    });
  }

  countdown() {
    this.actor.emit("incr", "countdownReq");
    this.actor.emit("start", "countdownReq", this.actor.id);
    let requestKey;
    if (this.tableInfo.gameType === GameType.BACCARAT) {
      requestKey = DealerRequestConst.baccCountdown;
    } else if (this.tableInfo.gameType === GameType.DRAGONTIGER) {
      requestKey = DealerRequestConst.dtCountdown;
    } else if (this.tableInfo.gameType === GameType.Sicbo) {
      requestKey = DealerRequestConst.sicboCountdown;
    } else if (this.tableInfo.gameType === GameType.Roulette) {
      requestKey = DealerRequestConst.rouleCountdown;
    } else if (this.tableInfo.gameType === GameType.NIUNIU) {
      requestKey = DealerRequestConst.bullCountdown;
    } else if (this.tableInfo.gameType === GameType.SEDIE) {
      requestKey = DealerRequestConst.sedieCountdown;
    }
    this.pinusClient.request(requestKey, {}, (res: any) => {
      this.actor.emit("end", "countdownReq", this.actor.id);
    });
  }

  baccPokerInfo(data: { index: number; details: number }) {
    this.actor.emit("incr", "pokerInfoReq");
    this.actor.emit("start", "pokerInfoReq", this.actor.id);
    this.pinusClient.request(
      DealerRequestConst.baccPokerInfo,
      data,
      (res: any) => {
        // 消息回调
        this.actor.emit("end", "pokerInfoReq", this.actor.id);
        logger.info("开牌成功!");
      }
    );
  }

  dtPokerInfo(data: { index: number; details: number }) {
    this.actor.emit("incr", "pokerInfoReq");
    this.actor.emit("start", "pokerInfoReq", this.actor.id);
    this.pinusClient.request(
      DealerRequestConst.dtPokerInfo,
      data,
      (res: any) => {
        // 消息回调
        this.actor.emit("end", "pokerInfoReq", this.actor.id);
        logger.info("开牌成功!");
      }
    );
  }

  bullPokerInfo(data: { index: number; details: number }) {
    this.actor.emit("incr", "pokerInfoReq");
    this.actor.emit("start", "pokerInfoReq", this.actor.id);
    this.pinusClient.request(
      DealerRequestConst.bullPokerInfo,
      data,
      (res: any) => {
        // 消息回调
        this.actor.emit("end", "pokerInfoReq", this.actor.id);
        logger.info("开牌成功!");
      }
    );
  }

  // private sendAllPokers(cards: {i: number; p: number}[]) {
  //     const l = cards.length;
  //     for (let i = 0; i < l; i++) {
  //         setTimeout(() => {
  //             this.pokerInfo({pokerIndex: cards[i].i, pokerNum: cards[i].p});
  //         }, i * 100);
  //     }
  // }

  settlement(roundId: number) {
    // logger.warn(`结算`);
    let timeout = 6000;
    const gameType = this.tableInfo.gameType;
    let params: any;
    if (gameType === GameType.BACCARAT) {
      const { details, points } = generateBaccRoundResult();
      if (this.tableInfo.type === 0) {
        const pCards = details.player;
        const bCards = details.banker;
        const pokerList = [
          { i: BaccCardPositionEnum.player_1, p: pCards[0] },
          { i: BaccCardPositionEnum.player_2, p: pCards[1] },
          { i: BaccCardPositionEnum.banker_1, p: bCards[0] },
          { i: BaccCardPositionEnum.banker_2, p: bCards[1] },
        ];
        if (pCards[2] !== undefined) {
          pokerList.push({ i: BaccCardPositionEnum.player_3, p: pCards[2] });
        }
        if (bCards[2] !== undefined) {
          pokerList.push({ i: BaccCardPositionEnum.banker_3, p: bCards[2] });
        }
        const l = pokerList.length;
        for (let i = 0; i < l; i++) {
          setTimeout(() => {
            this.baccPokerInfo({
              index: pokerList[i].i,
              details: pokerList[i].p,
            });
          }, i * 500);
        }
      }
      params = {
        roundId: roundId,
        details: { p: details.player, b: details.banker },
      };
    } else if (gameType === GameType.DRAGONTIGER) {
      const details = generateDtRoundResult();
      if (this.tableInfo.type === 0) {
        const pokerList = [
          { i: DtCardPositionEnum.dragon, p: details.dragon },
          { i: DtCardPositionEnum.tiger, p: details.tiger },
        ];
        const l = pokerList.length;
        for (let i = 0; i < l; i++) {
          setTimeout(() => {
            this.dtPokerInfo({
              index: pokerList[i].i,
              details: pokerList[i].p,
            });
          }, i * 500);
        }
      }
      params = {
        roundId: roundId,
        details: { d: details.dragon, t: details.tiger },
      };
    } else if (gameType === GameType.Roulette) {
      timeout = 5000;
      const details = generateRouletteRoundResult();
      params = {
        roundId: roundId,
        details: details,
      };
    } else if (gameType === GameType.Sicbo) {
      timeout = 5000;
      const details = generateSicboRoundResult();
      params = {
        roundId: roundId,
        details: details,
      };
    } else if (gameType === GameType.NIUNIU) {
      timeout = 10000;
      const { result, details } = generateNiuNiuRoundResult();
      const pokerList = [
        { i: BullCardPositionEnum.banker1, p: details.b[0] },
        { i: BullCardPositionEnum.banker2, p: details.b[1] },
        { i: BullCardPositionEnum.banker3, p: details.b[2] },
        { i: BullCardPositionEnum.banker4, p: details.b[3] },
        { i: BullCardPositionEnum.banker5, p: details.b[4] },
        { i: BullCardPositionEnum.player11, p: details.p1[0] },
        { i: BullCardPositionEnum.player12, p: details.p1[1] },
        { i: BullCardPositionEnum.player13, p: details.p1[2] },
        { i: BullCardPositionEnum.player14, p: details.p1[3] },
        { i: BullCardPositionEnum.player15, p: details.p1[4] },
        { i: BullCardPositionEnum.player21, p: details.p2[0] },
        { i: BullCardPositionEnum.player22, p: details.p2[1] },
        { i: BullCardPositionEnum.player23, p: details.p2[2] },
        { i: BullCardPositionEnum.player24, p: details.p2[3] },
        { i: BullCardPositionEnum.player25, p: details.p2[4] },
        { i: BullCardPositionEnum.player31, p: details.p3[0] },
        { i: BullCardPositionEnum.player32, p: details.p3[1] },
        { i: BullCardPositionEnum.player33, p: details.p3[2] },
        { i: BullCardPositionEnum.player34, p: details.p3[3] },
        { i: BullCardPositionEnum.player35, p: details.p3[4] },
      ];
      const l = pokerList.length;
      for (let i = 0; i < l; i++) {
        setTimeout(() => {
          this.bullPokerInfo({
            index: pokerList[i].i,
            details: pokerList[i].p,
          });
        }, i * 100);
      }
      params = {
        roundId: roundId,
        result: result.join(","),
        details: {
          h: details.h,
          b: details.b,
          bP: details.bP,
          p1: details.p1,
          p1P: details.p1P,
          p2: details.p2,
          p2P: details.p2P,
          p3: details.p3,
          p3P: details.p3P,
        },
      };
    } else if (gameType === GameType.SEDIE) {
      const result = generateSedieRoundResult();
      params = {
        roundId: roundId,
        details: { rc: result },
      };
    }

    setTimeout(() => {
      this.actor.emit("incr", "settlementReq");
      this.actor.emit("start", "settlementReq", this.actor.id);
      let requestKey;
      if (this.tableInfo.gameType === GameType.BACCARAT) {
        requestKey = DealerRequestConst.baccSettlement;
      } else if (this.tableInfo.gameType === GameType.DRAGONTIGER) {
        requestKey = DealerRequestConst.dtSettlement;
      } else if (this.tableInfo.gameType === GameType.Sicbo) {
        requestKey = DealerRequestConst.sicboSettlement;
      } else if (this.tableInfo.gameType === GameType.Roulette) {
        requestKey = DealerRequestConst.rouleSettlement;
      } else if (this.tableInfo.gameType === GameType.NIUNIU) {
        requestKey = DealerRequestConst.bullSettlement;
      } else if (this.tableInfo.gameType === GameType.SEDIE) {
        requestKey = DealerRequestConst.sedieSettlement;
      }
      this.pinusClient.request(requestKey, params, (res: any) => {
        // 消息回调
        this.actor.emit("end", "settlementReq", this.actor.id);
        logger.info(`结算!${roundId}`, res);
        if (res.code === 200) {
          if (
            gameType === GameType.BACCARAT ||
            gameType === GameType.DRAGONTIGER
          ) {
            // 判断当前局号是否大于90，如果大于90换靴
            if (this.tableInfo.roundNo > 90) {
              this.changeShoes();
            }
          }
          setTimeout(() => {
            this.startPlay();
          }, 10000);
        }
      });
    }, timeout);
  }
}

export default function (actor: Actor) {
  let client = new Robot(actor);
  let config = require(__dirname + "\\config\\dealerConfig.json");
  setTimeout(() => {
    client.connectServer(config);
  }, actor.id * 3000);

  return client;
}
