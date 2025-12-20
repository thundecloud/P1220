import { create } from 'zustand';
import type { Character, Worldline, Talent } from '../utils/types';

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

  setCharacter: (character) => set({ character }),

  setSelectedWorldline: (worldline) =>
    set({
      selectedWorldline: worldline,
      drawnTalents: [],
      selectedTalents: [],
      selectedBackgrounds: [],
    }),

  setDrawnTalents: (talents) =>
    set({
      drawnTalents: talents,
      selectedTalents: [],
    }),

  selectTalent: (groupIndex, talent) =>
    set((state) => {
      const newSelected = [...state.selectedTalents];

      // 找到这一组之前选择的天赋并移除
      const previousSelection = state.drawnTalents[groupIndex]?.find((t) =>
        state.selectedTalents.some((st) => st.id === t.id)
      );

      if (previousSelection) {
        const index = newSelected.findIndex((t) => t.id === previousSelection.id);
        if (index !== -1) {
          newSelected.splice(index, 1);
        }
      }

      // 添加新选择
      newSelected.push(talent);

      return { selectedTalents: newSelected };
    }),

  toggleBackground: (backgroundId) =>
    set((state) => {
      const selected = state.selectedBackgrounds.includes(backgroundId);

      if (selected) {
        return {
          selectedBackgrounds: state.selectedBackgrounds.filter(
            (id) => id !== backgroundId
          ),
        };
      } else {
        return {
          selectedBackgrounds: [...state.selectedBackgrounds, backgroundId],
        };
      }
    }),

  reset: () =>
    set({
      character: null,
      selectedWorldline: null,
      drawnTalents: [],
      selectedTalents: [],
      selectedBackgrounds: [],
    }),
}));
