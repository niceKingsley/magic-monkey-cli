/**
 * Tampermonkey / 油猴脚本标准全局变量配置字典
 * 供 ESLint (Flat Config) 等代码检查工具直接解构引入：
 *
 * import { monkeyGlobals } from 'magic-monkey-cli';
 * globals: { ...globals.browser, ...monkeyGlobals }
 */
export const monkeyGlobals = {
  unsafeWindow: 'readonly',
  monkeyWindow: 'readonly',
  GM: 'readonly',
  GM_info: 'readonly',
  GM_addStyle: 'readonly',
  GM_addElement: 'readonly',
  GM_getValue: 'readonly',
  GM_setValue: 'readonly',
  GM_deleteValue: 'readonly',
  GM_listValues: 'readonly',
  GM_addValueChangeListener: 'readonly',
  GM_removeValueChangeListener: 'readonly',
  GM_getResourceText: 'readonly',
  GM_getResourceURL: 'readonly',
  GM_registerMenuCommand: 'readonly',
  GM_unregisterMenuCommand: 'readonly',
  GM_openInTab: 'readonly',
  GM_xmlhttpRequest: 'readonly',
  GM_download: 'readonly',
  GM_getTab: 'readonly',
  GM_saveTab: 'readonly',
  GM_getTabs: 'readonly',
  GM_notification: 'readonly',
  GM_setClipboard: 'readonly',
  GM_cookie: 'readonly',
  GM_webRequest: 'readonly',
  GM_log: 'readonly',
};
