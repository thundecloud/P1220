/**
 * 日志查看器页面
 * 显示应用运行日志，方便调试和问题排查
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { log } from '../services/logService';

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
}

export default function LogViewer() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 模拟日志数据（实际应该从后端或localStorage读取）
  useEffect(() => {
    // 添加示例日志
    const sampleLogs: LogEntry[] = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'AI-TRPG Engine 启动中...',
        context: 'Application',
      },
      {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message: '加载配置文件',
        context: 'ConfigService',
      },
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: '日志系统初始化完成',
        context: 'LogService',
      },
      {
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: '未找到存档文件，将创建新存档',
        context: 'SaveService',
      },
    ];

    setLogs(sampleLogs);

    // 记录页面访问日志
    log.info('日志查看器页面已打开', { context: 'LogViewer' });
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // 获取日志级别的颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'text-[var(--color-accent-sapphire)]';
      case 'info':
        return 'text-[var(--color-accent-emerald)]';
      case 'warn':
        return 'text-[var(--color-accent-amber)]';
      case 'error':
        return 'text-[var(--color-accent-crimson)]';
      default:
        return 'text-[var(--color-foreground)]';
    }
  };

  // 获取日志级别的标签
  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'debug':
        return 'DEBUG';
      case 'info':
        return 'INFO ';
      case 'warn':
        return 'WARN ';
      case 'error':
        return 'ERROR';
      default:
        return level.toUpperCase();
    }
  };

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
    log.info('日志已清空', { context: 'LogViewer' });
  };

  // 导出日志
  const exportLogs = () => {
    const logText = logs
      .map(
        log =>
          `[${new Date(log.timestamp).toLocaleString()}] [${log.level.toUpperCase()}] ${
            log.context ? `[${log.context}] ` : ''
          }${log.message}`
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    log.info('日志已导出', { context: 'LogViewer' });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      {/* 页面头部 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">日志查看器</h1>
            <p className="text-[var(--color-muted-foreground)] mt-2">
              查看应用运行日志，方便调试和问题排查
            </p>
          </div>
          <button
            onClick={() => navigate('/config')}
            className="px-4 py-2"
          >
            返回配置
          </button>
        </div>

        {/* 工具栏 */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 日志级别过滤 */}
            <div className="flex items-center gap-2">
              <label className="label-text">过滤级别：</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1"
              >
                <option value="all">全部</option>
                <option value="debug">DEBUG</option>
                <option value="info">INFO</option>
                <option value="warn">WARN</option>
                <option value="error">ERROR</option>
              </select>
            </div>

            {/* 搜索 */}
            <div className="flex items-center gap-2 flex-1">
              <label className="label-text">搜索：</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入关键词搜索..."
                className="flex-1 max-w-md"
              />
            </div>

            {/* 自动滚动 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoScroll"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="autoScroll" className="label-text cursor-pointer">
                自动滚动
              </label>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button onClick={exportLogs} className="px-3 py-1 text-sm">
                导出日志
              </button>
              <button
                onClick={clearLogs}
                className="px-3 py-1 text-sm"
                style={{ background: 'var(--color-destructive)' }}
              >
                清空
              </button>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex gap-6 text-sm">
            <span className="text-[var(--color-muted-foreground)]">
              总计: <span className="text-[var(--color-foreground)] font-semibold">{logs.length}</span>
            </span>
            <span className="text-[var(--color-accent-sapphire)]">
              DEBUG: {logs.filter(l => l.level === 'debug').length}
            </span>
            <span className="text-[var(--color-accent-emerald)]">
              INFO: {logs.filter(l => l.level === 'info').length}
            </span>
            <span className="text-[var(--color-accent-amber)]">
              WARN: {logs.filter(l => l.level === 'warn').length}
            </span>
            <span className="text-[var(--color-accent-crimson)]">
              ERROR: {logs.filter(l => l.level === 'error').length}
            </span>
          </div>
        </div>
      </div>

      {/* 日志内容 */}
      <div className="max-w-7xl mx-auto">
        <div
          ref={logContainerRef}
          className="card p-4 h-[calc(100vh-280px)] overflow-y-auto font-mono text-sm"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center text-[var(--color-muted-foreground)] py-12">
              <p className="text-lg">没有日志记录</p>
              <p className="text-sm mt-2">
                {searchQuery ? '尝试修改搜索条件' : '应用运行时会在此显示日志'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex gap-4 py-1 px-2 rounded hover:bg-[var(--color-muted)] transition-colors"
                >
                  {/* 时间戳 */}
                  <span className="text-[var(--color-muted-foreground)] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>

                  {/* 日志级别 */}
                  <span className={`font-bold whitespace-nowrap ${getLevelColor(log.level)}`}>
                    [{getLevelLabel(log.level)}]
                  </span>

                  {/* 上下文 */}
                  {log.context && (
                    <span className="text-[var(--color-primary)] whitespace-nowrap">
                      [{log.context}]
                    </span>
                  )}

                  {/* 消息 */}
                  <span className="text-[var(--color-foreground)] flex-1">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-4 text-center text-sm text-[var(--color-muted-foreground)]">
          <p>
            💡 提示：日志数据仅在当前会话中保存，刷新页面后将清空。
            {' '}
            使用"导出日志"按钮可以保存日志到文件。
          </p>
        </div>
      </div>
    </div>
  );
}
