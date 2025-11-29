import { BaseResponse, SettleRequest, StartResponse } from "../../types/types";
import { BaseApiClient } from "./api.service";

export class FastSicboApiService extends BaseApiClient {
  startGame() {
    return this.axiosClient.post<BaseResponse<StartResponse>>(
      "/api/fast-sicbo/start-game"
    );
  }

  settlement(data: SettleRequest<{ d: number }>) {
    return this.axiosClient.post("/api/fast-sicbo/settle", data);
  }
}
