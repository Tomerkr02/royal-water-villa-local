import type { Device, DeviceArea, DeviceId, DeviceStateMap } from '../types/device';

export const areaLabels: Record<DeviceArea, string> = {
  living: 'סלון',
  outdoor: 'חוץ / פרגולה',
  pool: 'בריכה',
  bathroom: 'שירותים / מקלחת',
  bedroom: 'חדר שינה'
};

export const devices: Device[] = [
  { id: 'wallLight', name: 'תאורת חומה', area: 'outdoor', kind: 'switch', capabilities: ['onOff'] },
  { id: 'pergolaLight', name: 'תאורת פרגולה', area: 'outdoor', kind: 'switch', capabilities: ['onOff'] },
  { id: 'livingRoomLedWall', name: 'תאורת קיר LED בסלון', area: 'living', kind: 'switch', capabilities: ['onOff'] },
  { id: 'livingRoomCeilingSpots', name: 'ספוטים תקרה סלון', area: 'living', kind: 'switch', capabilities: ['onOff'] },
  { id: 'barLight', name: 'תאורת בר חיצוני', area: 'outdoor', kind: 'switch', capabilities: ['onOff'] },
  { id: 'poolLight', name: 'תאורת בריכה', area: 'pool', kind: 'switch', capabilities: ['onOff'] },
  { id: 'rearPathLight', name: 'תאורת שביל אחורי', area: 'outdoor', kind: 'switch', capabilities: ['onOff'] },
  { id: 'outdoorWallLight', name: 'תאורת קיר חוץ', area: 'outdoor', kind: 'switch', capabilities: ['onOff'] },
  { id: 'bathroomLight', name: 'תאורת אמבטיה', area: 'bathroom', kind: 'switch', capabilities: ['onOff'] },
  {
    id: 'ceilingFan',
    name: 'מאוורר תקרה',
    area: 'bedroom',
    kind: 'fan',
    capabilities: ['onOff', 'speed'],
    supportedSpeeds: [1, 2, 3]
  },
  { id: 'ceilingFanLight', name: 'תאורת מאוורר / חדר שינה', area: 'bedroom', kind: 'switch', capabilities: ['onOff'] },
  { id: 'bathroomHeater', name: 'תנור חימום מקלחת', area: 'bathroom', kind: 'switch', capabilities: ['onOff'] }
];

export const defaultDeviceStates: DeviceStateMap = devices.reduce((states, device) => {
  states[device.id] = device.id === 'ceilingFan' ? { isOn: false, speed: 1 } : { isOn: false };
  return states;
}, {} as DeviceStateMap);

export const deviceById = devices.reduce((map, device) => {
  map[device.id] = device;
  return map;
}, {} as Record<DeviceId, Device>);
