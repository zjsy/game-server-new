import { baccStartGame } from "../const/centrifugo/api";
import {
  LoginTableResponse,
  RoundStatus,
  StartResponse,
} from "../const/GameConst";

type Fn<T, R> = (arg: T) => R;

type Task = { name: string; fn: Fn<any, any>; delay: number };

const startGame = (tableInfo: TableInfo): void => {
  console.log("Game Start", tableInfo);
  baccStartGame({ dealerNo: tableInfo.tableNo }, tableInfo.token).then(
    (res) => {
      const data = res.data as StartResponse;
      console.log("Start Game Response:", data);
      tableInfo.currentRoundId = data.;
    }
  );
};

const dealingCards = (tableInfo: TableInfo) => {
  console.log("Cards Dealing", tableInfo);
};

const settlement = (tableInfo: TableInfo) => {
  console.log("Settlement", tableInfo);

  // 如果大于90局
  if (tableInfo.roundNo > 90) {
    changeShoes(tableInfo);
  }
};

const changeShoes = (tableInfo: TableInfo) => {
  console.log("Shoes Changed", tableInfo);
};

const tasks = [
  { name: "startGame", fn: startGame, delay: 1000 },
  { name: "dealingCards", fn: dealingCards, delay: 2000 },
  { name: "settlement", fn: settlement, delay: 1500 },
];

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
  private tasks: Array<Task>;
  private tableInfo: TableInfo | null = null;
  constructor() {
    this.tasks = tasks;
    this.running = false;
  }

  async runPipeline() {
    this.running = true;
    while (this.running) {
      for (const task of this.tasks) {
        await task.fn(this.tableInfo);
        await new Promise((input) => setTimeout(input, task.delay));
      }
    }
  }

  async start(data: LoginTableResponse) {
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

    for (let i = startIndex; i < tasks.length; i++) {
      const task = tasks[i];
      await task.fn(this.tableInfo);
      await new Promise((input) => setTimeout(input, task.delay));
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
}
