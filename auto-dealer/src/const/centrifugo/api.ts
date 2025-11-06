import axios from "axios";

export function loginTableApi(data: {
  lobbyNo: string;
  tableNo: string;
  loginType: number;
  token: string;
}) {
  return axios.post("/api/loginTable", data);
}

export function loginDealerApi(data: { dealerNo: string }) {
  return axios.post("/api/loginDealer", data);
}
