/**
 * 窗口管理器 - 管理日志窗口等多窗口
 */

import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { log } from '../services/logService';

let logWindow: WebviewWindow | null = null;

/**
 * 打开日志窗口
 */
export async function openLogWindow(): Promise<void> {
  try {
    // 如果窗口已存在，聚焦它
    if (logWindow) {
      await logWindow.setFocus();
      log.info('日志窗口已聚焦', { context: 'WindowManager' });
      return;
    }

    // 创建新的日志窗口
    logWindow = new WebviewWindow('log-window', {
      url: '#/log-window',
      title: '系统日志监视器',
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 500,
      resizable: true,
      center: true,
      focus: true,
      alwaysOnTop: false,
    });

    // 监听窗口关闭事件
    logWindow.once('tauri://close-requested', () => {
      logWindow = null;
      log.info('日志窗口已关闭', { context: 'WindowManager' });
    });

    log.info('日志窗口已打开', { context: 'WindowManager' });
  } catch (error) {
    log.error('打开日志窗口失败', error as Error, { context: 'WindowManager' });
    throw error;
  }
}

/**
 * 关闭日志窗口
 */
export async function closeLogWindow(): Promise<void> {
  if (logWindow) {
    await logWindow.close();
    logWindow = null;
    log.info('日志窗口已关闭', { context: 'WindowManager' });
  }
}

/**
 * 检查日志窗口是否打开
 */
export function isLogWindowOpen(): boolean {
  return logWindow !== null;
}
