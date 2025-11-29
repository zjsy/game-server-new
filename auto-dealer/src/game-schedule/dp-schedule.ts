import { DpApiService } from "../const/centrifugo/dp.api.service";
import { RoundStatus } from "../const/GameConst";
import { TableInfo } from "../types/types";
import {
  DrPhCardPositionEnum,
  generateDrPhRoundResult,
} from "../utils/dragon-phoenix.utils";
import { Task, TaskPipeline } from "./bacc-schedule";

export class DpTaskPipeline implements TaskPipeline {
  private running: boolean;
  private tasks: Array<Task> = [];
  private tableInfo: TableInfo | null = null;
  private apiService: DpApiService;
  constructor(apiService: DpApiService) {
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
    console.warn("Dp Task Pipeline Stopped");
    this.running = false;
  }

  private startGame = async (_input: any): Promise<any> => {
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
    const details = generateDrPhRoundResult();

    const pokerList = [
      { i: DrPhCardPositionEnum.dr_1, p: details.d[0] },
      { i: DrPhCardPositionEnum.dr_2, p: details.d[1] },
      { i: DrPhCardPositionEnum.dr_3, p: details.d[2] },
      { i: DrPhCardPositionEnum.ph_1, p: details.p[0] },
      { i: DrPhCardPositionEnum.ph_2, p: details.p[1] },
      { i: DrPhCardPositionEnum.ph_3, p: details.p[2] },
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

    await new Promise((resolve) => setTimeout(resolve, 4000));
    console.log("Settlement", new Date(), this.tableInfo);
    const res = await this.apiService.settlement({
      roundId: this.tableInfo.currentRoundId,
      details: details,
    });
    if (res.data.code !== 0) {
      throw new Error(`Settlement Failed: ${res.data.msg || "Unknown error"}`);
    }
    this.tableInfo.playStatus = RoundStatus.Over;
    return res.data;
  };
}
