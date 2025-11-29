import axios from "axios";
import { AxiosClient } from "../../utils/axios-utils";
import { BaseResponse, LoginTableResponse } from "../../types/types";

const baseUrl = import.meta.env.VITE_BASE_URL || "";
export async function loginTableApi(data: { t: string; p: string }) {
  const response = await axios.post<BaseResponse<LoginTableResponse>>(
    baseUrl + "/api/table-login",
    data
  );
  return response.data;
}

export class BaseApiClient {
  public axiosClient: AxiosClient;
  constructor(data: { token: string; refreshToken: string }) {
    const config = {
      baseURL: baseUrl,
      timeout: 10000,
      tokenStorage: data,
      refreshTokenUrl: "/api/refresh-token",
    };
    this.axiosClient = new AxiosClient(config);
  }

  loginDealerApi(data: { dealerNo: string }) {
    return this.axiosClient.post("/api/dealer-login", data);
  }
}
