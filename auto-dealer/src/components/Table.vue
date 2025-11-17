<template>
  <div class="card">
    <h2>Table No: {{ tableNo }}</h2>
    <button type="button" @click="start">start</button>
    <button type="button" @click="stop">stop</button>
  </div>


</template>

<script setup lang="ts">
import {  watch } from 'vue'
import { BaccTaskPipeline, TaskPipeline } from '../game-schedule/bacc-schedule'
import { GameType } from '../const/GameConst';
import { BaccApiService } from '../const/centrifugo/bacc.api.service';
import { loginTableApi } from '../const/centrifugo/api.service';

const { tableNo, dealerNo ,runStatus} = defineProps<{
  tableNo: string
  dealerNo: string
  runStatus: boolean
}>()

  watch(() => tableNo, (newVal) => {
    console.log('tableNo changed:', newVal)
  }, { immediate: true })

    watch(() => runStatus, (newVal) => {
      console.log('runStatus changed:', newVal)
      if(newVal){
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
   const res = await loginTableApi({ t: tableNo, p: '123456', })
   console.log('Login Table Response:', res);
   const data = res.data;

    const gameType = data.game_type;
   if (gameType === GameType.BACCARAT) {
      const apiService = new BaccApiService({
        token: data.token,
        refreshToken: data.refreshToken,
      });
      pipeline = new BaccTaskPipeline(apiService);
      pipeline.start(data);
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