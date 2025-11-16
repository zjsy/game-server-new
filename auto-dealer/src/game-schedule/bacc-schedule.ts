import { BaccApiService } from "../const/centrifugo/bacc.api.service";
import {
  LoginTableResponse,
  RoundStatus,
  StartResponse,
} from "../const/GameConst";
import {
  BaccCardPositionEnum,
  generateBaccRoundResult,
} from "../utils/BaccUtils";

type Task = {
  name: string;
  fn: (tableInfo: TableInfo, input: any) => Promise<any>;
  delay: number;
};

// const tasks = [
//   { name: "startGame", fn: startGame, delay: 1000 },
//   // { name: "dealingCards", fn: dealingCards, delay: 2000 },
//   { name: "settlement", fn: settlement, delay: 1500 },
// ];

type TableInfo = {
  tableNo: string;
  countdown: number;
  roundNo: number;
  type: number;
  gameType: number;
  playStatus: number;
  currentShoe: number;
  currentRoundId: number;
  token: string;
};

export interface TaskPipeline {
  runPipeline(): Promise<void>;
  start(data: LoginTableResponse): Promise<void>;
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
    this.running = true;
    let input: any = null;
    while (this.running) {
      for (const task of this.tasks) {
        await new Promise((resolve) => setTimeout(resolve, task.delay));
        if (this.tableInfo) {
          input = await task.fn(this.tableInfo, input);
        }
      }
    }
  }

  async start(data: LoginTableResponse) {
    this.tasks = [
      { name: "startGame", fn: this.startGame, delay: 3000 },
      // { name: "dealingCards", fn: this.dealingCards, delay: data.countdown * 1000 + 3000},
      {
        name: "settlement",
        fn: this.settlement,
        delay: data.countdown * 1000 + 5000,
      },
    ];
    this.tableInfo = {
      tableNo: data.table_no,
      countdown: data.countdown,
      roundNo: data.current_round_no,
      type: data.type,
      gameType: data.game_type,
      playStatus: data.playStatus,
      currentShoe: data.current_shoe,
      currentRoundId: data.current_round_id,
      token: data.token,
    };
    const startIndex = this.selectEntryIndex(data);
    let input = data;
    for (let i = startIndex; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      await new Promise((resolve) => setTimeout(resolve, task.delay));
      input = await task.fn(this.tableInfo, input);
    }
    this.runPipeline();
  }

  selectEntryIndex(data: LoginTableResponse): number {
    if (data.playStatus === RoundStatus.Betting) {
      return 1; // 从发牌开始
    } else if (data.playStatus === RoundStatus.Dealing) {
      return 2; // 从结算开始
    } else {
      return 0; // 默认从开始
    }
  }

  stop() {
    this.running = false;
  }

  async startGame(tableInfo: TableInfo, input: any): Promise<any> {
    console.log("Game Start", new Date(), tableInfo);
    const res = await this.baccService.baccStartGame();
    const data = res.data as StartResponse;
    console.log("Start Game Response:", data);
    tableInfo.currentRoundId = data.id;
    tableInfo.roundNo = data.roundNo;
    tableInfo.currentShoe = data.shoeNo;
    return data;
  }

  settlement = async (tableInfo: TableInfo) => {
    console.log("Cards Dealing", new Date(), tableInfo);
    const { details, points } = generateBaccRoundResult();
    if (tableInfo.type === 0) {
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
    console.log("Settlement", new Date(), tableInfo);
    const res = await this.baccService.baccSettlement({
      roundId: tableInfo.currentRoundId,
      details: details,
    });
    return res.data;
  };

  changeShoes = (tableInfo: TableInfo) => {
    console.log("Shoes Changed", tableInfo);
  };
}
