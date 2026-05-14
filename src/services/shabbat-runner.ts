import { controlService } from './control-service';
import { useShabbatStore } from '../store/shabbat-store';
import type { DeviceId } from '../types/device';
import type { ShabbatDeviceSchedule } from '../types/shabbat';

const EXECUTED_ACTIONS_KEY = 'royal-water-villa-shabbat-executed-actions';
const RUNNER_INTERVAL_MS = 30_000;
const EXECUTION_WINDOW_MS = Math.max(60_000, RUNNER_INTERVAL_MS);

type ShabbatRunnerActionType =
  | 'fridayOn'
  | 'nightOff'
  | 'saturdayMorningOn'
  | 'saturdayMorningOff'
  | 'motzeiShabbatOff';

interface DueAction {
  deviceId: DeviceId;
  actionType: ShabbatRunnerActionType;
  time: string;
  isOn: boolean;
  isAllowedOnDate: (date: Date) => boolean;
}

let intervalId: number | null = null;
let isTickRunning = false;

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readExecutedActionIds() {
  try {
    const stored = localStorage.getItem(EXECUTED_ACTIONS_KEY);
    return new Set<string>(stored ? (JSON.parse(stored) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function writeExecutedActionIds(actionIds: Set<string>) {
  localStorage.setItem(EXECUTED_ACTIONS_KEY, JSON.stringify([...actionIds]));
}

function getActionId(deviceId: DeviceId, actionType: ShabbatRunnerActionType, date: Date) {
  return `${deviceId}:${actionType}:${formatLocalDate(date)}`;
}

function isTimeDue(time: string, now: Date) {
  const [hourText, minuteText] = time.split(':');
  const scheduledAt = new Date(now);
  scheduledAt.setHours(Number(hourText), Number(minuteText), 0, 0);

  const diffMs = now.getTime() - scheduledAt.getTime();
  return diffMs >= 0 && diffMs <= EXECUTION_WINDOW_MS;
}

function getMinutes(time: string) {
  const [hourText, minuteText] = time.split(':');
  return Number(hourText) * 60 + Number(minuteText);
}

function isFriday(date: Date) {
  return date.getDay() === 5;
}

function isSaturday(date: Date) {
  return date.getDay() === 6;
}

function getScheduledActions(schedule: ShabbatDeviceSchedule, candleLightingTime: string): DueAction[] {
  if (!schedule.enabled) {
    return [];
  }

  const actions: DueAction[] = [];
  if (schedule.beforeShabbatOn) {
    actions.push({
      deviceId: schedule.deviceId,
      actionType: 'fridayOn',
      time: candleLightingTime,
      isOn: true,
      isAllowedOnDate: isFriday
    });
  }
  if (schedule.nightOffTime) {
    const nightOffIsBeforeMidnight = getMinutes(schedule.nightOffTime) >= getMinutes(candleLightingTime);
    actions.push({
      deviceId: schedule.deviceId,
      actionType: 'nightOff',
      time: schedule.nightOffTime,
      isOn: false,
      isAllowedOnDate: nightOffIsBeforeMidnight ? isFriday : isSaturday
    });
  }
  if (schedule.morningOnTime) {
    actions.push({
      deviceId: schedule.deviceId,
      actionType: 'saturdayMorningOn',
      time: schedule.morningOnTime,
      isOn: true,
      isAllowedOnDate: isSaturday
    });
  }
  if (schedule.morningOffTime) {
    actions.push({
      deviceId: schedule.deviceId,
      actionType: 'saturdayMorningOff',
      time: schedule.morningOffTime,
      isOn: false,
      isAllowedOnDate: isSaturday
    });
  }
  if (schedule.motzeiOffTime) {
    actions.push({
      deviceId: schedule.deviceId,
      actionType: 'motzeiShabbatOff',
      time: schedule.motzeiOffTime,
      isOn: false,
      isAllowedOnDate: isSaturday
    });
  }
  return actions;
}

async function runShabbatTick() {
  if (!isBrowser() || isTickRunning) {
    return;
  }

  isTickRunning = true;
  try {
    const { isEnabled, candleLightingTime, schedules } = useShabbatStore.getState();
    if (!isEnabled) {
      return;
    }

    const now = new Date();
    const executedActionIds = readExecutedActionIds();
    const dueActions = Object.values(schedules)
      .flatMap((schedule) => getScheduledActions(schedule, candleLightingTime))
      .filter((action) => action.isAllowedOnDate(now) && isTimeDue(action.time, now));

    for (const action of dueActions) {
      const actionId = getActionId(action.deviceId, action.actionType, now);
      if (executedActionIds.has(actionId)) {
        continue;
      }

      console.info('[Shabbat Runner] action due', {
        actionId,
        deviceId: action.deviceId,
        actionType: action.actionType,
        time: action.time,
        isOn: action.isOn
      });

      try {
        await controlService.setDeviceState(action.deviceId, action.isOn);
        executedActionIds.add(actionId);
        writeExecutedActionIds(executedActionIds);
        console.info('[Shabbat Runner] action executed', { actionId });
      } catch (error) {
        console.error('[Shabbat Runner] action failed', { actionId, error });
      }
    }
  } finally {
    isTickRunning = false;
  }
}

export function startShabbatRunner() {
  if (!isBrowser() || intervalId !== null) {
    return;
  }

  console.info('[Shabbat Runner] started');
  void runShabbatTick();
  intervalId = window.setInterval(() => {
    void runShabbatTick();
  }, RUNNER_INTERVAL_MS);
}

export function stopShabbatRunner() {
  if (!isBrowser() || intervalId === null) {
    return;
  }

  window.clearInterval(intervalId);
  intervalId = null;
}
