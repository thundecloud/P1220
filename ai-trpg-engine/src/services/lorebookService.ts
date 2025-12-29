import type { Lorebook, LorebookEntry } from '../utils/types';
import { log } from './logService';

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
    log.debug(`激活Lorebook条目: lorebook=${lorebook?.name || 'null'}, 消息数=${messages.length}, 当前索引=${currentMessageIndex}`, { context: 'LorebookService' });

    if (!lorebook || !lorebook.entries || lorebook.entries.length === 0) {
      log.debug('Lorebook为空或无条目，跳过激活', { context: 'LorebookService' });
      return [];
    }

    const scanDepth = lorebook.scanDepth ?? 10;
    const messagesToScan = messages.slice(0, scanDepth);
    const concatenatedText = messagesToScan.join(' ');
    log.debug(`扫描深度=${scanDepth}, 实际扫描消息数=${messagesToScan.length}, 文本长度=${concatenatedText.length}`, { context: 'LorebookService' });

    // 第一轮:找出所有匹配的条目
    const matchedEntries: LorebookEntry[] = [];

    log.debug(`开始遍历${lorebook.entries.length}个条目进行匹配`, { context: 'LorebookService' });

    for (const entry of lorebook.entries) {
      if (!entry.enabled) {
        log.debug(`条目"${entry.title}"已禁用，跳过`, { context: 'LorebookService' });
        continue;
      }

      // 检查delay
      if (entry.delay && currentMessageIndex < entry.delay) {
        log.debug(`条目"${entry.title}"延迟未满足(当前=${currentMessageIndex}, 需要=${entry.delay})，跳过`, { context: 'LorebookService' });
        continue;
      }

      // 检查cooldown
      const state = this.activationHistory.get(entry.id);
      if (state?.cooldownUntil && currentMessageIndex < state.cooldownUntil) {
        log.debug(`条目"${entry.title}"在冷却中(当前=${currentMessageIndex}, 冷却至=${state.cooldownUntil})，跳过`, { context: 'LorebookService' });
        continue;
      }

      // 检查是否匹配主关键词
      if (this.matchesKeys(concatenatedText, entry.keys, entry)) {
        // 检查次级关键词过滤
        if (this.passesSecondaryKeyFilter(concatenatedText, entry)) {
          log.info(`条目"${entry.title}"匹配成功(关键词: ${entry.keys.join(', ')})`, { context: 'LorebookService' });
          matchedEntries.push(entry);
        } else {
          log.debug(`条目"${entry.title}"主关键词匹配但次级过滤未通过`, { context: 'LorebookService' });
        }
      }

      // 检查sticky - 如果之前激活过且仍在sticky期内
      if (state?.stickyUntil && currentMessageIndex < state.stickyUntil) {
        if (!matchedEntries.includes(entry)) {
          log.info(`条目"${entry.title}"通过sticky规则激活(sticky至=${state.stickyUntil})`, { context: 'LorebookService' });
          matchedEntries.push(entry);
        }
      }
    }

    // 处理包含组(Inclusion Groups)
    log.debug(`匹配到${matchedEntries.length}个条目，处理包含组...`, { context: 'LorebookService' });
    const finalEntries = this.resolveInclusionGroups(matchedEntries);
    log.debug(`包含组处理后剩余${finalEntries.length}个条目`, { context: 'LorebookService' });

    // 按insertionOrder排序(小的先插入,大的后插入,影响力更强)
    finalEntries.sort((a, b) => a.insertionOrder - b.insertionOrder);
    log.debug(`条目按insertionOrder排序完成`, { context: 'LorebookService' });

    // 更新激活状态
    for (const entry of finalEntries) {
      const newState: ActivationState = {
        entryId: entry.id,
        lastActivatedAt: currentMessageIndex,
      };

      if (entry.sticky) {
        newState.stickyUntil = currentMessageIndex + entry.sticky;
        log.debug(`条目"${entry.title}"设置sticky至消息${newState.stickyUntil}`, { context: 'LorebookService' });
      }

      if (entry.cooldown) {
        newState.cooldownUntil = currentMessageIndex + entry.cooldown;
        log.debug(`条目"${entry.title}"设置cooldown至消息${newState.cooldownUntil}`, { context: 'LorebookService' });
      }

      this.activationHistory.set(entry.id, newState);
    }

    // 递归扫描(如果启用)
    if (lorebook.recursiveScanning) {
      log.debug('启用递归扫描，开始递归匹配...', { context: 'LorebookService' });
      const result = this.applyRecursiveScanning(finalEntries, lorebook, currentMessageIndex);
      log.info(`Lorebook激活完成: 共激活${result.length}个条目(递归扫描)`, { context: 'LorebookService' });
      return result;
    }

    log.info(`Lorebook激活完成: 共激活${finalEntries.length}个条目`, { context: 'LorebookService' });
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
            log.debug(`关键词匹配(正则): "${key}" 在条目"${entry.title}"中匹配成功`, { context: 'LorebookService' });
            return true;
          }
        } catch (e) {
          log.warn(`条目"${entry.title}"中的正则表达式无效: ${key}`, { context: 'LorebookService' });
        }
      } else {
        // 简单字符串匹配
        const searchKey = entry.caseSensitive ? key : key.toLowerCase();
        if (searchText.includes(searchKey)) {
          log.debug(`关键词匹配(字符串): "${key}" 在条目"${entry.title}"中匹配成功`, { context: 'LorebookService' });
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
      log.debug(`条目"${entry.title}"无次级关键词过滤，直接通过`, { context: 'LorebookService' });
      return true; // 没有次级过滤,默认通过
    }

    const searchText = entry.caseSensitive ? text : text.toLowerCase();
    const secondaryMatches = entry.secondaryKeys.filter((key) => {
      const searchKey = entry.caseSensitive ? key : key.toLowerCase();
      return searchText.includes(searchKey);
    });

    log.debug(`条目"${entry.title}"次级关键词匹配: ${secondaryMatches.length}/${entry.secondaryKeys.length} (逻辑=${entry.secondaryKeysLogic})`, { context: 'LorebookService' });

    let result = false;
    switch (entry.secondaryKeysLogic) {
      case 'AND_ANY':
        // 至少匹配一个次级关键词
        result = secondaryMatches.length > 0;
        break;

      case 'AND_ALL':
        // 匹配所有次级关键词
        result = secondaryMatches.length === entry.secondaryKeys.length;
        break;

      case 'NOT_ANY':
        // 不匹配任何次级关键词
        result = secondaryMatches.length === 0;
        break;

      case 'NOT_ALL':
        // 不是所有次级关键词都匹配
        result = secondaryMatches.length < entry.secondaryKeys.length;
        break;

      default:
        result = true;
    }

    log.debug(`条目"${entry.title}"次级过滤结果: ${result ? '通过' : '未通过'}`, { context: 'LorebookService' });
    return result;
  }

  /**
   * 解决包含组冲突 - 同组内仅选择一个条目
   */
  private resolveInclusionGroups(entries: LorebookEntry[]): LorebookEntry[] {
    log.debug(`解析包含组: 输入${entries.length}个条目`, { context: 'LorebookService' });

    const groupedEntries = new Map<string, LorebookEntry[]>();
    const ungroupedEntries: LorebookEntry[] = [];

    // 按组分类
    for (const entry of entries) {
      if (entry.inclusionGroup) {
        const group = groupedEntries.get(entry.inclusionGroup) || [];
        group.push(entry);
        groupedEntries.set(entry.inclusionGroup, group);
        log.debug(`条目"${entry.title}"归入包含组"${entry.inclusionGroup}"`, { context: 'LorebookService' });
      } else {
        ungroupedEntries.push(entry);
      }
    }

    log.debug(`包含组数量: ${groupedEntries.size}, 无组条目: ${ungroupedEntries.length}`, { context: 'LorebookService' });

    // 从每个组中选择一个条目
    const selectedFromGroups: LorebookEntry[] = [];
    for (const [groupName, groupEntries] of groupedEntries) {
      if (groupEntries.length === 1) {
        selectedFromGroups.push(groupEntries[0]);
        log.debug(`包含组"${groupName}"只有1个条目，直接选中"${groupEntries[0].title}"`, { context: 'LorebookService' });
      } else {
        // 按groupWeight加权随机选择
        // 这里简化为选择insertionOrder最高的(优先级最高)
        const selected = groupEntries.reduce((prev, curr) =>
          curr.insertionOrder > prev.insertionOrder ? curr : prev
        );
        selectedFromGroups.push(selected);
        log.info(`包含组"${groupName}"有${groupEntries.length}个条目，选中"${selected.title}"(insertionOrder=${selected.insertionOrder})`, { context: 'LorebookService' });
      }
    }

    const result = [...ungroupedEntries, ...selectedFromGroups];
    log.debug(`包含组解析完成: 最终${result.length}个条目`, { context: 'LorebookService' });
    return result;
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
    log.debug(`递归扫描: 深度=${depth}/${maxDepth}, 当前条目数=${entries.length}`, { context: 'LorebookService' });

    if (depth >= maxDepth) {
      log.debug(`递归扫描: 达到最大深度${maxDepth}，停止递归`, { context: 'LorebookService' });
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
          log.info(`递归扫描: 在深度${depth}发现新匹配条目"${entry.title}"`, { context: 'LorebookService' });
          additionalEntries.push(entry);
        }
      }
    }

    if (additionalEntries.length === 0) {
      log.debug(`递归扫描: 深度${depth}无新匹配，返回${entries.length}个条目`, { context: 'LorebookService' });
      return entries.map((e) => e.content);
    }

    log.debug(`递归扫描: 深度${depth}发现${additionalEntries.length}个新条目，继续递归`, { context: 'LorebookService' });
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
    const previousSize = this.activationHistory.size;
    this.activationHistory.clear();
    log.info(`激活历史已重置: 清除了${previousSize}条记录`, { context: 'LorebookService' });
  }

  /**
   * 创建默认Lorebook
   */
  public static createDefaultLorebook(
    worldlineId: string,
    worldlineName: string
  ): Lorebook {
    const lorebook = {
      id: `lorebook_${worldlineId}`,
      name: `${worldlineName} - Lorebook`,
      description: '世界背景知识库',
      entries: [],
      scanDepth: 10,
      recursiveScanning: true,
      budgetEnabled: false,
    };
    log.info(`创建默认Lorebook: id=${lorebook.id}, 世界线=${worldlineName}`, { context: 'LorebookService' });
    return lorebook;
  }

  /**
   * 创建新的Lorebook条目
   */
  public static createEntry(
    title: string,
    keys: string[],
    content: string
  ): LorebookEntry {
    const entry = {
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
    log.info(`创建Lorebook条目: id=${entry.id}, 标题="${title}", 关键词=[${keys.join(', ')}]`, { context: 'LorebookService' });
    return entry;
  }
}

// 导出单例
export const lorebookService = new LorebookService();
