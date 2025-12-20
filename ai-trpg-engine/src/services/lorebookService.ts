import type { Lorebook, LorebookEntry } from '../utils/types';

// ============ Lorebook激活状态跟踪 ============

interface ActivationState {
  entryId: string;
  lastActivatedAt: number;  // 消息索引
  stickyUntil?: number;     // Sticky到第几条消息
  cooldownUntil?: number;   // Cooldown到第几条消息
}

/**
 * Lorebook服务 - 处理动态内容注入
 */
export class LorebookService {
  private activationHistory: Map<string, ActivationState> = new Map();

  /**
   * 从消息列表中激活相关的Lorebook条目
   * @param lorebook Lorebook配置
   * @param messages 最近的消息列表(按时间倒序)
   * @param currentMessageIndex 当前消息索引
   * @returns 激活的条目内容数组(已按insertionOrder排序)
   */
  public activateEntries(
    lorebook: Lorebook,
    messages: string[],
    currentMessageIndex: number
  ): string[] {
    if (!lorebook || !lorebook.entries || lorebook.entries.length === 0) {
      return [];
    }

    const scanDepth = lorebook.scanDepth ?? 10;
    const messagesToScan = messages.slice(0, scanDepth);
    const concatenatedText = messagesToScan.join(' ');

    // 第一轮:找出所有匹配的条目
    const matchedEntries: LorebookEntry[] = [];

    for (const entry of lorebook.entries) {
      if (!entry.enabled) continue;

      // 检查delay
      if (entry.delay && currentMessageIndex < entry.delay) {
        continue;
      }

      // 检查cooldown
      const state = this.activationHistory.get(entry.id);
      if (state?.cooldownUntil && currentMessageIndex < state.cooldownUntil) {
        continue;
      }

      // 检查是否匹配主关键词
      if (this.matchesKeys(concatenatedText, entry.keys, entry)) {
        // 检查次级关键词过滤
        if (this.passesSecondaryKeyFilter(concatenatedText, entry)) {
          matchedEntries.push(entry);
        }
      }

      // 检查sticky - 如果之前激活过且仍在sticky期内
      if (state?.stickyUntil && currentMessageIndex < state.stickyUntil) {
        if (!matchedEntries.includes(entry)) {
          matchedEntries.push(entry);
        }
      }
    }

    // 处理包含组(Inclusion Groups)
    const finalEntries = this.resolveInclusionGroups(matchedEntries);

    // 按insertionOrder排序(小的先插入,大的后插入,影响力更强)
    finalEntries.sort((a, b) => a.insertionOrder - b.insertionOrder);

    // 更新激活状态
    for (const entry of finalEntries) {
      const newState: ActivationState = {
        entryId: entry.id,
        lastActivatedAt: currentMessageIndex,
      };

      if (entry.sticky) {
        newState.stickyUntil = currentMessageIndex + entry.sticky;
      }

      if (entry.cooldown) {
        newState.cooldownUntil = currentMessageIndex + entry.cooldown;
      }

      this.activationHistory.set(entry.id, newState);
    }

    // 递归扫描(如果启用)
    if (lorebook.recursiveScanning) {
      return this.applyRecursiveScanning(finalEntries, lorebook, currentMessageIndex);
    }

    return finalEntries.map((e) => e.content);
  }

