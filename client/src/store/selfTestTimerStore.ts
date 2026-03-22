import { create } from "zustand";

interface SelfTestTimerState {
  setId: string | null;
  startedAt: number | null;
  endTime: number | null;
  hydrateTimer: (setId: string) => void;
  startTimer: (setId: string, durationInMinutes: number) => void;
  clearTimer: () => void;
}

function timerStorageKey(setId: string) {
  return `self-test:${setId}:timer`;
}

const useSelfTestTimerStore = create<SelfTestTimerState>((set, get) => ({
  setId: null,
  startedAt: null,
  endTime: null,
  hydrateTimer: (setId) => {
    const raw = localStorage.getItem(timerStorageKey(setId));
    if (!raw) {
      set({ setId, startedAt: null, endTime: null });
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { startedAt?: number; endTime?: number };
      set({
        setId,
        startedAt: parsed.startedAt ?? null,
        endTime: parsed.endTime ?? null,
      });
    } catch {
      set({ setId, startedAt: null, endTime: null });
    }
  },
  startTimer: (setId, durationInMinutes) => {
    const startedAt = Date.now();
    const endTime = startedAt + durationInMinutes * 60 * 1000;
    localStorage.setItem(timerStorageKey(setId), JSON.stringify({ startedAt, endTime }));
    set({ setId, startedAt, endTime });
  },
  clearTimer: () => {
    const currentSetId = get().setId;
    if (currentSetId) {
      localStorage.removeItem(timerStorageKey(currentSetId));
    }
    set({ startedAt: null, endTime: null });
  },
}));

export default useSelfTestTimerStore;
