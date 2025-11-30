import { DtApiService } from "../const/centrifugo/dt.api.service";
import { RoundStatus } from "../const/GameConst";
import { TableInfo } from "../types/types";
import { DtCardPositionEnum, generateDtRoundResult } from "../utils/DtUtils";
import { TaskPipeline } from "./bacc-schedule";

export class DtTaskPipeline extends TaskPipeline {
  constructor(private apiService: DtApiService) {
    super();
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
    } else if (data.playStatus === -1) {
      await this.changeShoes();
    }
    this.runPipeline();
  }

  stop() {
    super.stop();
    console.warn("Dt Task Pipeline Stopped");
  }

  private startGame = async (_input: any): Promise<any> => {
    console.log("Game Start", new Date(), this.tableInfo);
    const res = await this.apiService.startGame();
    if (res.code !== 0) {
      throw new Error(`Start Game Failed: ${res.msg || "Unknown error"}`);
    }
    const data = res.data;
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
    const details = generateDtRoundResult();
    if (this.tableInfo.type === 0) {
      const pokerList = [
        { i: DtCardPositionEnum.dragon, p: details.d },
        { i: DtCardPositionEnum.tiger, p: details.t },
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
      details: details,
    });
    if (res.code !== 0) {
      throw new Error(`Settlement Failed: ${res.msg || "Unknown error"}`);
    }
    this.tableInfo.playStatus = RoundStatus.Over;
    if (this.tableInfo.roundNo >= 99) {
      this.changeShoes();
    }
    return res.data;
  };

  private changeShoes = async () => {
    console.log("Shoes Changed", this.tableInfo);
    const res = await this.apiService.newShoes();
    const data = res.data;
    console.log("New Shoes Response:", data);
    this.tableInfo.currentShoe = data.shoeNo;
  };
}
