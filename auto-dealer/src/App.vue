<template>
  <div id="app">
    <div>
      <button @click="startAll">Start All</button>
      <button @click="stopAll">Stop All</button>
    </div>
    <div class="table-box">
        <Table v-for="info in tableInfo" :key="info.tableNo" :table-no="info.tableNo" :dealer-no="info.dealerNo" :run-status="runStatus" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref,onMounted } from 'vue'
import Table from './components/Table.vue'

type LoginInfoType = {
  tableNo: string
  dealerNo: string
}

const tableInfo = ref<LoginInfoType[]>([])

function fetchTableInfo() {
  // Simulate fetching data from an API
  setTimeout(() => {
    tableInfo.value = [
      { tableNo: 'B01', dealerNo: 'D1' },
      { tableNo: 'B02', dealerNo: 'D2' },
      { tableNo: 'B03', dealerNo: 'D3' }
    ]
  }, 1000)
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