import { homeAssistantDeviceMappings } from '../../config/home-assistant-mappings';
import { defaultDeviceStates, devices } from '../../data/devices';
import type { DeviceId, DeviceState, DeviceStateMap } from '../../types/device';
import type { HomeAssistantDebugEntity, HomeAssistantServiceResponse, HomeAssistantState } from '../../types/home-assistant';
import type { ControlProvider } from '../../types/provider';

const STORAGE_KEY = 'royal-water-villa:home-assistant-device-states';
const CONTROLLABLE_DOMAINS = new Set(['light', 'switch', 'cover', 'fan', 'climate']);
const DIAGNOSTIC_DOMAINS = new Set(['select', 'number', 'sensor', 'binary_sensor', 'button']);

function readStates(): DeviceStateMap {
  if (typeof localStorage === 'undefined') {
    return structuredClone(defaultDeviceStates);
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultDeviceStates, ...JSON.parse(stored) } : structuredClone(defaultDeviceStates);
  } catch {
    return structuredClone(defaultDeviceStates);
  }
}

function writeStates(states: DeviceStateMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

function getUnavailableStates(states: DeviceStateMap) {
  const next = { ...states };
  for (const device of devices) {
    if (homeAssistantDeviceMappings[device.id]) {
      next[device.id] = { ...next[device.id], isOn: false, isAvailable: false };
    }
  }
  return next;
}

function getDomain(entityId: string) {
  return entityId.split('.')[0] ?? 'homeassistant';
}

function validateHomeAssistantMappings() {
  for (const [deviceId, mapping] of Object.entries(homeAssistantDeviceMappings)) {
    if (!mapping) {
      continue;
    }

    const domain = getDomain(mapping.entityId);
    if (!CONTROLLABLE_DOMAINS.has(domain)) {
      console.error('[HA] invalid mapping ignored', {
        deviceId,
        entityId: mapping.entityId,
        reason: `Domain ${domain} is not a guest-controllable domain`
      });
    }
  }
}

function parseHomeAssistantStates(payload: unknown): HomeAssistantState[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is HomeAssistantState => Boolean(item && typeof item === 'object' && 'entity_id' in item));
  }

  if (payload && typeof payload === 'object') {
    const maybeResult = (payload as { result?: unknown }).result;
    if (Array.isArray(maybeResult)) {
      return maybeResult.filter((item): item is HomeAssistantState => Boolean(item && typeof item === 'object' && 'entity_id' in item));
    }

    const maybeStates = (payload as { states?: unknown }).states;
    if (Array.isArray(maybeStates)) {
      return maybeStates.filter((item): item is HomeAssistantState => Boolean(item && typeof item === 'object' && 'entity_id' in item));
    }
  }

  console.error('[HA] states response parsing failed', { payload });
  return [];
}

function normalizeHomeAssistantEntities(states: HomeAssistantState[]): HomeAssistantDebugEntity[] {
  const mappedEntityIds = new Set(
    Object.values(homeAssistantDeviceMappings)
      .map((mapping) => mapping?.entityId)
      .filter((entityId): entityId is string => Boolean(entityId))
  );

  return states.map((state) => ({
    entityId: state.entity_id,
    friendlyName: state.attributes?.friendly_name ?? state.entity_id,
    domain: getDomain(state.entity_id),
    state: state.state,
    deviceClass: typeof state.attributes?.device_class === 'string' ? state.attributes.device_class : undefined,
    entityCategory: typeof state.attributes?.entity_category === 'string' ? state.attributes.entity_category : undefined,
    isControllable: CONTROLLABLE_DOMAINS.has(getDomain(state.entity_id)),
    isDiagnostic: DIAGNOSTIC_DOMAINS.has(getDomain(state.entity_id)) || state.attributes?.entity_category === 'diagnostic',
    isMapped: mappedEntityIds.has(state.entity_id)
  }));
}

function logHomeAssistantEntitySummary(entities: HomeAssistantDebugEntity[]) {
  const skippedByDomain = entities.reduce<Record<string, number>>((counts, entity) => {
    if (!entity.isControllable) {
      counts[entity.domain] = (counts[entity.domain] ?? 0) + 1;
    }
    return counts;
  }, {});

  console.info('[HA] total entities loaded', entities.length);
  console.info('[HA] controllable entities loaded', entities.filter((entity) => entity.isControllable).length);
  console.info('[HA] skipped entities by domain', skippedByDomain);
}

function getIsOnFromState(state: HomeAssistantState) {
  const domain = getDomain(state.entity_id);
  if (state.state === 'unavailable' || state.state === 'unknown') {
    return { isOn: false, isAvailable: false };
  }
  if (domain === 'fan') {
    const percentage = typeof state.attributes?.percentage === 'number' ? state.attributes.percentage : 0;
    return { isOn: state.state === 'on', isAvailable: true, percentage };
  }
  if (domain === 'climate') {
    return { isOn: state.state !== 'off', isAvailable: true, hvacMode: state.state };
  }
  if (domain === 'cover') {
    return { isOn: state.state === 'open' || state.state === 'opening', isAvailable: true };
  }
  return { isOn: state.state === 'on', isAvailable: true };
}

