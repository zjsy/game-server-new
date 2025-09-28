const tasks = [
  { name: "start", fn: () => console.log("Task A"), delay: 1000 },
  { name: "middle", fn: () => console.log("Task B"), delay: 2000 },
  { name: "end", fn: () => console.log("Task C"), delay: 1500 },
];

export async function runTasks() {
  for (const task of tasks) {
    await new Promise((resolve) =>
      setTimeout(() => {
        task.fn();
        resolve(true);
      }, task.delay)
    );
  }
}

import { ref, onMounted, onUnmounted } from "vue";

export function useBaccSchedule() {
  const tableInfo = ref({
    lobby: "",
    countdown: 0,
    roundNo: "",
    type: 0,
    gameType: 0,
    playStatus: 0,
    currentRoundId: "",
    currentShoe: 0,
    dealerNo: "",
  });

  // expose managed state as return value
  return { tableInfo };
}