  /**
   * 检查文本是否匹配关键词列表
   */
  private matchesKeys(
    text: string,
    keys: string[],
    entry: LorebookEntry
  ): boolean {
    const searchText = entry.caseSensitive ? text : text.toLowerCase();

    for (const key of keys) {
      if (entry.useRegex) {
        // 正则表达式匹配
        try {
          const regex = new RegExp(key, entry.caseSensitive ? '' : 'i');
          if (regex.test(searchText)) {
            return true;
          }
        } catch (e) {
          console.warn(`Invalid regex in lorebook entry ${entry.id}: ${key}`);
        }
      } else {
        // 简单字符串匹配
        const searchKey = entry.caseSensitive ? key : key.toLowerCase();
        if (searchText.includes(searchKey)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 检查次级关键词过滤
   */
  private passesSecondaryKeyFilter(
    text: string,
    entry: LorebookEntry
  ): boolean {
    if (
      !entry.secondaryKeys ||
      entry.secondaryKeys.length === 0 ||
      !entry.secondaryKeysLogic
    ) {
      return true; // 没有次级过滤,默认通过
    }

    const searchText = entry.caseSensitive ? text : text.toLowerCase();
    const secondaryMatches = entry.secondaryKeys.filter((key) => {
      const searchKey = entry.caseSensitive ? key : key.toLowerCase();
      return searchText.includes(searchKey);
    });

    switch (entry.secondaryKeysLogic) {
      case 'AND_ANY':
        // 至少匹配一个次级关键词
        return secondaryMatches.length > 0;

      case 'AND_ALL':
        // 匹配所有次级关键词
        return secondaryMatches.length === entry.secondaryKeys.length;

      case 'NOT_ANY':
        // 不匹配任何次级关键词
        return secondaryMatches.length === 0;

      case 'NOT_ALL':
        // 不是所有次级关键词都匹配
        return secondaryMatches.length < entry.secondaryKeys.length;

      default:
        return true;
    }
  }

  /**
   * 解决包含组冲突 - 同组内仅选择一个条目
   */
  private resolveInclusionGroups(entries: LorebookEntry[]): LorebookEntry[] {
    const groupedEntries = new Map<string, LorebookEntry[]>();
    const ungroupedEntries: LorebookEntry[] = [];

    // 按组分类
    for (const entry of entries) {
      if (entry.inclusionGroup) {
        const group = groupedEntries.get(entry.inclusionGroup) || [];
        group.push(entry);
        groupedEntries.set(entry.inclusionGroup, group);
      } else {
        ungroupedEntries.push(entry);
      }
    }

    // 从每个组中选择一个条目
    const selectedFromGroups: LorebookEntry[] = [];
    for (const [, groupEntries] of groupedEntries) {
      if (groupEntries.length === 1) {
        selectedFromGroups.push(groupEntries[0]);
      } else {
        // 按groupWeight加权随机选择
        // 这里简化为选择insertionOrder最高的(优先级最高)
        const selected = groupEntries.reduce((prev, curr) =>
          curr.insertionOrder > prev.insertionOrder ? curr : prev
        );
        selectedFromGroups.push(selected);
      }
    }

    return [...ungroupedEntries, ...selectedFromGroups];
  }

  /**
   * 递归扫描 - 激活的条目内容中的关键词可以激活其他条目
   */
  private applyRecursiveScanning(
    entries: LorebookEntry[],
    lorebook: Lorebook,
    currentMessageIndex: number,
    depth: number = 0,
    maxDepth: number = 3
  ): string[] {
    if (depth >= maxDepth) {
      return entries.map((e) => e.content);
    }

    const currentContent = entries.map((e) => e.content).join(' ');
    const additionalEntries: LorebookEntry[] = [];

    // 扫描当前激活的内容,查找更多匹配
    for (const entry of lorebook.entries) {
      if (!entry.enabled) continue;
      if (entries.some((e) => e.id === entry.id)) continue; // 已激活

      if (this.matchesKeys(currentContent, entry.keys, entry)) {
        if (this.passesSecondaryKeyFilter(currentContent, entry)) {
          additionalEntries.push(entry);
        }
      }
    }

    if (additionalEntries.length === 0) {
      return entries.map((e) => e.content);
    }

    const allEntries = [...entries, ...additionalEntries];
    return this.applyRecursiveScanning(
      allEntries,
      lorebook,
      currentMessageIndex,
      depth + 1,
      maxDepth
    );
  }

  /**
   * 重置激活历史(开始新对话时调用)
   */
  public resetActivationHistory(): void {
    this.activationHistory.clear();
  }

  /**
   * 创建默认Lorebook
   */
  public static createDefaultLorebook(
    worldlineId: string,
    worldlineName: string
  ): Lorebook {
    return {
      id: `lorebook_${worldlineId}`,
      name: `${worldlineName} - Lorebook`,
      description: '世界背景知识库',
      entries: [],
      scanDepth: 10,
      recursiveScanning: true,
      budgetEnabled: false,
    };
  }

  /**
   * 创建新的Lorebook条目
   */
  public static createEntry(
    title: string,
    keys: string[],
    content: string
  ): LorebookEntry {
    return {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      keys,
      content,
      enabled: true,
      insertionOrder: 100, // 默认优先级
      caseSensitive: false,
      useRegex: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

// 导出单例
export const lorebookService = new LorebookService();
