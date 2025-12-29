import { create } from 'zustand';
import type { GameSession, Message, Check } from '../utils/types';
import { log } from '../services/logService';

interface GameStore {
  session: GameSession | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSession: (session: GameSession | null) => void;
  addMessage: (message: Message) => void;
  addCheck: (check: Check) => void;
  addEvent: (event: string) => void;
  incrementTurn: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  session: null,
  isLoading: false,
  error: null,

  setSession: (session) => {
    if (session) {
      log.info(`设置游戏会话: id=${session.id}, 角色ID=${session.characterId}, 回合=${session.currentTurn}`, { context: 'GameStore' });
      log.debug(`会话详情: 对话历史=${session.dialogueHistory.length}条, 检定历史=${session.checkHistory.length}条`, { context: 'GameStore' });
    } else {
      log.info('清除游戏会话', { context: 'GameStore' });
    }
    set({ session });
  },

  addMessage: (message) =>
    set((state) => {
      if (!state.session) {
        log.warn('尝试添加消息但会话为空', { context: 'GameStore' });
        return state;
      }

      log.info(`添加消息: 角色=${message.role}, 长度=${message.content.length}字符`, { context: 'GameStore' });
      log.debug(`消息内容预览: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`, { context: 'GameStore' });

      const newHistory = [...state.session.dialogueHistory, message];
      log.debug(`对话历史更新: ${state.session.dialogueHistory.length} -> ${newHistory.length}条`, { context: 'GameStore' });

      return {
        session: {
          ...state.session,
          dialogueHistory: newHistory,
        },
      };
    }),

  addCheck: (check) =>
    set((state) => {
      if (!state.session) {
        log.warn('尝试添加检定但会话为空', { context: 'GameStore' });
        return state;
      }

      log.info(`添加检定: 属性=${check.attribute}, 骰值=${check.diceValue}, 属性值=${check.attributeValue}, 结果=${check.result}`, { context: 'GameStore' });
      log.debug(`检定详情: 回合=${check.turn}, 情境=${check.context}`, { context: 'GameStore' });

      const newHistory = [...state.session.checkHistory, check];
      log.debug(`检定历史更新: ${state.session.checkHistory.length} -> ${newHistory.length}条`, { context: 'GameStore' });

      return {
        session: {
          ...state.session,
          checkHistory: newHistory,
        },
      };
    }),

  addEvent: (event) =>
    set((state) => {
      if (!state.session) {
        log.warn('尝试添加事件但会话为空', { context: 'GameStore' });
        return state;
      }

      log.info(`添加事件: "${event.substring(0, 50)}${event.length > 50 ? '...' : ''}"`, { context: 'GameStore' });

      const newLog = [...state.session.eventLog, event];
      log.debug(`事件日志更新: ${state.session.eventLog.length} -> ${newLog.length}条`, { context: 'GameStore' });

      return {
        session: {
          ...state.session,
          eventLog: newLog,
        },
      };
    }),

  incrementTurn: () =>
    set((state) => {
      if (!state.session) {
        log.warn('尝试增加回合但会话为空', { context: 'GameStore' });
        return state;
      }

      const newTurn = state.session.currentTurn + 1;
      log.info(`回合增加: ${state.session.currentTurn} -> ${newTurn}`, { context: 'GameStore' });

      return {
        session: {
          ...state.session,
          currentTurn: newTurn,
        },
      };
    }),

  setLoading: (loading) => {
    log.debug(`设置加载状态: ${loading}`, { context: 'GameStore' });
    set({ isLoading: loading });
  },

  setError: (error) => {
    if (error) {
      log.error(`设置错误状态: ${error}`, undefined, { context: 'GameStore' });
    } else {
      log.debug('清除错误状态', { context: 'GameStore' });
    }
    set({ error });
  },

  reset: () => {
    log.info('重置游戏Store', { context: 'GameStore' });
    set({
      session: null,
      isLoading: false,
      error: null,
    });
  },
}));
