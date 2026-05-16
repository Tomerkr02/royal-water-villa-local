import type { DeviceId } from '../types/device';

export interface HomeAssistantDeviceMapping {
  entityId: string;
}

export const homeAssistantDeviceMappings: Partial<Record<DeviceId, HomeAssistantDeviceMapping>> = {
  wallLight: {
    entityId: 'switch.tvrt_khvmh_wall_light_switch_1'
  },
  pergolaLight: {
    entityId: 'switch.tvrt_prgvlh_pergola_light_switch_1'
  },
  livingRoomLedWall: {
    entityId: 'switch.tvrt_slvn_salon_light_switch_2'
  },
  livingRoomCeilingSpots: {
    entityId: 'switch.tvrt_slvn_salon_light_switch_1'
  },
  barLight: {
    entityId: 'switch.tvrt_brykh_vbr_pool_light_bar_switch_2'
  },
  poolLight: {
    entityId: 'switch.tvrt_brykh_vbr_pool_light_bar_switch_1'
  },
  rearPathLight: {
    entityId: 'switch.tvrt_shbyl_khvry_back_pathway_light_switch_1'
  },
  outdoorWallLight: {
    entityId: 'switch.tvrt_mbtyh_vld_qyr_khvts_shower_outside_wall_switch_1'
  },
  bathroomLight: {
    entityId: 'switch.tvrt_mbtyh_vld_qyr_khvts_shower_outside_wall_switch_2'
  },
  ceilingFan: {
    entityId: 'fan.ceiling_fan_with_light'
  },
  ceilingFanLight: {
    entityId: 'light.ceiling_fan_with_light'
  },
  bathroomHeater: {
    entityId: 'climate.royal_heater'
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
