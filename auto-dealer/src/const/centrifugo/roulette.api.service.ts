import { BaseResponse, SettleRequest, StartResponse } from "../../types/types";
import { BaseApiClient } from "./api.service";

export class RouletteApiService extends BaseApiClient {
  startGame() {
    return this.axiosClient.post<BaseResponse<StartResponse>>(
      "/api/roulette/start-game"
    );
  }

  settlement(data: SettleRequest<{ n: number }>) {
    return this.axiosClient.post("/api/roulette/settle", data);
  }
}
