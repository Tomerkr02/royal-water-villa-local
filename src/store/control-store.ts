import { create } from 'zustand';
import { controlService } from '../services/control-service';
import type { Device, DeviceId, DeviceStateMap } from '../types/device';

interface ControlStore {
  devices: Device[];
  states: DeviceStateMap | null;
  isLoading: boolean;
  isOffline: boolean;
  providerName: string;
  loadDevices: () => Promise<void>;
  setDeviceState: (deviceId: DeviceId, isOn: boolean) => Promise<void>;
  turnOffAll: () => Promise<void>;
  setOffline: (isOffline: boolean) => void;
}

export const useControlStore = create<ControlStore>((set, get) => ({
  devices: [],
  states: null,
  isLoading: true,
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  providerName: controlService.getProviderName(),

  async loadDevices() {
    set({ isLoading: true });
    const result = await controlService.getDevices();
    set({
      devices: result.devices,
      states: result.states,
      providerName: controlService.getProviderName(),
      isLoading: false
    });
  },

  async setDeviceState(deviceId, isOn) {
    try {
      const updated = await controlService.setDeviceState(deviceId, isOn);
      const states = get().states;
      if (states) {
        set({ states: { ...states, [deviceId]: updated } });
      }
    } catch (error) {
      console.error('[ControlStore] device command failed', { deviceId, isOn, error });
    }
  },

  async turnOffAll() {
    try {
      const states = await controlService.turnOffAll();
      set({ states });
    } catch (error) {
      console.error('[ControlStore] turnOffAll failed', { error });
    }
  },

  setOffline(isOffline) {
    set({ isOffline });
  }
}));
