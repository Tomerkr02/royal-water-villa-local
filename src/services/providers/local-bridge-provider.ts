import type { DeviceId, DeviceState } from '../../types/device';
import type { ControlProvider } from '../../types/provider';

const BRIDGE_BASE_URL = 'http://royal-villa-bridge.local/api';

export class LocalBridgeProvider implements ControlProvider {
  readonly name = 'LocalBridgeProvider';

  async getDevices() {
    // Future local endpoint:
    // GET http://royal-villa-bridge.local/api/devices
    const response = await fetch(`${BRIDGE_BASE_URL}/devices`);
    if (!response.ok) {
      throw new Error('Local bridge failed to load devices');
    }
    return response.json();
  }

  async setDeviceState(deviceId: DeviceId, state: Partial<DeviceState>) {
    // Future local endpoint:
    // PATCH http://royal-villa-bridge.local/api/devices/:id/state
    const response = await fetch(`${BRIDGE_BASE_URL}/devices/${deviceId}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    if (!response.ok) {
      throw new Error(`Local bridge failed to update ${deviceId}`);
    }
    return response.json();
  }

  async turnOffAll() {
    // Future local endpoint:
    // POST http://royal-villa-bridge.local/api/devices/turn-off-all
    const response = await fetch(`${BRIDGE_BASE_URL}/devices/turn-off-all`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Local bridge failed to turn everything off');
    }
    return response.json();
  }
}
