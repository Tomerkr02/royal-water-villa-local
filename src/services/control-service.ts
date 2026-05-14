import type { DeviceId, DeviceState } from '../types/device';
import type { ControlProvider } from '../types/provider';
import { MockProvider } from './providers/mock-provider';

class ControlService {
  private provider: ControlProvider = new MockProvider();

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

  turnOffAll() {
    return this.provider.turnOffAll();
  }
}

export const controlService = new ControlService();
