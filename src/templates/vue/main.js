import { createApp } from 'vue';
import { logger } from '@shared/utils';
import App from './src/App.vue';

logger.info('{{NAME}} (Vue 3) 脚本已加载！');

const initApp = () => {
  const container = document.createElement('div');
  container.id = '{{NAME}}-root';
  document.body.appendChild(container);

  createApp(App).mount(container);
};

if (document.body) {
  initApp();
} else {
  window.addEventListener('DOMContentLoaded', initApp);
}
