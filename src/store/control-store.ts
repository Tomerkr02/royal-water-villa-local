import { create } from 'zustand';
import { controlService } from '../services/control-service';
import { useActivityLogStore } from './activity-log-store';
import type { Device, DeviceId, DeviceStateMap } from '../types/device';

const COMMAND_RETRY_DELAY_MS = 900;

interface ControlStore {
  devices: Device[];
  states: DeviceStateMap | null;
  isLoading: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  controlError: string | null;
  localSystemOnline: boolean | null;
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
  controlError: null,
  localSystemOnline: null,
  providerName: controlService.getProviderName(),

  async loadDevices() {
    set({ isLoading: true });
    try {
      const result = await controlService.getDevices();
      set({
        devices: result.devices,
        states: result.states,
        providerName: controlService.getProviderName(),
        localSystemOnline: result.localSystemOnline ?? null,
        controlError: null,
        isLoading: false
      });
    } catch (error) {
      console.error('[ControlStore] loadDevices failed', { error });
      set({
        providerName: controlService.getProviderName(),
        controlError: 'sync-failed',
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
        localSystemOnline: result.localSystemOnline ?? null,
        controlError: null,
        isSyncing: false
      });
    } catch (error) {
      console.error('[ControlStore] syncDevices failed', { error });
      set({ controlError: 'sync-failed', isSyncing: false });
    }
  },

  async setDeviceState(deviceId, isOn) {
    if (get().isOffline) {
      console.error('[ControlStore] blocked command while offline', { deviceId, isOn });
      useActivityLogStore.getState().addEntry({ deviceId, isOn, success: false });
      set({ controlError: 'offline' });
      return;
    }

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
      let updated;
      try {
        updated = await controlService.setDeviceState(deviceId, isOn);
      } catch (firstError) {
        console.warn('[ControlStore] retrying device command once', { deviceId, isOn, firstError });
        await new Promise((resolve) => window.setTimeout(resolve, COMMAND_RETRY_DELAY_MS));
        updated = await controlService.setDeviceState(deviceId, isOn);
      }
      const states = get().states;
      if (states) {
        set({ states: { ...states, [deviceId]: updated } });
      }
      useActivityLogStore.getState().addEntry({ deviceId, isOn, success: true });
      set({ controlError: null });
    } catch (error) {
      console.error('[ControlStore] device command failed', { deviceId, isOn, error });
      useActivityLogStore.getState().addEntry({ deviceId, isOn, success: false });
      if (previousStates) {
        set({ states: previousStates });
      }
      set({ controlError: 'command-failed' });
    }
  },

  async turnOffAll() {
    try {
      const states = await controlService.turnOffAll();
      set({ states });
    } catch (error) {
      console.error('[ControlStore] turnOffAll failed', { error });
      set({ controlError: 'command-failed' });
    }
  },

  setOffline(isOffline) {
    set({ isOffline, controlError: isOffline ? 'offline' : null });
  }
}));
