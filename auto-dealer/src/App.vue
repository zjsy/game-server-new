<template>
  <div id="app">
    <!-- 全局对话组件挂载点，可自定义插槽 -->
    <GlobalDialog>
      <template #title>
        <span>系统提示</span>
      </template>
      <template #footer="{ type, ok, cancel }">
        <button v-if="type === 'confirm'" class="px-3 py-1 rounded border" @click="cancel(false)">取消</button>
        <button class="px-3 py-1 rounded bg-blue-600 text-white" @click="ok(true)">好的</button>
      </template>
    </GlobalDialog>
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
import { httpFetch } from "./utils/http.utils";
import Table from './components/Table.vue'
import { dialog } from './utils/dialog'

type LoginInfoType = {
  tableNo: string
  dealerNo: string
}

const tableInfo = ref<LoginInfoType[]>([])

function fetchTableInfo() {
  // Simulate fetching data from an API
  httpFetch('http://localhost:8081/api/' + 'get-idle-table', { method: "POST", body: JSON.stringify({ mode: 'list', lobby: 'TEST' }), headers: { "Content-Type": "application/json" } }).then(async (response) => {
    const data = (await response.json())
    tableInfo.value = data.data.map((item) => {
      return {
        tableNo: item.tableNo,
        lobbyNo: item.lobbyNo,
        dealerNo: item.dealerNo
      }
    })
  }).catch((error) => {
    dialog.alert('获取桌台信息失败: ' + JSON.stringify(error))
    console.error('Error fetching table info:', error)
  })
}

const runStatus = ref(false)

async function startAll() {
  const confirmed = await dialog.confirm('确认启动所有桌台？')
  if (confirmed) {
    console.log('Starting all tables')
    runStatus.value = true
  }
}

async function stopAll() {
  const confirmed = await dialog.confirm('确认停止所有桌台？')
  if (confirmed) {
    console.log('Stopping all tables')
    runStatus.value = false
  }
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
  justify-content: flex-start;
  gap: 20px;
}
</style>