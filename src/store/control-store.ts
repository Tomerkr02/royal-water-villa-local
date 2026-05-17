import { create } from 'zustand';
import { controlService } from '../services/control-service';
import { useActivityLogStore } from './activity-log-store';
import type { Device, DeviceId, DeviceStateMap } from '../types/device';
import type { HomeAssistantDebugEntity } from '../types/home-assistant';

const COMMAND_RETRY_DELAY_MS = 900;

interface ControlStore {
  devices: Device[];
  states: DeviceStateMap | null;
  isLoading: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  controlError: string | null;
  localSystemOnline: boolean | null;
  localSystemError: string | null;
  pendingDeviceIds: Partial<Record<DeviceId, boolean>>;
  homeAssistantEntities: HomeAssistantDebugEntity[];
  providerName: string;
  loadDevices: () => Promise<void>;
  syncDevices: () => Promise<void>;
  setDeviceState: (deviceId: DeviceId, isOn: boolean) => Promise<void>;
  setFanPercentage: (deviceId: DeviceId, percentage: number) => Promise<void>;
  setClimatePower: (deviceId: DeviceId, isOn: boolean) => Promise<void>;
  setClimateHvacMode: (deviceId: DeviceId, hvacMode: string) => Promise<void>;
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
  localSystemError: null,
  pendingDeviceIds: {},
  homeAssistantEntities: [],
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
        localSystemError: result.localSystemError ?? null,
        homeAssistantEntities: result.homeAssistantEntities ?? [],
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
        localSystemError: result.localSystemError ?? null,
        homeAssistantEntities: result.homeAssistantEntities ?? get().homeAssistantEntities,
        controlError: null,
        isSyncing: false
      });
    } catch (error) {
      console.error('[ControlStore] syncDevices failed', { error });
      set({ controlError: 'sync-failed', isSyncing: false });
    }
  },

  async setDeviceState(deviceId, isOn) {
    if (get().pendingDeviceIds[deviceId]) {
      return;
    }

    if (get().isOffline) {
      console.error('[ControlStore] blocked command while offline', { deviceId, isOn });
      useActivityLogStore.getState().addEntry({ deviceId, isOn, success: false });
      set({ controlError: 'offline' });
      return;
    }

    const previousStates = get().states;
    set({ pendingDeviceIds: { ...get().pendingDeviceIds, [deviceId]: true } });

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
      void get().syncDevices();
      useActivityLogStore.getState().addEntry({ deviceId, isOn, success: true });
      set({
        controlError: null,
        pendingDeviceIds: { ...get().pendingDeviceIds, [deviceId]: false }
      });
    } catch (error) {
      console.error('[ControlStore] device command failed', { deviceId, isOn, error });
      useActivityLogStore.getState().addEntry({ deviceId, isOn, success: false });
      const nextStates = previousStates
        ? {
          ...previousStates,
          [deviceId]: { ...previousStates[deviceId], isAvailable: false }
        }
        : previousStates;
      set({
        states: nextStates ?? get().states,
        controlError: 'command-failed',
        localSystemError: error instanceof Error ? error.message : 'Home Assistant command failed',
        pendingDeviceIds: { ...get().pendingDeviceIds, [deviceId]: false }
      });
    }
  },

  async setFanPercentage(deviceId, percentage) {
    if (get().isOffline) {
      set({ controlError: 'offline' });
      return;
    }

    try {
      const updated = await controlService.setFanPercentage(deviceId, percentage);
      const states = get().states;
      if (states) {
        set({ states: { ...states, [deviceId]: updated } });
      }
      await get().syncDevices();
      set({ controlError: null });
    } catch (error) {
      console.error('[ControlStore] fan percentage failed', { deviceId, percentage, error });
      set({
        controlError: 'command-failed',
        localSystemError: error instanceof Error ? error.message : 'Home Assistant fan command failed'
      });
    }
  },

  async setClimatePower(deviceId, isOn) {
    if (get().isOffline) {
      set({ controlError: 'offline' });
      return;
    }

    try {
      const updated = await controlService.setClimatePower(deviceId, isOn);
      const states = get().states;
      if (states) {
        set({ states: { ...states, [deviceId]: updated } });
      }
      await get().syncDevices();
      set({ controlError: null });
    } catch (error) {
      console.error('[ControlStore] climate power failed', { deviceId, isOn, error });
      set({
        controlError: 'command-failed',
        localSystemError: error instanceof Error ? error.message : 'Home Assistant climate command failed'
      });
    }
  },

  async setClimateHvacMode(deviceId, hvacMode) {
    if (get().isOffline) {
      set({ controlError: 'offline' });
      return;
    }

    try {
      const updated = await controlService.setClimateHvacMode(deviceId, hvacMode);
      const states = get().states;
      if (states) {
        set({ states: { ...states, [deviceId]: updated } });
      }
      await get().syncDevices();
      set({ controlError: null });
    } catch (error) {
      console.error('[ControlStore] climate mode failed', { deviceId, hvacMode, error });
      set({
        controlError: 'command-failed',
        localSystemError: error instanceof Error ? error.message : 'Home Assistant climate mode command failed'
      });
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
