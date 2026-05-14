import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeviceId } from '../types/device';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  deviceId: DeviceId;
  isOn: boolean;
  success: boolean;
}

interface ActivityLogStore {
  entries: ActivityLogEntry[];
  addEntry: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
}

export const useActivityLogStore = create<ActivityLogStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            {
              ...entry,
              id: `${entry.deviceId}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
              timestamp: new Date().toISOString()
            },
            ...state.entries
          ].slice(0, 20)
        }))
    }),
    {
      name: 'royal-water-villa:activity-log'
    }
  )
);
