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
  log.debug('请求打开日志窗口...', { context: 'WindowManager' });

  try {
    // 如果窗口已存在，聚焦它
    if (logWindow) {
      log.debug('日志窗口实例已存在，尝试聚焦...', { context: 'WindowManager' });
      await logWindow.setFocus();
      log.info('日志窗口已聚焦', { context: 'WindowManager' });
      return;
    }

    log.debug('创建新的日志窗口实例...', { context: 'WindowManager' });

    const windowConfig = {
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
    };

    log.debug(`窗口配置: ${JSON.stringify(windowConfig)}`, { context: 'WindowManager' });

    // 创建新的日志窗口
    logWindow = new WebviewWindow('log-window', windowConfig);

    // 监听窗口创建事件
    logWindow.once('tauri://created', () => {
      log.info('日志窗口创建成功 (tauri://created)', { context: 'WindowManager' });
    });

    // 监听窗口创建错误
    logWindow.once('tauri://error', (e) => {
      log.error(`日志窗口创建错误: ${JSON.stringify(e)}`, undefined, { context: 'WindowManager' });
    });

    // 监听窗口关闭事件
    logWindow.once('tauri://close-requested', () => {
      log.debug('日志窗口收到关闭请求 (tauri://close-requested)', { context: 'WindowManager' });
      logWindow = null;
      log.info('日志窗口实例已清理', { context: 'WindowManager' });
    });

    log.info('日志窗口已创建: label=log-window, size=1000x700', { context: 'WindowManager' });
  } catch (error) {
    log.error('打开日志窗口失败', error as Error, { context: 'WindowManager' });
    throw error;
  }
}

/**
 * 关闭日志窗口
 */
export async function closeLogWindow(): Promise<void> {
  log.debug('请求关闭日志窗口...', { context: 'WindowManager' });

  if (logWindow) {
    log.debug('正在关闭日志窗口...', { context: 'WindowManager' });
    await logWindow.close();
    logWindow = null;
    log.info('日志窗口已关闭并清理', { context: 'WindowManager' });
  } else {
    log.debug('日志窗口不存在，无需关闭', { context: 'WindowManager' });
  }
}

/**
 * 检查日志窗口是否打开
 */
export function isLogWindowOpen(): boolean {
  const isOpen = logWindow !== null;
  log.debug(`检查日志窗口状态: ${isOpen ? '已打开' : '未打开'}`, { context: 'WindowManager' });
  return isOpen;
}
