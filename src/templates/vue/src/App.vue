<template>
  <div class="card">
    <div class="card-title">{{ projectName }}</div>
    <p class="card-desc">油猴脚本已成功运行 (Vue 3)</p>
    <magic-button @click="handleClick">点击测试</magic-button>
  </div>
</template>

<script setup>
import '@shared/components';
import { logger } from '@shared/utils';
import { useApp } from './useApp.js';

const { projectName } = useApp('{{NAME}}');

function handleClick() {
  logger.success(`[${projectName.value}] (Vue 3) 按钮被点击！`);
  alert(`来自 [${projectName.value}] (Vue 3) 的问候！`);
}
</script>

<style scoped src="./App.css"></style>
