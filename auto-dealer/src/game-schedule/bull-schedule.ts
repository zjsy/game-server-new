import { BullApiService } from "../const/centrifugo/bull.api.service";
import { RoundStatus } from "../const/GameConst";
import { TableInfo } from "../types/types";
import {
  BullCardPositionEnum,
  generateBullRoundResult,
} from "../utils/BullUtils";
import { Task, TaskPipeline } from "./bacc-schedule";

export class BullTaskPipeline implements TaskPipeline {
  private running: boolean;
  private tasks: Array<Task> = [];
  private tableInfo: TableInfo | null = null;
  private apiService: BullApiService;
  constructor(apiService: BullApiService) {
    this.apiService = apiService;
    // this.tasks = tasks;
    this.running = false;
  }

  async runPipeline() {
    this.running;
    let input: any = null;
    while (this.running) {
      for (const task of this.tasks) {
        await new Promise((resolve) => setTimeout(resolve, task.delay));
        if (!this.running) break; // 延迟后再次检查
        input = await task.fn(input);
      }
    }
  }

  async start(data: TableInfo) {
    this.tableInfo = data;
    this.tasks = [
      { name: "startGame", fn: this.startGame, delay: 3000 },
      // { name: "dealingCards", fn: this.dealingCards, delay: data.countdown * 1000 + 3000},
      {
        name: "settlement",
        fn: this.settlement,
        delay: this.tableInfo.countdown * 1000 + 5000,
      },
    ];
    // 手动判断更加可控
    if (data.playStatus === RoundStatus.Betting) {
      await new Promise((resolve) =>
        setTimeout(resolve, data.currentCountdown * 1000 + 3000)
      );
      await this.settlement(null);
    } else if (data.playStatus === RoundStatus.Dealing) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await this.settlement(null);
    }
    this.runPipeline();
  }

  stop() {
    console.warn("Bull Task Pipeline Stopped");
    this.running = false;
  }

  startGame = async (_input: any): Promise<any> => {
    console.log("Game Start", new Date(), this.tableInfo);
    const res = await this.apiService.startGame();
    if (res.data.code !== 0) {
      throw new Error(`Start Game Failed: ${res.data.msg || "Unknown error"}`);
    }
    const data = res.data.data;
    console.log("Start Game Response:", data);
    this.tableInfo.currentRoundId = data.id;
    this.tableInfo.roundNo = data.roundNo;
    this.tableInfo.currentShoe = data.shoeNo;
    this.tableInfo.playStatus = RoundStatus.Betting;
    return data;
  };

  private settlement = async (_input: any) => {
    this.tableInfo.playStatus = RoundStatus.Dealing;
    console.log("Cards Dealing", new Date(), this.tableInfo);
    const { result, details } = generateBullRoundResult();
    if (this.tableInfo.type === 0) {
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
          this.apiService.dealingCards({
            index: pokerList[i].i,
            details: pokerList[i].p,
          });
        }, i * 500);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
    console.log("Settlement", new Date(), this.tableInfo);
    const res = await this.apiService.settlement({
      roundId: this.tableInfo.currentRoundId,
      result: result,
      details: details,
    });
    if (res.data.code !== 0) {
      throw new Error(`Settlement Failed: ${res.data.msg || "Unknown error"}`);
    }
    this.tableInfo.playStatus = RoundStatus.Over;
    return res.data;
  };
}
