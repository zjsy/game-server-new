<template>
  <div class="card">
    <div>
      <div>Table No: {{ tableInfo.tableNo }}</div>
      <div>Shoe No: {{ tableInfo.currentShoe }}</div>
      <div>Round No: {{ tableInfo.roundNo }}</div>
      <div>Countdown: {{ tableInfo.countdown }}</div>
      <div>Play Status: {{ tableInfo.playStatus }}</div>
      <div>Current Countdown: {{ tableInfo.currentCountdown }}</div>
    </div>
    <button type="button" @click="start">start</button>
    <button type="button" @click="stop">stop</button>
  </div>


</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { dialog } from '../utils/dialog'
import { BaccTaskPipeline, TaskPipeline } from '../game-schedule/bacc-schedule'
import { GameType } from '../const/GameConst';
import { BaccApiService } from '../const/centrifugo/bacc.api.service';
import { loginTableApi } from '../const/centrifugo/api.service';
import { DtApiService } from '../const/centrifugo/dt.api.service';
import { DtTaskPipeline } from '../game-schedule/dt-schedule';
import { SicboApiService } from '../const/centrifugo/sicbo.api.service';
import { SicboTaskPipeline } from '../game-schedule/sicbo-schedule';
import { RouletteApiService } from '../const/centrifugo/roulette.api.service';
import { RouletteTaskPipeline } from '../game-schedule/roulette-schedule';
import { FastSicboApiService } from '../const/centrifugo/fast-sicbo.api.service';
import { FastSicboTaskPipeline } from '../game-schedule/fast-sicbo-schedule';
import { DpApiService } from '../const/centrifugo/dp.api.service';
import { DpTaskPipeline } from '../game-schedule/dp-schedule';
import { SeDieApiService } from '../const/centrifugo/sedie.api.service';
import { SedieTaskPipeline } from '../game-schedule/sedie-schedule';
import { BullApiService } from '../const/centrifugo/bull.api.service';
import { BullTaskPipeline } from '../game-schedule/bull-schedule';

const { tableNo, dealerNo, runStatus } = defineProps<{
  tableNo: string
  dealerNo: string
  runStatus: boolean
}>()
const tableInfo = reactive({
  tableNo: '',
  countdown: 0,
  roundNo: 0,
  type: 0,
  gameType: 0,
  playStatus: 0,
  currentShoe: 0,
  currentRoundId: 0,
  currentCountdown: 0,
});
watch(() => tableNo, (newVal) => {
  console.log('tableNo changed:', newVal)
  tableInfo.tableNo = newVal;
}, { immediate: true })

watch(() => runStatus, (newVal) => {
  console.log('runStatus changed:', newVal)
  if (newVal) {
    start();
  } else {
    stop();
  }
})



let pipeline: TaskPipeline | undefined = undefined;
function start() {
  console.log(`Starting login for Table No: ${tableNo}, Dealer No: ${dealerNo}`);
  loginTable();
}

function stop() {
  console.log(`Stopping login for Table No: ${tableNo}, Dealer No: ${dealerNo}`);
  pipeline?.stop();
}

async function loginTable() {
  try {
    const res = await loginTableApi({ t: tableNo, p: '123456', })
    if (res.code !== 0) {
      await dialog.alert('Login Table Failed: ' + res.msg)
      console.error('Login Table Failed:', res.msg);
      return;
    }
    console.log('Login Table Response:', res);
    const data = res.data;
    console.log("Bacc Task Pipeline Started", data);
    tableInfo.tableNo = data.table_no;
    tableInfo.countdown = data.countdown;
    tableInfo.roundNo = data.current_round_no;
    tableInfo.type = data.type;
    tableInfo.gameType = data.game_type;
    tableInfo.playStatus = data.playStatus;
    tableInfo.currentShoe = data.current_shoe;
    tableInfo.currentRoundId = data.current_round_id;
    const diff = data.roundStopTime - Date.now();
    tableInfo.currentCountdown = diff > 0 ? Math.ceil(diff / 1000) : 0;
    const gameType = data.game_type;
    if (gameType === GameType.BACCARAT) {
      const apiService = new BaccApiService({
        token: data.token,
        refreshToken: data.refreshToken,
      });
      if (pipeline) {
        pipeline.destroy();
      } else {
        pipeline = new BaccTaskPipeline(apiService);
      }
      pipeline.start(tableInfo);
    } else if (gameType === GameType.DRAGONTIGER) {
      const apiService = new DtApiService({
        token: data.token,
        refreshToken: data.refreshToken,
      });
      if (pipeline) {
        pipeline.destroy();
      } else {
        pipeline = new DtTaskPipeline(apiService);
      }
      pipeline.start(tableInfo);
    } else if (gameType === GameType.Sicbo) {
      const apiService = new SicboApiService({
        token: data.token,
        refreshToken: data.refreshToken,
      });
      if (pipeline) {
        pipeline.destroy();
      } else {
        pipeline = new SicboTaskPipeline(apiService);
      }
      pipeline.start(tableInfo);
    } else if (gameType === GameType.Roulette) {
      const apiService = new RouletteApiService({
        token: data.token,
        refreshToken: data.refreshToken,
      });
      if (pipeline) {
        pipeline.destroy();
      } else {
        pipeline = new RouletteTaskPipeline(apiService);
      }
      pipeline.start(tableInfo);
    } else if (gameType === GameType.BullFight) {
      const apiService = new BullApiService({
        token: data.token,
        refreshToken: data.refreshToken,
      });
      if (pipeline) {
        pipeline.destroy();
      } else {
        pipeline = new BullTaskPipeline(apiService);
      }
      pipeline.start(tableInfo);
    }
    else if (gameType === GameType.FASTSICBO) {
      const apiService = new FastSicboApiService({
        token: data.token,
        refreshToken: data.refreshToken,
      }); if (pipeline) {
        pipeline.destroy();
      } else {
        pipeline = new FastSicboTaskPipeline(apiService);
      }
      pipeline.start(tableInfo);
    } else if (gameType === GameType.DragonPhoenix) {
      const apiService = new DpApiService({
        token: data.token,
        refreshToken: data.refreshToken,
      });
      if (pipeline) {
        pipeline.destroy();
      } else {
        pipeline = new DpTaskPipeline(apiService);
      }
      pipeline.start(tableInfo);
    } else if (gameType === GameType.SEDIE) {
      const apiService = new SeDieApiService({
        token: data.token,
        refreshToken: data.refreshToken,
      });
      if (pipeline) {
        pipeline.destroy();
      } else {
        pipeline = new SedieTaskPipeline(apiService);
      }
      pipeline.start(tableInfo);
    }
  } catch (error) {
    console.error('Login Table Error:', error);
    await dialog.alert('call api failed: ' + JSON.stringify(error))
    return;
  }
}

</script>

<style scoped>
.read-the-docs {
  color: #888;
}

.card {
  padding: 10px;
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