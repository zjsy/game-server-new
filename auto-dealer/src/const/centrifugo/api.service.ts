import { AxiosClient } from "../../utils/axios-utils";

export class BaseApiClient {
  public axiosClient;
  constructor() {
    const config = {
      baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3000/",
      timeout: 10000,
      tokenStorage: {},
      refreshTokenUrl: "/api/table/refresh-token",
    };
    this.axiosClient = new AxiosClient(config);
  }

  loginDealerApi(data: { dealerNo: string }) {
    return this.axiosClient.post("/api/table/dealer-login", data);
  }
}
