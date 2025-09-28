import { loginTableApi,loginDealerApi } from "../const/centrifugo/api";

export function loginDealer(dealerNo: string) {
  loginDealerApi({
    dealerNo,
  }).then((res) => {});
}


export async function loginTable() {
  loginTableApi({
    lobbyNo: "123",
    tableNo: "456",
    loginType: 1,
    token: "abc",
  })
    .then((res) => {})
    .catch((err) => {
                this.loginDealer({ dealerNo: this.dealerInfo.dealerNo });
                const data = res.data;
                this.tableInfo.lobby = data.lobby_no;
                this.tableInfo.countdown = data.countdown;
                this.tableInfo.roundNo = data.current_round_no;
                this.tableInfo.type = data.type;
                this.tableInfo.gameType = data.game_type;
                const gameType = data.game_type;
                if (data.playStatus === 0) {
                  let countdown = data.countdown;
                  if (data.roundCountdown !== undefined) {
                    countdown = data.roundCountdown;
                  }
                  setTimeout(() => {
                    this.settlement(data.current_round_id);
                  }, (countdown + 3) * 1000);
                } else if (data.playStatus === 1) {
                  this.settlement(data.current_round_id);
                } else {
                  if (
                    gameType === GameType.BACCARAT ||
                    gameType === GameType.DRAGONTIGER
                  ) {
                    if (data.current_shoe / 100 < getShoeNoDate()) {
                      // 如果靴号小于今天，换靴
                      this.changeShoes();
                    }
                  }
                  setTimeout(() => {
                    this.startPlay();
                  }, 3000);
    });
}