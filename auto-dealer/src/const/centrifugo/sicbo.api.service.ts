import { BaseResponse, SettleRequest, StartResponse } from "../../types/types";
import { BaseApiClient } from "./api.service";

export class SicboApiService extends BaseApiClient {
  startGame() {
    return this.axiosClient.post<BaseResponse<StartResponse>>(
      "/api/sicbo/start-game"
    );
  }

  settlement(data: SettleRequest<number[]>) {
    return this.axiosClient.post("/api/sicbo/settle", data);
  }
}
