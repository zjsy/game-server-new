import { reactive } from "vue";

export type DialogType = "alert" | "confirm";

interface DialogState {
  show: boolean;
  type: DialogType;
  title?: string;
  message?: string;
  resolve: ((v: boolean) => void) | null;
  // 允许通过插槽渲染自定义内容时，保留附加数据
  payload?: unknown;
}

const state = reactive<DialogState>({
  show: false,
  type: "alert",
  title: "",
  message: "",
  resolve: null,
  payload: undefined,
});

function open(options: {
  type?: DialogType;
  title?: string;
  message?: string;
  payload?: unknown;
}) {
  state.type = options.type ?? "alert";
  state.title = options.title ?? "";
  state.message = options.message ?? "";
  state.payload = options.payload;
  state.show = true;
  return new Promise<boolean>((resolve) => {
    state.resolve = resolve;
  });
}

function close(result: boolean) {
  state.show = false;
  state.resolve?.(result);
  state.resolve = null;
}

export const dialog = {
  // 暴露状态供全局组件使用（v-model、插槽渲染）
  state,
  open,
  close,
  alert(message: string, title?: string) {
    return open({ type: "alert", message, title });
  },
  confirm(message: string, title?: string) {
    return open({ type: "confirm", message, title });
  },
};
