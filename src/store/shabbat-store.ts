import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultShabbatSchedules } from '../data/shabbat-presets';
import type { DeviceId } from '../types/device';
import type { ShabbatDeviceSchedule, ShabbatState } from '../types/shabbat';

type PersistedShabbatStore = Partial<ShabbatState>;

interface ShabbatStore extends ShabbatState {
  setEnabled: (isEnabled: boolean) => void;
  updateSchedule: (deviceId: DeviceId, patch: Partial<ShabbatDeviceSchedule>) => void;
  resetSchedules: () => void;
}

function withDisabledScheduleDefaults(state: PersistedShabbatStore): PersistedShabbatStore {
  return {
    ...state,
    schedules: Object.fromEntries(
      Object.entries(defaultShabbatSchedules).map(([deviceId, defaultSchedule]) => [
        deviceId,
        {
          ...defaultSchedule,
          ...(state.schedules?.[deviceId as DeviceId] ?? {}),
          enabled: false
        }
      ])
    ) as Record<DeviceId, ShabbatDeviceSchedule>
  };
}

export const useShabbatStore = create<ShabbatStore>()(
  persist(
    (set) => ({
      isEnabled: false,
      candleLightingTime: '18:30',
      motzeiShabbatTime: '20:30',
      schedules: defaultShabbatSchedules,
      setEnabled: (isEnabled) => set({ isEnabled }),
      updateSchedule: (deviceId, patch) =>
        set((state) => ({
          schedules: {
            ...state.schedules,
            [deviceId]: { ...state.schedules[deviceId], ...patch }
          }
        })),
      resetSchedules: () => set({ schedules: defaultShabbatSchedules })
    }),
    {
      name: 'royal-water-villa:shabbat-mode',
      version: 2,
      migrate: (persistedState) => withDisabledScheduleDefaults(persistedState as PersistedShabbatStore)
    }
  )
);
