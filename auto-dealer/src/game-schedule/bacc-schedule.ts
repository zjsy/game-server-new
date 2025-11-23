import { BaccApiService } from "../const/centrifugo/bacc.api.service";
import { RoundStatus } from "../const/GameConst";
import { LoginTableResponse, TableInfo } from "../types/types";
import {
  BaccCardPositionEnum,
  generateBaccRoundResult,
} from "../utils/BaccUtils";

type Task = {
  name: string;
  fn: (input: any) => Promise<any>;
  delay: number;
};

// const tasks = [
//   { name: "startGame", fn: startGame, delay: 1000 },
//   // { name: "dealingCards", fn: dealingCards, delay: 2000 },
//   { name: "settlement", fn: settlement, delay: 1500 },
// ];

export interface TaskPipeline {
  runPipeline(): Promise<void>;
  start(data: TableInfo): Promise<void>;
  stop(): void;
}

export class BaccTaskPipeline implements TaskPipeline {
  private running: boolean;
  private tasks: Array<Task> = [];
  private tableInfo: TableInfo | null = null;
  private baccService: BaccApiService;
  constructor(apiService: BaccApiService) {
    this.baccService = apiService;
    // this.tasks = tasks;
    this.running = false;
  }

  async runPipeline() {
    let input: any = null;
    while (this.running) {
      for (const task of this.tasks) {
        await new Promise((resolve) => setTimeout(resolve, task.delay));
        if (!this.running) break; // 延迟后再次检查
        input = await task.fn(input);
      }
    }
  }

  async start(data: any) {
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
    this.running = true;
    const startIndex = this.selectEntryIndex(data);
    let input = data;
    for (let i = startIndex; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      await new Promise((resolve) => setTimeout(resolve, task.delay));
      if (!this.running) break; // 延迟后再次检查
      input = await task.fn(input);
    }
    if (this.running) this.runPipeline();
  }

  selectEntryIndex(data: LoginTableResponse): number {
    if (data.playStatus === RoundStatus.Betting) {
      return 1; // 从发牌开始
    } else if (data.playStatus === RoundStatus.Dealing) {
      return 1; // 从结算开始
    } else if (data.playStatus === -1) {
      this.changeShoes();
      return 0;
    }
    return 0;
  }

  stop() {
    console.warn("Bacc Task Pipeline Stopped");
    this.running = false;
  }

  startGame = async (_input: any): Promise<any> => {
    console.log("Game Start", new Date(), this.tableInfo);
    const res = await this.baccService.baccStartGame();
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

  settlement = async (_input: any) => {
    this.tableInfo.playStatus = RoundStatus.Dealing;
    console.log("Cards Dealing", new Date(), this.tableInfo);
    const { details } = generateBaccRoundResult();
    if (this.tableInfo.type === 0) {
      const pCards = details.p;
      const bCards = details.b;
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
          this.baccService.baccDealingCards({
            index: pokerList[i].i,
            details: pokerList[i].p,
          });
        }, i * 500);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
    console.log("Settlement", new Date(), this.tableInfo);
    const res = await this.baccService.baccSettlement({
      roundId: this.tableInfo.currentRoundId,
      details: details,
    });
    if (res.data.code !== 0) {
      throw new Error(`Settlement Failed: ${res.data.msg || "Unknown error"}`);
    }
    this.tableInfo.playStatus = RoundStatus.Over;
    if (this.tableInfo.currentRoundId >= 99) { 
      this.changeShoes();
    }
    return res.data;
  };

  changeShoes = async () => {
    console.log("Shoes Changed", this.tableInfo);
    const res = await this.baccService.baccNewShoes();
    const data = res.data.data;
    console.log("New Shoes Response:", data);
    this.tableInfo.currentShoe = data.shoeNo;
  };
}