function isValidControllableEntity(entityId: string) {
  return CONTROLLABLE_DOMAINS.has(getDomain(entityId));
}

function hasValidGuestMapping(deviceId: DeviceId) {
  const mapping = homeAssistantDeviceMappings[deviceId];
  return Boolean(mapping && isValidControllableEntity(mapping.entityId));
}

function getGuestDevices() {
  return devices.filter((device) => hasValidGuestMapping(device.id));
}

function getServiceRequest(entityId: string, nextIsOn: boolean) {
  const domain = getDomain(entityId);
  if (domain === 'cover') {
    return {
      endpoint: nextIsOn ? 'turn-on' : 'turn-off',
      domain,
      service: nextIsOn ? 'open_cover' : 'close_cover'
    } as const;
  }

  if (domain === 'light' || domain === 'switch') {
    return {
      endpoint: 'toggle',
      domain,
      service: 'toggle'
    } as const;
  }

  return {
    endpoint: nextIsOn ? 'turn-on' : 'turn-off',
    domain,
    service: nextIsOn ? 'turn_on' : 'turn_off'
  } as const;
}

async function requestHomeAssistantService(entityId: string, nextIsOn: boolean, serviceData?: Record<string, unknown>) {
  const request = getServiceRequest(entityId, nextIsOn);
  const payload = { entityId, domain: request.domain, service: request.service, serviceData };

  console.info('[HA] Toggle requested', { entityId, nextIsOn });
  console.info('[HA] entity selected', { entityId });
  console.info('[HA] service domain', request.domain);
  console.info('[HA] service name', request.service);
  console.info('[HA] service payload', payload);

  const response = await fetch(`/api/home-assistant/${request.endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const responsePayload = (await response.json()) as HomeAssistantServiceResponse;
  console.info('[HA] service response', { status: response.status, payload: responsePayload });
  if (!response.ok || responsePayload.success === false) {
    throw new Error(responsePayload.error ?? `Home Assistant ${request.service} failed with ${response.status}`);
  }

  console.info('[HA] Toggle success', { entityId, payload: responsePayload });
}

async function requestHomeAssistantCustomService(
  endpoint: 'turn-on' | 'turn-off' | 'toggle',
  entityId: string,
  domain: string,
  service: string,
  serviceData?: Record<string, unknown>
) {
  const payload = { entityId, domain, service, serviceData };

  console.info('[HA] entity selected', { entityId });
  console.info('[HA] service domain', domain);
  console.info('[HA] service name', service);
  console.info('[HA] service payload', payload);

  const response = await fetch(`/api/home-assistant/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const responsePayload = (await response.json()) as HomeAssistantServiceResponse;
  console.info('[HA] service response', { status: response.status, payload: responsePayload });
  if (!response.ok || responsePayload.success === false) {
    throw new Error(responsePayload.error ?? `Home Assistant ${service} failed with ${response.status}`);
  }
}

export class HomeAssistantProvider implements ControlProvider {
  readonly name = 'HomeAssistantProvider';

  async getDevices() {
    validateHomeAssistantMappings();
    console.info('[HA] Loading states');
    const cachedStates = readStates();

    try {
      const response = await fetch('/api/home-assistant/states');
      if (!response.ok) {
        throw new Error(`Home Assistant states failed with ${response.status}`);
      }

      const homeAssistantStates = parseHomeAssistantStates(await response.json());
      const homeAssistantEntities = normalizeHomeAssistantEntities(homeAssistantStates);
      logHomeAssistantEntitySummary(homeAssistantEntities);
      const next = { ...cachedStates };

      for (const [deviceId, mapping] of Object.entries(homeAssistantDeviceMappings)) {
        if (!mapping) {
          continue;
        }

        if (!isValidControllableEntity(mapping.entityId)) {
          next[deviceId as DeviceId] = { ...next[deviceId as DeviceId], isOn: false, isAvailable: false };
          continue;
        }

        next[deviceId as DeviceId] = { ...next[deviceId as DeviceId], isOn: false, isAvailable: false };
        const state = homeAssistantStates.find((item) => item.entity_id === mapping.entityId);
        if (!state) {
          console.error('[HA] mapped entity missing', { deviceId, entityId: mapping.entityId });
          continue;
        }

        next[deviceId as DeviceId] = { ...next[deviceId as DeviceId], ...getIsOnFromState(state) };
        console.info('[HomeAssistantProvider] device synced', {
          deviceId,
          entityId: mapping.entityId,
          state: state.state
        });
      }

      writeStates(next);
      console.info('[HA] States loaded');
      return { devices: getGuestDevices(), states: next, localSystemOnline: true, localSystemError: null, homeAssistantEntities };
    } catch (error) {
      console.error('[HA] States failed', { error });
      return {
        devices: getGuestDevices(),
        states: getUnavailableStates(cachedStates),
        localSystemOnline: false,
        localSystemError: error instanceof Error ? error.message : 'Home Assistant states unavailable'
      };
    }
  }

  async setDeviceState(deviceId: DeviceId, state: Partial<DeviceState>) {
    const mapping = homeAssistantDeviceMappings[deviceId];
    const nextIsOn = Boolean(state.isOn);

    if (!mapping) {
      console.error('[HA] Toggle failed', { deviceId, error: 'Missing Home Assistant mapping' });
      throw new Error(`Missing Home Assistant mapping for ${deviceId}`);
    }

    if (!isValidControllableEntity(mapping.entityId)) {
      console.error('[HA] Toggle failed', { deviceId, entityId: mapping.entityId, error: 'Invalid Home Assistant entity domain' });
      throw new Error(`Invalid Home Assistant mapping for ${deviceId}`);
    }

    try {
      await requestHomeAssistantService(mapping.entityId, nextIsOn);
      const states = readStates();
      const updated = { ...states[deviceId], isOn: nextIsOn, isAvailable: true };
      const next = { ...states, [deviceId]: updated };
      writeStates(next);
      return updated;
    } catch (error) {
      console.error('[HA] Toggle failed', { deviceId, error });
      throw error;
    }
  }

  async setFanPercentage(deviceId: DeviceId, percentage: number) {
    const mapping = homeAssistantDeviceMappings[deviceId];
    const safePercentage = Math.max(0, Math.min(100, Math.round(percentage)));

    if (!mapping || getDomain(mapping.entityId) !== 'fan') {
      console.error('[HA] fan percentage failed', { deviceId, error: 'Missing fan mapping' });
      throw new Error(`Missing fan Home Assistant mapping for ${deviceId}`);
    }

    try {
      if (safePercentage === 0) {
        await requestHomeAssistantCustomService('turn-off', mapping.entityId, 'fan', 'turn_off');
      } else {
        await requestHomeAssistantCustomService('turn-on', mapping.entityId, 'fan', 'set_percentage', {
          percentage: safePercentage
        });
      }
      const refreshed = await this.getDevices();
      return refreshed.states[deviceId];
    } catch (error) {
      console.error('[HA] fan percentage failed', { deviceId, percentage: safePercentage, error });
      throw error;
    }
  }

  async setClimatePower(deviceId: DeviceId, isOn: boolean) {
    const mapping = homeAssistantDeviceMappings[deviceId];

    if (!mapping || getDomain(mapping.entityId) !== 'climate') {
      console.error('[HA] climate power failed', { deviceId, error: 'Missing climate mapping' });
      throw new Error(`Missing climate Home Assistant mapping for ${deviceId}`);
    }

    try {
      await requestHomeAssistantCustomService(isOn ? 'turn-on' : 'turn-off', mapping.entityId, 'climate', isOn ? 'turn_on' : 'turn_off');
      const refreshed = await this.getDevices();
      return refreshed.states[deviceId];
    } catch (error) {
      console.error('[HA] climate power failed', { deviceId, isOn, error });
      throw error;
    }
  }

  async setClimateHvacMode(deviceId: DeviceId, hvacMode: string) {
    const mapping = homeAssistantDeviceMappings[deviceId];

    if (!mapping || getDomain(mapping.entityId) !== 'climate') {
      console.error('[HA] climate mode failed', { deviceId, error: 'Missing climate mapping' });
      throw new Error(`Missing climate Home Assistant mapping for ${deviceId}`);
    }

    try {
      await requestHomeAssistantCustomService('turn-on', mapping.entityId, 'climate', 'set_hvac_mode', {
        hvac_mode: hvacMode
      });
      const refreshed = await this.getDevices();
      return refreshed.states[deviceId];
    } catch (error) {
      console.error('[HA] climate mode failed', { deviceId, hvacMode, error });
      throw error;
    }
  }

  async turnOffAll() {
    const states = readStates();
    const next = { ...states };

    for (const device of devices) {
      const mapping = homeAssistantDeviceMappings[device.id];
      if (!mapping) {
        continue;
      }

      if (!isValidControllableEntity(mapping.entityId)) {
        console.error('[HA] turnOffAll skipped invalid mapping', { deviceId: device.id, entityId: mapping.entityId });
        continue;
      }

      try {
        await requestHomeAssistantService(mapping.entityId, false);
        next[device.id] = { ...next[device.id], isOn: false };
      } catch (error) {
        console.error('[HomeAssistantProvider] turnOffAll failed for device', { deviceId: device.id, error });
      }
    }
    writeStates(next);
    return next;
  }
}
