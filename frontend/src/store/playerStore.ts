import { create } from "zustand";

export interface Track {
  id: string;
  title: string;
  url?: string;           // signed URL — fetched on demand
  duration?: number;      // seconds
  peaks?: number[][] | null;
  artist?: string;
}

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  seekTarget?: number;    // set to trigger a seek; cleared after
}

interface PlayerActions {
  /** Replace queue and optionally start playing at given index */
  setQueue: (tracks: Track[], startIndex?: number) => void;
  /** Update URL/duration/peaks for a track already in the queue */
  updateTrackUrl: (
    id: string,
    url: string,
    duration?: number,
    peaks?: number[][] | null,
  ) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  clearSeek: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
}

export type PlayerStore = PlayerState & PlayerActions;

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  seekTarget: undefined,

  // ── Actions ────────────────────────────────────────────────────────────────
  setQueue: (tracks, startIndex = 0) =>
    set({ queue: tracks, currentIndex: startIndex, currentTime: 0, duration: 0 }),

  updateTrackUrl: (id, url, duration, peaks) =>
    set((s) => ({
      queue: s.queue.map((t) =>
        t.id === id
          ? {
              ...t,
              url,
              duration: duration ?? t.duration,
              peaks: peaks !== undefined ? peaks : t.peaks,
            }
          : t,
      ),
    })),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),

  seek: (time) => set({ seekTarget: time }),
  clearSeek: () => set({ seekTarget: undefined }),

  setVolume: (v) => set({ volume: v, isMuted: v === 0 }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  next: () => {
    const { queue, currentIndex } = get();
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, isPlaying: true, currentTime: 0 });
    }
  },

  prev: () => {
    const { currentTime, currentIndex } = get();
    if (currentTime > 3) {
      // Restart current track
      set({ seekTarget: 0 });
    } else if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isPlaying: true, currentTime: 0 });
    }
  },

  stop: () => set({ isPlaying: false, currentTime: 0 }),

  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
}));

/** Selector: current track or undefined */
export const selectCurrentTrack = (s: PlayerStore): Track | undefined =>
  s.queue[s.currentIndex];
