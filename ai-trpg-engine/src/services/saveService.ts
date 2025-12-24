/**
 * 存档服务
 *
 * 功能：
 * - 自动存档
 * - 手动存档
 * - 加载存档
 * - 列出存档
 * - 删除存档
 */

import { invoke } from '@tauri-apps/api/core';
import type { Character, GameSession, SaveData } from '../utils/types';
import { log } from './logService';

export interface AutoSaveOptions {
  enabled: boolean;
  intervalSeconds: number;  // 自动存档间隔（秒）
}

class SaveService {
  private autoSaveTimer: number | null = null;
  private lastAutoSaveTime: number = 0;

  /**
   * 保存游戏
   */
  async saveGame(
    character: Character,
    session: GameSession,
    filename?: string
  ): Promise<string> {
    const saveData: SaveData = {
      version: '0.1.0',
      character,
      gameSession: session,
      metadata: {
        createdAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        playTime: 0,  // TODO: 实现游戏时长跟踪
      },
    };

    const saveFilename = filename || this.generateSaveFilename(character.name);
    const jsonData = JSON.stringify(saveData, null, 2);

    try {
      await invoke('save_game', {
        filename: saveFilename,
        data: jsonData,
      });

      log.info(`游戏已保存: ${saveFilename}`, { context: 'SaveService' });
      return saveFilename;
    } catch (error) {
      log.error('保存游戏失败', error as Error, { context: 'SaveService' });
      throw error;
    }
  }

  /**
   * 加载游戏
   */
  async loadGame(filename: string): Promise<SaveData> {
    try {
      const jsonData = await invoke<string>('load_game', { filename });
      const saveData: SaveData = JSON.parse(jsonData);

      log.info(`游戏已加载: ${filename}`, { context: 'SaveService' });
      return saveData;
    } catch (error) {
      log.error('加载游戏失败', error as Error, { context: 'SaveService' });
      throw error;
    }
  }

  /**
   * 列出所有存档
   */
  async listSaves(): Promise<string[]> {
    try {
      const saves = await invoke<string[]>('list_saves');
      return saves;
    } catch (error) {
      log.error('列出存档失败', error as Error, { context: 'SaveService' });
      return [];
    }
  }

  /**
   * 删除存档
   */
  async deleteSave(filename: string): Promise<void> {
    try {
      await invoke('delete_save', { filename });
      log.info(`存档已删除: ${filename}`, { context: 'SaveService' });
    } catch (error) {
      log.error('删除存档失败', error as Error, { context: 'SaveService' });
      throw error;
    }
  }

  /**
   * 启动自动存档
   */
  startAutoSave(
    character: Character,
    getSession: () => GameSession,
    options: AutoSaveOptions
  ): void {
    if (!options.enabled) {
      log.debug('自动存档未启用', { context: 'SaveService' });
      return;
    }

    // 清除旧的定时器
    this.stopAutoSave();

    const intervalMs = options.intervalSeconds * 1000;

    this.autoSaveTimer = window.setInterval(() => {
      const now = Date.now();

      // 防止频繁保存
      if (now - this.lastAutoSaveTime < intervalMs) {
        return;
      }

      const session = getSession();

      // 如果会话是活跃状态，才进行自动保存
      if (session.status === 'active') {
        this.saveGame(character, session, this.generateAutoSaveFilename(character.name))
          .then(() => {
            this.lastAutoSaveTime = now;
            log.debug('自动存档完成', { context: 'SaveService' });
          })
          .catch((error) => {
            log.error('自动存档失败', error as Error, { context: 'SaveService' });
          });
      }
    }, intervalMs);

    log.info(
      `自动存档已启动，间隔 ${options.intervalSeconds} 秒`,
      { context: 'SaveService' }
    );
  }

  /**
   * 停止自动存档
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      window.clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      log.info('自动存档已停止', { context: 'SaveService' });
    }
  }

  /**
   * 生成存档文件名
   */
  private generateSaveFilename(characterName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = characterName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    return `save_${safeName}_${timestamp}.json`;
  }

  /**
   * 生成自动存档文件名
   */
  private generateAutoSaveFilename(characterName: string): string {
    const safeName = characterName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    return `autosave_${safeName}.json`;
  }

  /**
   * 快速保存（覆盖当前存档）
   */
  async quickSave(character: Character, session: GameSession): Promise<void> {
    const filename = this.generateAutoSaveFilename(character.name);
    await this.saveGame(character, session, filename);
    log.info('快速保存完成', { context: 'SaveService' });
  }

  /**
   * 获取最近的存档
   */
  async getRecentSave(characterName: string): Promise<SaveData | null> {
    try {
      const saves = await this.listSaves();
      const safeName = characterName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');

      // 查找该角色的自动存档
      const autoSaveFilename = `autosave_${safeName}.json`;
      if (saves.includes(autoSaveFilename)) {
        return await this.loadGame(autoSaveFilename);
      }

      // 查找该角色的最新手动存档
      const characterSaves = saves
        .filter(s => s.includes(safeName))
        .sort()
        .reverse();

      if (characterSaves.length > 0) {
        return await this.loadGame(characterSaves[0]);
      }

      return null;
    } catch (error) {
      log.error('获取最近存档失败', error as Error, { context: 'SaveService' });
      return null;
    }
  }
}

// 导出单例
export const saveService = new SaveService();
export default saveService;
