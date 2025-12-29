/**
 * 独立日志窗口页面
 * 显示详细的运行日志，支持实时更新
 */

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export default function LogWindow() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // 加载日志文件列表
  useEffect(() => {
    loadLogFiles();
  }, []);

  const loadLogFiles = async () => {
    try {
      const files = await invoke<string[]>('get_log_files');
      setLogFiles(files);
      if (files.length > 0 && !selectedFile) {
        setSelectedFile(files[0]);
        loadLogFile(files[0]);
      }
    } catch (error) {
      console.error('加载日志文件列表失败:', error);
    }
  };

  // 加载指定日志文件
  const loadLogFile = async (filename: string) => {
    try {
      const content = await invoke<string>('read_log_file', { filename });
      const parsedLogs = parseLogContent(content);
      setLogs(parsedLogs);
    } catch (error) {
      console.error('加载日志文件失败:', error);
    }
  };

  // 解析日志内容
  const parseLogContent = (content: string): LogEntry[] => {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const match = line.match(/^\[(.+?)\]\s+\[(\w+)\]\s+(.+)$/);
      if (match) {
        return {
          timestamp: match[1],
          level: match[2] as LogEntry['level'],
          message: match[3],
        };
      }
      return {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: line,
      };
    });
  };

  // 监听新日志事件
  useEffect(() => {
    const unlisten = listen<{ level: string; message: string }>('log-event', (event) => {
      if (!isPaused) {
        const newLog: LogEntry = {
          timestamp: new Date().toISOString(),
          level: event.payload.level as LogEntry['level'],
          message: event.payload.message,
        };
        setLogs(prev => [...prev, newLog]);
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [isPaused]);

  // 切换日志文件
  const handleFileChange = (filename: string) => {
    setSelectedFile(filename);
    loadLogFile(filename);
  };

  // 刷新当前文件
  const handleRefresh = () => {
    if (selectedFile) {
      loadLogFile(selectedFile);
    } else {
      loadLogFiles();
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current && !isPaused) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isPaused]);

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
      case 'DEBUG':
        return 'text-[#4A9EFF]';
      case 'INFO':
        return 'text-[#50E3C2]';
      case 'WARN':
        return 'text-[#FFB946]';
      case 'ERROR':
        return 'text-[#FF5A5F]';
      default:
        return 'text-gray-300';
    }
  };

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 导出日志
  const exportLogs = () => {
    const logText = logs
      .map(log => `[${log.timestamp}] [${log.level}] ${log.message}`)
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-export-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-gray-100 p-4">
      {/* 页面头部 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h1 className="text-2xl font-bold">系统日志监视器</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1 text-sm rounded ${
                isPaused ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isPaused ? '▶ 恢复' : '⏸ 暂停'}
            </button>
            <button onClick={handleRefresh} className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded">
              🔄 刷新
            </button>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="bg-[#151B2E] rounded-lg p-4 space-y-3">
          {/* 第一行：文件选择和过滤 */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* 日志文件选择 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">日志文件：</label>
              <select
                value={selectedFile}
                onChange={(e) => handleFileChange(e.target.value)}
                className="px-3 py-1 bg-[#1E2842] border border-gray-700 rounded text-sm"
              >
                {logFiles.map(file => (
                  <option key={file} value={file}>{file}</option>
                ))}
              </select>
            </div>

            {/* 日志级别过滤 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">级别：</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 bg-[#1E2842] border border-gray-700 rounded text-sm"
              >
                <option value="all">全部</option>
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            {/* 搜索 */}
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm text-gray-400">搜索：</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入关键词..."
                className="flex-1 max-w-md px-3 py-1 bg-[#1E2842] border border-gray-700 rounded text-sm"
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
              <label htmlFor="autoScroll" className="text-sm text-gray-400 cursor-pointer">
                自动滚动
              </label>
            </div>
          </div>

          {/* 第二行：统计和操作 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <div className="flex gap-6 text-sm">
              <span className="text-gray-400">
                总计: <span className="text-white font-semibold">{logs.length}</span>
              </span>
              <span className="text-[#4A9EFF]">
                DEBUG: {logs.filter(l => l.level === 'DEBUG').length}
              </span>
              <span className="text-[#50E3C2]">
                INFO: {logs.filter(l => l.level === 'INFO').length}
              </span>
              <span className="text-[#FFB946]">
                WARN: {logs.filter(l => l.level === 'WARN').length}
              </span>
              <span className="text-[#FF5A5F]">
                ERROR: {logs.filter(l => l.level === 'ERROR').length}
              </span>
            </div>

            <div className="flex gap-2">
              <button onClick={exportLogs} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded">
                💾 导出
              </button>
              <button
                onClick={clearLogs}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded"
              >
                🗑 清空
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 日志内容 */}
      <div
        ref={logContainerRef}
        className="bg-[#0D1117] rounded-lg p-4 h-[calc(100vh-200px)] overflow-y-auto font-mono text-xs border border-gray-800"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg">没有日志记录</p>
            <p className="text-sm mt-2">
              {searchQuery ? '尝试修改搜索条件' : '应用运行时会在此显示日志'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="flex gap-3 py-0.5 px-2 rounded hover:bg-[#161B26] transition-colors"
              >
                {/* 时间戳 */}
                <span className="text-gray-500 whitespace-nowrap text-[11px]">
                  {log.timestamp.split(' ')[1] || log.timestamp.substring(11, 23)}
                </span>

                {/* 日志级别 */}
                <span className={`font-bold whitespace-nowrap ${getLevelColor(log.level)} min-w-[50px]`}>
                  [{log.level}]
                </span>

                {/* 消息 */}
                <span className="text-gray-300 flex-1 break-all">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="mt-3 text-center text-xs text-gray-500">
        <p>
          💡 提示：日志文件保存在 Documents/AI-TRPG/logs 目录下，按日期自动分割
          {isPaused && ' | ⚠️ 日志更新已暂停'}
        </p>
      </div>
    </div>
  );
}
