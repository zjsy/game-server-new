import { App, h } from "vue";
import { dialog } from "./index";
import GlobalDialog from "./GlobalDialog.vue";

export default {
  install(app: App) {
    // 全局属性，组件内可通过 this.$dialog / getCurrentInstance 访问
    (app.config.globalProperties as any).$dialog = dialog;

    // 将全局对话组件挂到应用根，利用 vue-final-modal 的层级管理
    // 创建一个全局容器并以 Teleport 方式呈现（此处直接全局注册组件并在 App 根渲染）
    // 方案：注册为全局组件，开发者在 App.vue 放置一个 <GlobalDialog/> 即可
    app.component("GlobalDialog", GlobalDialog);
  },
};
