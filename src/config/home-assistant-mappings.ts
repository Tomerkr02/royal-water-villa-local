import type { DeviceId } from '../types/device';

export interface HomeAssistantDeviceMapping {
  entityId: string;
}

export const homeAssistantDeviceMappings: Partial<Record<DeviceId, HomeAssistantDeviceMapping>> = {
  // Demo mapping. Replace with the real villa entity_id when Home Assistant is installed locally.
  poolLight: {
    entityId: 'light.pool_light'
  }
};

export const futureHomeAssistantModes = {
  scenes: true,
  automations: true,
  occupancyMode: true,
  guestMode: true,
  kioskMode: true,
  localOnlyMode: true
};
