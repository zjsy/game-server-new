import { BaseResponse, SettleRequest, StartResponse } from "../../types/types";
import { BaseApiClient } from "./api.service";

export class DpApiService extends BaseApiClient {
  startGame() {
    return this.axiosClient.post<BaseResponse<StartResponse>>(
      "/api/dp/start-game"
    );
  }

  dealingCards(data: { index: number; details: number }) {
    return this.axiosClient.post("/api/dp/dealing", data);
  }

  settlement(data: SettleRequest<{ d: number[]; p: number[] }>) {
    return this.axiosClient.post("/api/dp/settle", data);
  }
}
