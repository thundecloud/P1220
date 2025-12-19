import { create } from 'zustand';
import type { GameSession, Message, Check } from '../utils/types';

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

  setSession: (session) => set({ session }),

  addMessage: (message) =>
    set((state) => {
      if (!state.session) return state;

      return {
        session: {
          ...state.session,
          dialogueHistory: [...state.session.dialogueHistory, message],
        },
      };
    }),

  addCheck: (check) =>
    set((state) => {
      if (!state.session) return state;

      return {
        session: {
          ...state.session,
          checkHistory: [...state.session.checkHistory, check],
        },
      };
    }),

  addEvent: (event) =>
    set((state) => {
      if (!state.session) return state;

      return {
        session: {
          ...state.session,
          eventLog: [...state.session.eventLog, event],
        },
      };
    }),

  incrementTurn: () =>
    set((state) => {
      if (!state.session) return state;

      return {
        session: {
          ...state.session,
          currentTurn: state.session.currentTurn + 1,
        },
      };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      session: null,
      isLoading: false,
      error: null,
    }),
}));
