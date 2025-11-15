import axios from "axios";

function postWithAuth(url: string, data: any, token: string) {
  return axios.post(url, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function loginTableApi(data: { t: string; p: string }) {
  return axios.post("/api/loginTable", data);
}

export function loginDealerApi(data: { dealerNo: string }, token: string) {
  return postWithAuth("/api/loginDealer", data, token);
}

export function baccStartGame(data: { dealerNo: string }, token: string) {
  return postWithAuth("/api/baccStartGame", data, token);
}

export function baccdealingCards(data: { dealerNo: string }, token: string) {
  return postWithAuth("/api/baccdealingCards", data, token);
}

export function baccSettlement(data: { dealerNo: string }, token: string) {
  return postWithAuth("/api/baccSettlement", data, token);
}
