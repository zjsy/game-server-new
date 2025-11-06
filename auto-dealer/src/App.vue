<template>
  <div id="app">
    <Table v-for="info in tableInfo" :key="info.tableNo" :table-no="info.tableNo" :dealer-no="info.dealerNo" />
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
      { tableNo: 'T1', dealerNo: 'D1' },
      { tableNo: 'T2', dealerNo: 'D2' },
      { tableNo: 'T3', dealerNo: 'D3' }
    ]
  }, 1000)
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
  margin-top: 60px;
}
</style>