import { BaseResponse, SettleRequest, StartResponse } from "../../types/types";
import { BullDetails } from "../../utils/BullUtils";
import { BaseApiClient } from "./api.service";

export class BullApiService extends BaseApiClient {
  startGame() {
    return this.axiosClient.post<BaseResponse<StartResponse>>(
      "/api/bull/start-game"
    );
  }

  dealingCards(data: { index: number; details: number }) {
    return this.axiosClient.post("/api/bull/dealing", data);
  }

  settlement(data: SettleRequest<BullDetails>) {
    return this.axiosClient.post("/api/bull/settle", data);
  }
}
