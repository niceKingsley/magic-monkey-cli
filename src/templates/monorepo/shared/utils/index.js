/**
 * 等待指定选择器的 DOM 元素出现
 * @param {string} selector CSS 选择器
 * @param {number} timeout 超时时间 (毫秒)，默认 10000ms
 * @returns {Promise<Element>}
 */
export function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const target = document.querySelector(selector);
      if (target) {
        observer.disconnect();
        resolve(target);
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

/**
 * 彩色美化日志输出工具
 */
export const logger = {
  info: (msg, ...args) =>
    console.log(
      `%c[MagicMonkey]%c ${msg}`,
      'color:#3b82f6;font-weight:bold',
      'color:inherit',
      ...args,
    ),
  success: (msg, ...args) =>
    console.log(
      `%c[MagicMonkey]%c ${msg}`,
      'color:#10b981;font-weight:bold',
      'color:inherit',
      ...args,
    ),
  warn: (msg, ...args) =>
    console.warn(
      `%c[MagicMonkey]%c ${msg}`,
      'color:#f59e0b;font-weight:bold',
      'color:inherit',
      ...args,
    ),
  error: (msg, ...args) =>
    console.error(
      `%c[MagicMonkey]%c ${msg}`,
      'color:#ef4444;font-weight:bold',
      'color:inherit',
      ...args,
    ),
};
