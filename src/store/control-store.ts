import { create } from 'zustand';
import { controlService } from '../services/control-service';
import type { Device, DeviceId, DeviceStateMap } from '../types/device';

interface ControlStore {
  devices: Device[];
  states: DeviceStateMap | null;
  isLoading: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  providerName: string;
  loadDevices: () => Promise<void>;
  syncDevices: () => Promise<void>;
  setDeviceState: (deviceId: DeviceId, isOn: boolean) => Promise<void>;
  turnOffAll: () => Promise<void>;
  setOffline: (isOffline: boolean) => void;
}

export const useControlStore = create<ControlStore>((set, get) => ({
  devices: [],
  states: null,
  isLoading: true,
  isSyncing: false,
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  providerName: controlService.getProviderName(),

  async loadDevices() {
    set({ isLoading: true });
    try {
      const result = await controlService.getDevices();
      set({
        devices: result.devices,
        states: result.states,
        providerName: controlService.getProviderName(),
        isLoading: false
      });
    } catch (error) {
      console.error('[ControlStore] loadDevices failed', { error });
      set({
        providerName: controlService.getProviderName(),
        isLoading: false
      });
    }
  },

  async syncDevices() {
    if (get().isSyncing) {
      return;
    }

    set({ isSyncing: true });
    try {
      const result = await controlService.getDevices();
      set({
        devices: result.devices,
        states: result.states,
        providerName: controlService.getProviderName(),
        isSyncing: false
      });
    } catch (error) {
      console.error('[ControlStore] syncDevices failed', { error });
      set({ isSyncing: false });
    }
  },

  async setDeviceState(deviceId, isOn) {
    const previousStates = get().states;
    if (previousStates) {
      set({
        states: {
          ...previousStates,
          [deviceId]: { ...previousStates[deviceId], isOn }
        }
      });
    }

    try {
      const updated = await controlService.setDeviceState(deviceId, isOn);
      const states = get().states;
      if (states) {
        set({ states: { ...states, [deviceId]: updated } });
      }
    } catch (error) {
      console.error('[ControlStore] device command failed', { deviceId, isOn, error });
      if (previousStates) {
        set({ states: previousStates });
      }
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
