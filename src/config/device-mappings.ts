import type { DeviceId } from '../types/device';

export interface TuyaDeviceMapping {
  tuyaDeviceId: string;
  commandCode: string;
}

export const tuyaDeviceMappings: Partial<Record<DeviceId, TuyaDeviceMapping>> = {
  wallLight: {
    tuyaDeviceId: 'bffcde940e008e6f8bsiaj',
    commandCode: 'switch_1'
  },
  pergolaLight: {
    tuyaDeviceId: 'bfa046217ed22cbb88x6mw',
    commandCode: 'switch_1'
  },
  livingRoomLedWall: {
    tuyaDeviceId: 'bfae97a0468699bf6es1mx',
    commandCode: 'switch_1'
  },
  livingRoomCeilingSpots: {
    tuyaDeviceId: 'bfae97a0468699bf6es1mx',
    commandCode: 'switch_2'
  },
  barLight: {
    tuyaDeviceId: 'bf2af07eae210d7a388lkx',
    commandCode: 'switch_1'
  },
  poolLight: {
    tuyaDeviceId: 'bf2af07eae210d7a388lkx',
    commandCode: 'switch_2'
  },
  rearPathLight: {
    tuyaDeviceId: 'bfb7a879c0ebf0c6e66lc2',
    commandCode: 'switch_1'
  },
  outdoorWallLight: {
    tuyaDeviceId: 'bfe6a09f4ad1838449xayz',
    commandCode: 'switch_1'
  },
  bathroomLight: {
    tuyaDeviceId: 'bfe6a09f4ad1838449xayz',
    commandCode: 'switch_2'
  },
  ceilingFan: {
    tuyaDeviceId: 'bfed21a4097abed981lg6y',
    commandCode: 'switch'
  },
  ceilingFanLight: {
    tuyaDeviceId: 'bfed21a4097abed981lg6y',
    commandCode: 'light'
  },
  bathroomHeater: {
    tuyaDeviceId: 'bfeb1883831883a9225uan',
    commandCode: 'switch'
  }
};
