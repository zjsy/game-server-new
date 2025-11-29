import {
  BaseResponse,
  SettleRequest,
  ShuffleResponse,
  StartResponse,
} from "../../types/types";
import { BaseApiClient } from "./api.service";

export class DtApiService extends BaseApiClient {
  startGame() {
    return this.axiosClient.post<BaseResponse<StartResponse>>(
      "/api/dt/start-game"
    );
  }

  dealingCards(data: { index: number; details: number }) {
    return this.axiosClient.post("/api/dt/dealing", data);
  }

  settlement(data: SettleRequest<{ d: number; t: number }>) {
    return this.axiosClient.post("/api/dt/settle", data);
  }

  newShoes() {
    return this.axiosClient.post<BaseResponse<ShuffleResponse>>(
      "/api/dt/shuffle"
    );
  }
}
