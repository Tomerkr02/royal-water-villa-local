import { devices } from './devices';
import type { DeviceId } from '../types/device';
import type { ShabbatDeviceSchedule } from '../types/shabbat';

export const defaultShabbatSchedules = devices.reduce((schedules, device) => {
  schedules[device.id] = {
    deviceId: device.id,
    area: device.area,
    enabled: false,
    beforeShabbatOn: false,
    nightOffTime: null,
    morningOnTime: null,
    morningOffTime: null,
    motzeiOffTime: null
  };
  return schedules;
}, {} as Record<DeviceId, ShabbatDeviceSchedule>);
