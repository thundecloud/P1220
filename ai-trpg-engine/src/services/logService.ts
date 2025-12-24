/**
 * 日志服务 - 统一的前端日志管理
 *
 * 功能：
 * - 调用 Tauri 后端日志命令
 * - 在开发模式下同时输出到浏览器控制台
 * - 提供不同级别的日志记录方法
 * - 支持上下文标记
 */

import { invoke } from '@tauri-apps/api/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const LogLevel = {
  DEBUG: 'debug' as LogLevel,
  INFO: 'info' as LogLevel,
  WARN: 'warn' as LogLevel,
  ERROR: 'error' as LogLevel,
} as const;

export interface LogOptions {
  context?: string;  // 日志上下文（如: 'GameMain', 'AIService'）
  consoleOnly?: boolean;  // 仅输出到浏览器控制台，不调用后端
}

class LogService {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * DEBUG 级别日志
   */
  async debug(message: string, options?: LogOptions): Promise<void> {
    this.log(LogLevel.DEBUG, message, options);
  }

  /**
   * INFO 级别日志
   */
  async info(message: string, options?: LogOptions): Promise<void> {
    this.log(LogLevel.INFO, message, options);
  }

  /**
   * WARN 级别日志
   */
  async warn(message: string, options?: LogOptions): Promise<void> {
    this.log(LogLevel.WARN, message, options);
  }

  /**
   * ERROR 级别日志
   */
  async error(message: string, error?: Error, options?: LogOptions): Promise<void> {
    const errorMessage = error
      ? `${message}\nError: ${error.message}\nStack: ${error.stack}`
      : message;
    this.log(LogLevel.ERROR, errorMessage, options);
  }

  /**
   * 通用日志记录方法
   */
  private async log(
    level: LogLevel,
    message: string,
    options?: LogOptions
  ): Promise<void> {
    const context = options?.context;
    const consoleOnly = options?.consoleOnly || false;

    // 在开发模式下输出到浏览器控制台
    if (this.isDevelopment) {
      const logPrefix = context ? `[${context}]` : '';
      const logMessage = `${logPrefix} ${message}`;

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(logMessage);
          break;
        case LogLevel.INFO:
          console.info(logMessage);
          break;
        case LogLevel.WARN:
          console.warn(logMessage);
          break;
        case LogLevel.ERROR:
          console.error(logMessage);
          break;
      }
    }

    // 调用 Tauri 后端日志命令（除非指定 consoleOnly）
    if (!consoleOnly) {
      try {
        const command = `log_${level}`;
        await invoke(command, { message, context });
      } catch (err) {
        // 如果后端日志调用失败，至少在控制台记录
        console.error('Failed to invoke backend log command:', err);
      }
    }
  }

  /**
   * 批量日志记录（用于复杂对象）
   */
  async logObject(
    level: LogLevel,
    label: string,
    obj: any,
    options?: LogOptions
  ): Promise<void> {
    const message = `${label}\n${JSON.stringify(obj, null, 2)}`;
    this.log(level, message, options);
  }

  /**
   * 性能计时日志
   */
  async logTiming(
    label: string,
    startTime: number,
    options?: LogOptions
  ): Promise<void> {
    const duration = Date.now() - startTime;
    const message = `${label} 耗时: ${duration}ms`;
    this.log(LogLevel.DEBUG, message, options);
  }
}

// 导出单例
export const logger = new LogService();

// 导出便捷函数
export const log = {
  debug: (msg: string, options?: LogOptions) => logger.debug(msg, options),
  info: (msg: string, options?: LogOptions) => logger.info(msg, options),
  warn: (msg: string, options?: LogOptions) => logger.warn(msg, options),
  error: (msg: string, error?: Error, options?: LogOptions) =>
    logger.error(msg, error, options),
  object: (level: LogLevel, label: string, obj: any, options?: LogOptions) =>
    logger.logObject(level, label, obj, options),
  timing: (label: string, startTime: number, options?: LogOptions) =>
    logger.logTiming(label, startTime, options),
};

export default logger;
