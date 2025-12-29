import { create } from 'zustand';
import type { Character, Worldline, Talent } from '../utils/types';
import { log } from '../services/logService';

interface CharacterStore {
  // 当前角色
  character: Character | null;

  // 角色创建流程状态
  selectedWorldline: Worldline | null;
  drawnTalents: Talent[][];  // 3组天赋,每组3个
  selectedTalents: Talent[];
  selectedBackgrounds: string[];

  // Actions
  setCharacter: (character: Character | null) => void;
  setSelectedWorldline: (worldline: Worldline | null) => void;
  setDrawnTalents: (talents: Talent[][]) => void;
  selectTalent: (groupIndex: number, talent: Talent) => void;
  toggleBackground: (backgroundId: string) => void;
  reset: () => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  character: null,
  selectedWorldline: null,
  drawnTalents: [],
  selectedTalents: [],
  selectedBackgrounds: [],

  setCharacter: (character) => {
    if (character) {
      log.info(`设置角色: id=${character.id}, 名称=${character.name}, 性别=${character.gender}`, { context: 'CharacterStore' });
      log.debug(`角色详情: 年龄=${character.currentAge}, 世界线=${character.worldlineId}, 天赋数=${character.talents?.length || 0}`, { context: 'CharacterStore' });
    } else {
      log.info('清除角色', { context: 'CharacterStore' });
    }
    set({ character });
  },

  setSelectedWorldline: (worldline) => {
    if (worldline) {
      log.info(`选择世界线: id=${worldline.id}, 名称=${worldline.name}`, { context: 'CharacterStore' });
      log.debug(`世界线详情: 天赋池=${worldline.talentPoolIds?.join(', ') || 'N/A'}`, { context: 'CharacterStore' });
    } else {
      log.info('清除世界线选择', { context: 'CharacterStore' });
    }
    set({
      selectedWorldline: worldline,
      drawnTalents: [],
      selectedTalents: [],
      selectedBackgrounds: [],
    });
    log.debug('重置天赋和背景选择', { context: 'CharacterStore' });
  },

  setDrawnTalents: (talents) => {
    const totalTalents = talents.reduce((sum, group) => sum + group.length, 0);
    log.info(`设置抽取的天赋: ${talents.length}组, 共${totalTalents}个`, { context: 'CharacterStore' });
    talents.forEach((group, i) => {
      log.debug(`第${i + 1}组天赋: ${group.map(t => `${t.name}(${t.rarity})`).join(', ')}`, { context: 'CharacterStore' });
    });
    set({
      drawnTalents: talents,
      selectedTalents: [],
    });
  },

  selectTalent: (groupIndex, talent) =>
    set((state) => {
      log.info(`选择天赋: 第${groupIndex + 1}组 -> "${talent.name}" (${talent.rarity})`, { context: 'CharacterStore' });

      const newSelected = [...state.selectedTalents];

      // 找到这一组之前选择的天赋并移除
      const previousSelection = state.drawnTalents[groupIndex]?.find((t) =>
        state.selectedTalents.some((st) => st.id === t.id)
      );

      if (previousSelection) {
        const index = newSelected.findIndex((t) => t.id === previousSelection.id);
        if (index !== -1) {
          newSelected.splice(index, 1);
          log.debug(`替换之前选择的天赋: "${previousSelection.name}"`, { context: 'CharacterStore' });
        }
      }

      // 添加新选择
      newSelected.push(talent);
      log.debug(`当前已选天赋: ${newSelected.map(t => t.name).join(', ')} (${newSelected.length}/3)`, { context: 'CharacterStore' });

      return { selectedTalents: newSelected };
    }),

  toggleBackground: (backgroundId) =>
    set((state) => {
      const selected = state.selectedBackgrounds.includes(backgroundId);

      if (selected) {
        log.info(`取消选择背景: ${backgroundId}`, { context: 'CharacterStore' });
        const newBackgrounds = state.selectedBackgrounds.filter((id) => id !== backgroundId);
        log.debug(`当前背景: ${newBackgrounds.join(', ') || '无'}`, { context: 'CharacterStore' });
        return {
          selectedBackgrounds: newBackgrounds,
        };
      } else {
        log.info(`选择背景: ${backgroundId}`, { context: 'CharacterStore' });
        const newBackgrounds = [...state.selectedBackgrounds, backgroundId];
        log.debug(`当前背景: ${newBackgrounds.join(', ')}`, { context: 'CharacterStore' });
        return {
          selectedBackgrounds: newBackgrounds,
        };
      }
    }),

  reset: () => {
    log.info('重置角色Store', { context: 'CharacterStore' });
    set({
      character: null,
      selectedWorldline: null,
      drawnTalents: [],
      selectedTalents: [],
      selectedBackgrounds: [],
    });
  },
}));
