import { log } from '../services/logService';

/**
 * 检查是否在Tauri环境中运行
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
}

/**
 * 安全地调用Tauri命令
 */
export async function invokeTauri<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauriEnvironment()) {
    log.warn(`Tauri命令 ${command} 调用失败: 非Tauri环境`, { context: 'Tauri' });
    throw new Error('Not running in Tauri environment');
  }

  const startTime = Date.now();
  log.debug(`Tauri命令开始: ${command}`, { context: 'Tauri' });

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<T>(command, args);
    log.debug(`Tauri命令完成: ${command} (${Date.now() - startTime}ms)`, { context: 'Tauri' });
    return result;
  } catch (error) {
    log.error(`Tauri命令失败: ${command}`, error as Error, { context: 'Tauri' });
    throw error;
  }
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
  log.info(`保存游戏存档: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('save_game', { filename, data });
    log.info(`存档保存成功: ${filename} (${data.length} bytes)`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：使用localStorage模拟
  log.debug('使用localStorage模拟存档', { context: 'Tauri' });
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
  log.info(`加载游戏存档: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('load_game', { filename });
    log.info(`存档加载成功: ${filename} (${result.length} bytes)`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：从localStorage读取
  const data = localStorage.getItem(`save_${filename}`);
  if (!data) {
    log.error(`存档不存在: ${filename}`, undefined, { context: 'Tauri' });
    throw new Error('存档不存在');
  }
  log.debug(`从localStorage加载存档: ${filename}`, { context: 'Tauri' });
  return data;
}

/**
 * 安全地调用list_saves命令
 */
export async function listSaves(): Promise<string[]> {
  log.debug('获取存档列表', { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const saves = await invokeTauri<string[]>('list_saves');
    log.info(`存档列表获取成功: ${saves.length} 个存档`, { context: 'Tauri' });
    return saves;
  }

  // 浏览器环境：返回模拟的存档列表
  log.debug(`返回模拟存档列表: ${mockSaves.length} 个`, { context: 'Tauri' });
  return [...mockSaves];
}

/**
 * 安全地调用delete_save命令
 */
export async function deleteSave(filename: string): Promise<string> {
  log.info(`删除存档: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('delete_save', { filename });
    log.info(`存档删除成功: ${filename}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：从localStorage删除
  localStorage.removeItem(`save_${filename}`);
  const index = mockSaves.indexOf(filename);
  if (index > -1) {
    mockSaves.splice(index, 1);
  }
  log.debug(`从localStorage删除存档: ${filename}`, { context: 'Tauri' });
  return `存档已删除: ${filename}`;
}

/**
 * 安全地调用save_config命令
 */
export async function saveConfig(config: string): Promise<void> {
  log.info('保存应用配置', { context: 'Tauri' });
  if (isTauriEnvironment()) {
    await invokeTauri<void>('save_config', { config });
    log.info('应用配置保存成功', { context: 'Tauri' });
    return;
  }

  // 浏览器环境：保存到localStorage
  localStorage.setItem('app_config', config);
  mockConfig = JSON.parse(config);
  log.debug('配置保存到localStorage', { context: 'Tauri' });
}

/**
 * 安全地调用load_config命令
 */
export async function loadConfig(): Promise<string> {
  log.debug('加载应用配置', { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const config = await invokeTauri<string>('load_config');
    log.info('应用配置加载成功', { context: 'Tauri' });
    return config;
  }

  // 浏览器环境：从localStorage读取
  const stored = localStorage.getItem('app_config');
  if (stored) {
    log.debug('从localStorage加载配置', { context: 'Tauri' });
    return stored;
  }
  log.debug('使用默认配置', { context: 'Tauri' });
  return JSON.stringify(mockConfig, null, 2);
}

// ============ 世界线管理 ============

/**
 * 模拟的世界线列表（用于浏览器开发）
 */
const mockWorldlines: string[] = [];

/**
 * 保存自定义世界线
 */
export async function saveWorldline(filename: string, data: string): Promise<string> {
  log.info(`保存世界线: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('save_worldline', { filename, data });
    log.info(`世界线保存成功: ${filename}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：使用localStorage模拟
  localStorage.setItem(`worldline_${filename}`, data);
  if (!mockWorldlines.includes(filename)) {
    mockWorldlines.push(filename);
  }
  log.debug(`世界线保存到localStorage: ${filename}`, { context: 'Tauri' });
  return `世界线已保存: ${filename}`;
}

/**
 * 加载自定义世界线
 */
export async function loadWorldline(filename: string): Promise<string> {
  log.debug(`加载世界线: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('load_worldline', { filename });
    log.info(`世界线加载成功: ${filename}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：从localStorage读取
  const data = localStorage.getItem(`worldline_${filename}`);
  if (!data) {
    log.error(`世界线不存在: ${filename}`, undefined, { context: 'Tauri' });
    throw new Error('世界线不存在');
  }
  log.debug(`从localStorage加载世界线: ${filename}`, { context: 'Tauri' });
  return data;
}

/**
 * 列出所有自定义世界线
 */
export async function listWorldlines(): Promise<string[]> {
  log.debug('获取世界线列表', { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const worldlines = await invokeTauri<string[]>('list_worldlines');
    log.info(`世界线列表获取成功: ${worldlines.length} 个`, { context: 'Tauri' });
    return worldlines;
  }

  // 浏览器环境：返回模拟的世界线列表
  log.debug(`返回模拟世界线列表: ${mockWorldlines.length} 个`, { context: 'Tauri' });
  return [...mockWorldlines];
}

/**
 * 删除自定义世界线
 */
export async function deleteWorldline(filename: string): Promise<string> {
  log.info(`删除世界线: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('delete_worldline', { filename });
    log.info(`世界线删除成功: ${filename}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：从localStorage删除
  localStorage.removeItem(`worldline_${filename}`);
  const index = mockWorldlines.indexOf(filename);
  if (index > -1) {
    mockWorldlines.splice(index, 1);
  }
  log.debug(`从localStorage删除世界线: ${filename}`, { context: 'Tauri' });
  return `世界线已删除: ${filename}`;
}

/**
 * 导出世界线
 */
export async function exportWorldline(filename: string): Promise<string> {
  log.info(`导出世界线: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('export_worldline', { filename });
    log.info(`世界线导出成功: ${filename}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：直接返回数据
  return loadWorldline(filename);
}

/**
 * 导入世界线
 */
export async function importWorldline(filename: string, data: string): Promise<string> {
  log.info(`导入世界线: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('import_worldline', { filename, data });
    log.info(`世界线导入成功: ${filename}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：保存数据
  return saveWorldline(filename, data);
}

// ============ 设定集目录导入 ============

/**
 * 文件节点类型（与Rust后端FileNode对应）
 */
export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  content?: string;
  children?: FileNode[];
}

/**
 * 读取目录结构和文件内容
 */
export async function readDirectoryStructure(dirPath: string): Promise<FileNode> {
  log.info(`读取目录结构: ${dirPath}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<FileNode>('read_directory_structure', { dirPath });
    log.info(`目录结构读取成功: ${dirPath}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：不支持目录读取，抛出错误
  log.error('目录读取功能仅在桌面应用中可用', undefined, { context: 'Tauri' });
  throw new Error('目录读取功能仅在桌面应用中可用');
}

/**
 * 打开文件夹选择对话框
 */
export async function selectDirectory(): Promise<string | null> {
  log.debug('打开文件夹选择对话框', { context: 'Tauri' });
  if (!isTauriEnvironment()) {
    log.error('文件夹选择功能仅在桌面应用中可用', undefined, { context: 'Tauri' });
    throw new Error('文件夹选择功能仅在桌面应用中可用');
  }

  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({
    directory: true,
    multiple: false,
  });

  if (selected) {
    log.info(`选择了目录: ${selected}`, { context: 'Tauri' });
  } else {
    log.debug('用户取消了目录选择', { context: 'Tauri' });
  }

  return selected as string | null;
}

// ============ Lorebook 管理 ============

/**
 * 模拟的 Lorebook 列表（用于浏览器开发）
 */
const mockLorebooks: string[] = [];

/**
 * 保存 Lorebook
 */
export async function saveLorebook(filename: string, data: string): Promise<string> {
  log.info(`保存Lorebook: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('save_lorebook', { filename, data });
    log.info(`Lorebook保存成功: ${filename}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：使用 localStorage 模拟
  localStorage.setItem(`lorebook_${filename}`, data);
  if (!mockLorebooks.includes(filename)) {
    mockLorebooks.push(filename);
  }
  log.debug(`Lorebook保存到localStorage: ${filename}`, { context: 'Tauri' });
  return `Lorebook 已保存: ${filename}`;
}

/**
 * 加载 Lorebook
 */
export async function loadLorebook(filename: string): Promise<string> {
  log.debug(`加载Lorebook: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('load_lorebook', { filename });
    log.info(`Lorebook加载成功: ${filename}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：从 localStorage 读取
  const data = localStorage.getItem(`lorebook_${filename}`);
  if (!data) {
    log.error(`Lorebook不存在: ${filename}`, undefined, { context: 'Tauri' });
    throw new Error('Lorebook 不存在');
  }
  log.debug(`从localStorage加载Lorebook: ${filename}`, { context: 'Tauri' });
  return data;
}

/**
 * 列出所有 Lorebook
 */
export async function listLorebooks(): Promise<string[]> {
  log.debug('获取Lorebook列表', { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const lorebooks = await invokeTauri<string[]>('list_lorebooks');
    log.info(`Lorebook列表获取成功: ${lorebooks.length} 个`, { context: 'Tauri' });
    return lorebooks;
  }

  // 浏览器环境：返回模拟的 Lorebook 列表
  log.debug(`返回模拟Lorebook列表: ${mockLorebooks.length} 个`, { context: 'Tauri' });
  return [...mockLorebooks];
}

/**
 * 删除 Lorebook
 */
export async function deleteLorebook(filename: string): Promise<string> {
  log.info(`删除Lorebook: ${filename}`, { context: 'Tauri' });
  if (isTauriEnvironment()) {
    const result = await invokeTauri<string>('delete_lorebook', { filename });
    log.info(`Lorebook删除成功: ${filename}`, { context: 'Tauri' });
    return result;
  }

  // 浏览器环境：从 localStorage 删除
  localStorage.removeItem(`lorebook_${filename}`);
  const index = mockLorebooks.indexOf(filename);
  if (index > -1) {
    mockLorebooks.splice(index, 1);
  }
  log.debug(`从localStorage删除Lorebook: ${filename}`, { context: 'Tauri' });
  return `Lorebook 已删除: ${filename}`;
}
