import { BaseResponse, SettleRequest, StartResponse } from "../../types/types";
import { BaseApiClient } from "./api.service";

export class SeDieApiService extends BaseApiClient {
  startGame() {
    return this.axiosClient.post<BaseResponse<StartResponse>>(
      "/api/sedie/start-game"
    );
  }

  settlement(data: SettleRequest<{ rc: number }>) {
    return this.axiosClient.post("/api/sedie/settle", data);
  }
}
