<template>
    <!-- 使用 vue-final-modal 的层级管理与插槽 -->
    <VueFinalModal v-model="dialog.state.show" :focus-trap="false" :click-to-close="true"
        content-class="dialog-content">
        <!-- 头部插槽，可外部覆盖 -->
        <header class="dialog-header" v-if="dialog.state.title">
            <slot name="title">
                <h3 class="dialog-title">{{ dialog.state.title }}</h3>
            </slot>
        </header>

        <!-- 主体插槽 -->
        <section class="dialog-body">
            <slot>
                <p class="dialog-message">
                    {{ dialog.state.message }}
                </p>
            </slot>
        </section>

        <!-- 底部插槽：按钮区可替换 -->
        <footer class="dialog-footer">
            <slot name="footer" :type="dialog.state.type" :ok="onOk" :cancel="onCancel">
                <button v-if="dialog.state.type === 'confirm'" class="dialog-btn dialog-btn-cancel"
                    @click="onCancel(false)">
                    取消
                </button>
                <button class="dialog-btn dialog-btn-ok" @click="onOk(true)">
                    确定
                </button>
            </slot>
        </footer>
    </VueFinalModal>
</template>

<script setup lang="ts">
import { dialog } from "./index";
import { VueFinalModal } from "vue-final-modal";

function onOk(v: boolean) {
    dialog.close(v);
}
function onCancel(v: boolean) {
    dialog.close(v);
}
</script>

<style>
/* must global css */
.dialog-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    max-width: 448px;
    width: 60%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.dialog-header {
    padding: 16px 16px 0;
}

.dialog-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.dialog-body {
    padding: 8px 16px;
}

.dialog-message {
    font-size: 14px;
    color: #374151;
    white-space: pre-line;
    margin: 0;
}

.dialog-footer {
    padding: 8px 16px 16px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.dialog-btn {
    padding: 6px 12px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.dialog-btn-cancel {
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
}

.dialog-btn-cancel:hover {
    background: #f3f4f6;
}

.dialog-btn-ok {
    background: #2563eb;
    color: white;
}

.dialog-btn-ok:hover {
    background: #1d4ed8;
}
</style>
