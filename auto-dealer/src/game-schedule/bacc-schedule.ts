import { BaccApiService } from "../const/centrifugo/bacc.api.service";
import { RoundStatus } from "../const/GameConst";
import { TableInfo } from "../types/types";
import {
  BaccCardPositionEnum,
  generateBaccRoundResult,
} from "../utils/BaccUtils";

export type Task = {
  name: string;
  fn: (input: any) => Promise<any>;
  delay: number;
};

// const tasks = [
//   { name: "startGame", fn: startGame, delay: 1000 },
//   // { name: "dealingCards", fn: dealingCards, delay: 2000 },
//   { name: "settlement", fn: settlement, delay: 1500 },
// ];

export abstract class TaskPipeline {
  protected running: boolean = false;
  protected tasks: Array<Task> = [];
  protected tableInfo: TableInfo | null = null;
  protected countdownTimer: NodeJS.Timeout | null = null;
  async runPipeline() {
    this.running = true;
    let input: any = null;
    while (this.running) {
      for (const task of this.tasks) {
        await new Promise((resolve) => setTimeout(resolve, task.delay));
        if (!this.running) break; // 延迟后再次检查
        input = await task.fn(input);
      }
    }
  }
  abstract start(data: TableInfo): Promise<void>;
  stop() {
    console.warn("Task Pipeline Stopped");
    this.running = false;
    // 清理倒计时定时器
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
  destroy() {
    console.warn("Task Pipeline Destroyed");
    this.stop();
    // 清理所有引用
    this.tasks = [];
    this.tableInfo = null;
  }
  protected countdown(seconds: number) {
    console.log("Countdown started:", seconds);
    // 清理旧的定时器
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    let remaining = seconds;
    this.countdownTimer = setInterval(() => {
      console.log(remaining);
      this.tableInfo.currentCountdown = remaining;
      remaining--;
      this.tableInfo.currentCountdown = remaining;
      if (remaining < 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        console.log("倒计时结束！");
      }
    }, 1000);
  }
}

export class BaccTaskPipeline extends TaskPipeline {
  constructor(private apiService: BaccApiService) {
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
      this.countdown(data.currentCountdown);
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
    // const startIndex = this.selectEntryIndex(data);
    // let input = data;
    // for (let i = startIndex; i < this.tasks.length; i++) {
    //   const task = this.tasks[i];
    //   await new Promise((resolve) => setTimeout(resolve, task.delay));
    //   if (!this.running) break; // 延迟后再次检查
    //   input = await task.fn(input);
    // }
    this.runPipeline();
  }

  // private selectEntryIndex(data: TableInfo): number {
  //   if (data.playStatus === RoundStatus.Betting) {
  //     return 1; // 从发牌开始
  //   } else if (data.playStatus === RoundStatus.Dealing) {
  //     return 1; // 从结算开始
  //   } else if (data.playStatus === -1) {
  //     this.changeShoes();
  //     return 0;
  //   }
  //   return 0;
  // }

  private startGame = async (_input: any): Promise<any> => {
    console.log("Game Start", new Date(), this.tableInfo);
    const res = await this.apiService.baccStartGame();
    if (res.code !== 0) {
      throw new Error(`Start Game Failed: ${res.msg || "Unknown error"}`);
    }
    this.countdown(this.tableInfo!.countdown);
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
          this.apiService.baccDealingCards({
            index: pokerList[i].i,
            details: pokerList[i].p,
          });
        }, i * 500);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
    console.log("Settlement", new Date(), this.tableInfo);
    const res = await this.apiService.baccSettlement({
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
    const res = await this.apiService.baccNewShoes();
    const data = res.data;
    console.log("New Shoes Response:", data);
    this.tableInfo.currentShoe = data.shoeNo;
  };
}
