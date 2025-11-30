import { FetchClient } from "../../utils/http.utils";
import { BaseResponse, LoginTableResponse } from "../../types/types";
import { httpFetch } from "../../utils/http.utils";

const baseUrl = import.meta.env.VITE_BASE_URL || "";
export async function loginTableApi(requestData: { t: string; p: string }) {
  try {
    const res = await httpFetch(baseUrl + "/api/table-login", {
      method: "POST",
      body: JSON.stringify(requestData),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return (await res.json()) as BaseResponse<LoginTableResponse>;
  } catch (error) {
    throw error;
  }
}

export class BaseApiClient {
  public axiosClient: FetchClient;
  constructor(data: { token: string; refreshToken: string }) {
    const config = {
      baseURL: baseUrl,
      timeout: 10000,
      tokenStorage: data,
      refreshTokenUrl: "/api/refresh-token",
    };
    this.axiosClient = new FetchClient(config);
  }

  loginTableApi(data: { t: string; p: string }) {
    return this.axiosClient.post("/api/table-login", data);
  }

  loginDealerApi(data: { dealerNo: string }) {
    return this.axiosClient.post("/api/dealer-login", data);
  }
}
