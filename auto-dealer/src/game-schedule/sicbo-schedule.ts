import { SicboApiService } from "../const/centrifugo/sicbo.api.service";
import { RoundStatus } from "../const/GameConst";
import { TableInfo } from "../types/types";
import { generateSicboRoundResult } from "../utils/SicboUtils";
import { TaskPipeline } from "./bacc-schedule";

export class SicboTaskPipeline extends TaskPipeline {
  constructor(private apiService: SicboApiService) {
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
    super.stop();
    console.warn("Sicbo Task Pipeline Stopped");
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
    const details = generateSicboRoundResult();
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
    return res.data;
  };
}
