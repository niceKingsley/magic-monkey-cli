import './style.css';
import '@shared/components';
import { logger } from '@shared/utils';

logger.info('{{NAME}} (Vanilla JS) 脚本已加载！');

const initApp = () => {
  const container = document.createElement('div');
  container.className = 'card';
  container.innerHTML = `
    <div class="card-title">{{NAME}}</div>
    <p class="card-desc">油猴脚本已成功运行 (Vanilla JS)</p>
    <magic-button id="btn-{{NAME}}">点击测试</magic-button>
  `;
  document.body.appendChild(container);

  container.querySelector('#btn-{{NAME}}')?.addEventListener('click', () => {
    logger.success('{{NAME}} (Vanilla JS) 按钮被点击！');
    alert('来自 {{NAME}} (Vanilla JS) 的问候！');
  });
};

if (document.body) {
  initApp();
} else {
  window.addEventListener('DOMContentLoaded', initApp);
}

