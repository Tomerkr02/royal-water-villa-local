import type { DeviceId } from '../types/device';

export interface HomeAssistantDeviceMapping {
  entityId: string;
}

export const homeAssistantDeviceMappings: Partial<Record<DeviceId, HomeAssistantDeviceMapping>> = {
  wallLight: {
    entityId: 'switch.wall_light'
  },
  pergolaLight: {
    entityId: 'switch.pergola_light'
  },
  livingRoomLedWall: {
    entityId: 'light.living_room_led_wall'
  },
  livingRoomCeilingSpots: {
    entityId: 'light.living_room_ceiling_spots'
  },
  barLight: {
    entityId: 'switch.bar_light'
  },
  // Demo mapping example. Replace these entity_id values with the real villa Home Assistant entities.
  poolLight: {
    entityId: 'light.pool_light'
  },
  rearPathLight: {
    entityId: 'switch.rear_path_light'
  },
  outdoorWallLight: {
    entityId: 'switch.outdoor_wall_light'
  },
  bathroomLight: {
    entityId: 'light.bathroom_light'
  },
  ceilingFan: {
    entityId: 'fan.ceiling_fan'
  },
  ceilingFanLight: {
    entityId: 'light.ceiling_fan_light'
  },
  bathroomHeater: {
    entityId: 'switch.bathroom_heater'
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
