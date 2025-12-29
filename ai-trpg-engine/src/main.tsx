import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { openLogWindow } from './utils/windowManager'
import { getCurrentWindow } from '@tauri-apps/api/window'

// 自动打开日志窗口（仅在主窗口）
const currentWindow = getCurrentWindow();
if (currentWindow.label === 'main') {
  // 延迟1秒打开日志窗口，确保主窗口已完全加载
  setTimeout(() => {
    openLogWindow().catch(err => {
      console.error('自动打开日志窗口失败:', err);
    });
  }, 1000);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
