<template>
  <div class="card">
    <button type="button" @click="start">start</button>
  </div>


</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBaccSchedule } from '../game-schedule/bacc-schedule'

const { tableNo } = defineProps<{
  tableNo: string
}>()

watch(() => tableNo, (newVal) => {
  console.log('tableNo changed:', newVal)
}, { immediate: true })

const { tableInfo } = useBaccSchedule()

function start() { }

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

</script>

<style scoped>
.read-the-docs {
  color: #888;
}

.card {
  padding: 2em;
}


button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}
</style>