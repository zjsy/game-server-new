import { createApp } from "vue";
import { createVfm } from "vue-final-modal";
import "./style.css";
import "vue-final-modal/style.css";
import App from "./App.vue";
import DialogPlugin from "./utils/dialog/plugin";

const vfm = createVfm();
const app = createApp(App);
app.use(vfm);
app.use(DialogPlugin);
app.mount("#app");
