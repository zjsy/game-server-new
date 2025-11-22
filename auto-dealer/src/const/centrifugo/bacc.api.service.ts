import {
  BaseResponse,
  SettleRequest,
  ShuffleResponse,
  StartResponse,
} from "../../types/types";
import { BaseApiClient } from "./api.service";

export class BaccApiService extends BaseApiClient {
  baccStartGame() {
    return this.axiosClient.post<BaseResponse<StartResponse>>(
      "/api/bacc/start-game"
    );
  }

  baccDealingCards(data: { index: number; details: number }) {
    return this.axiosClient.post("/api/bacc/dealing", data);
  }

  baccSettlement(data: SettleRequest<{ b: number[]; p: number[] }>) {
    return this.axiosClient.post("/api/bacc/settle", data);
  }

  baccNewShoes() {
    return this.axiosClient.post<BaseResponse<ShuffleResponse>>(
      "/api/bacc/shuffle"
    );
  }
}
