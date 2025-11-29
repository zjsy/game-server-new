<template>
  <div id="app">
    <div>
      <button @click="startAll">Start All</button>
      <button @click="stopAll">Stop All</button>
    </div>
    <div class="table-box">
      <Table v-for="info in tableInfo" :key="info.tableNo" :table-no="info.tableNo" :dealer-no="info.dealerNo"
        :run-status="runStatus" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Table from './components/Table.vue'
import axios from 'axios'

type LoginInfoType = {
  tableNo: string
  dealerNo: string
}

const tableInfo = ref<LoginInfoType[]>([])

function fetchTableInfo() {
  // Simulate fetching data from an API
  axios.post('http://localhost:8081/api/' + 'get-idle-table', { mode: 'list', lobby: 'TEST' }).then((response) => {
    tableInfo.value = response.data.data.map((item) => {
      return {
        tableNo: item.tableNo,
        lobbyNo: item.lobbyNo,
        dealerNo: item.dealerNo
      }
    })
  }).catch((error) => {
    console.error('Error fetching table info:', error)
  })
}

const runStatus = ref(false)

function startAll() {
  console.log('Starting all tables')
  runStatus.value = true
}

function stopAll() {
  console.log('Stopping all tables')
  runStatus.value = false
}

onMounted(() => {
  fetchTableInfo()
})
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.table-box {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}
</style>