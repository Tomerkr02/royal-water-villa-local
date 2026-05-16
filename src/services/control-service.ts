import type { DeviceId, DeviceState } from '../types/device';
import type { ControlProvider } from '../types/provider';
import { createProvider } from './provider-registry';

class ControlService {
  private provider: ControlProvider = createProvider();

  setProvider(provider: ControlProvider) {
    this.provider = provider;
  }

  getProviderName() {
    return this.provider.name;
  }

  getDevices() {
    return this.provider.getDevices();
  }

  setDeviceState(deviceId: DeviceId, isOn: boolean) {
    return this.provider.setDeviceState(deviceId, { isOn });
  }

  setFanPercentage(deviceId: DeviceId, percentage: number) {
    if (!this.provider.setFanPercentage) {
      return this.provider.setDeviceState(deviceId, { percentage, isOn: percentage > 0 });
    }
    return this.provider.setFanPercentage(deviceId, percentage);
  }

  setClimatePower(deviceId: DeviceId, isOn: boolean) {
    if (!this.provider.setClimatePower) {
      return this.provider.setDeviceState(deviceId, { isOn });
    }
    return this.provider.setClimatePower(deviceId, isOn);
  }

  setClimateHvacMode(deviceId: DeviceId, hvacMode: string) {
    if (!this.provider.setClimateHvacMode) {
      return this.provider.setDeviceState(deviceId, { hvacMode, isOn: hvacMode !== 'off' });
    }
    return this.provider.setClimateHvacMode(deviceId, hvacMode);
  }

  turnOffAll() {
    return this.provider.turnOffAll();
  }
}

export const controlService = new ControlService();
