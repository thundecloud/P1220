/**
 * 检查是否在Tauri环境中运行
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * 安全地调用Tauri命令
 */
export async function invokeTauri<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauriEnvironment()) {
    throw new Error('Not running in Tauri environment');
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

/**
 * 模拟的存档列表（用于浏览器开发）
 */
const mockSaves: string[] = [];

/**
 * 模拟的配置数据（用于浏览器开发）
 */
let mockConfig = {
  ai: {
    provider: 'deepseek',
    apiKey: '',
    apiBaseUrl: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000,
  },
  game: {
    dmStyle: 'humanistic',
    autoSave: true,
    autoSaveInterval: 30,
    language: 'zh-CN',
  },
  ui: {
    theme: 'dark',
    fontSize: 14,
    animationEnabled: true,
  },
};

/**
 * 安全地调用save_game命令
 */
export async function saveGame(filename: string, data: string): Promise<string> {
  if (isTauriEnvironment()) {
    return invokeTauri<string>('save_game', { filename, data });
  }

  // 浏览器环境：使用localStorage模拟
  localStorage.setItem(`save_${filename}`, data);
  if (!mockSaves.includes(filename)) {
    mockSaves.push(filename);
  }
  return `存档已保存: ${filename}`;
}

/**
 * 安全地调用load_game命令
 */
export async function loadGame(filename: string): Promise<string> {
  if (isTauriEnvironment()) {
    return invokeTauri<string>('load_game', { filename });
  }

  // 浏览器环境：从localStorage读取
  const data = localStorage.getItem(`save_${filename}`);
  if (!data) {
    throw new Error('存档不存在');
  }
  return data;
}

/**
 * 安全地调用list_saves命令
 */
export async function listSaves(): Promise<string[]> {
  if (isTauriEnvironment()) {
    return invokeTauri<string[]>('list_saves');
  }

  // 浏览器环境：返回模拟的存档列表
  return [...mockSaves];
}

/**
 * 安全地调用delete_save命令
 */
export async function deleteSave(filename: string): Promise<string> {
  if (isTauriEnvironment()) {
    return invokeTauri<string>('delete_save', { filename });
  }

  // 浏览器环境：从localStorage删除
  localStorage.removeItem(`save_${filename}`);
  const index = mockSaves.indexOf(filename);
  if (index > -1) {
    mockSaves.splice(index, 1);
  }
  return `存档已删除: ${filename}`;
}

/**
 * 安全地调用save_config命令
 */
export async function saveConfig(config: string): Promise<void> {
  if (isTauriEnvironment()) {
    return invokeTauri<void>('save_config', { config });
  }

  // 浏览器环境：保存到localStorage
  localStorage.setItem('app_config', config);
  mockConfig = JSON.parse(config);
}

/**
 * 安全地调用load_config命令
 */
export async function loadConfig(): Promise<string> {
  if (isTauriEnvironment()) {
    return invokeTauri<string>('load_config');
  }

  // 浏览器环境：从localStorage读取
  const stored = localStorage.getItem('app_config');
  if (stored) {
    return stored;
  }
  return JSON.stringify(mockConfig, null, 2);
}
