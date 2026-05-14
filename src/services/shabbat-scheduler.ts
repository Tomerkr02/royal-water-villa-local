import type { DeviceId } from '../types/device';
import type { ShabbatActionPreview, ShabbatDeviceSchedule } from '../types/shabbat';

export interface NextShabbatAction {
  deviceId: DeviceId;
  action: 'turnOn' | 'turnOff';
  at: Date;
}

export function buildShabbatActionPreview(
  schedules: Record<DeviceId, ShabbatDeviceSchedule>
): ShabbatActionPreview[] {
  return Object.values(schedules)
    .flatMap((schedule) => {
      if (!schedule.enabled) {
        return [];
      }

      const actions: ShabbatActionPreview[] = [];
      if (schedule.beforeShabbatOn) {
        actions.push({
          deviceId: schedule.deviceId,
          at: 'לפני כניסת שבת',
          action: 'turnOn',
          reason: 'הדלקה לפני שבת'
        });
      }
      if (schedule.nightOffTime) {
        actions.push({
          deviceId: schedule.deviceId,
          at: schedule.nightOffTime,
          action: 'turnOff',
          reason: 'כיבוי לילה'
        });
      }
      if (schedule.morningOnTime) {
        actions.push({
          deviceId: schedule.deviceId,
          at: schedule.morningOnTime,
          action: 'turnOn',
          reason: 'הדלקת בוקר'
        });
      }
      if (schedule.morningOffTime) {
        actions.push({
          deviceId: schedule.deviceId,
          at: schedule.morningOffTime,
          action: 'turnOff',
          reason: 'כיבוי בוקר'
        });
      }
      if (schedule.motzeiOffTime) {
        actions.push({
          deviceId: schedule.deviceId,
          at: schedule.motzeiOffTime,
          action: 'turnOff',
          reason: 'כיבוי מוצאי שבת'
        });
      }
      return actions;
    })
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function describeSchedule(schedule: ShabbatDeviceSchedule): string {
  if (!schedule.enabled) {
    return 'לא פעיל לשבת';
  }

  const parts = [schedule.beforeShabbatOn ? 'נדלק לפני שבת' : 'לא נדלק לפני שבת'];
  parts.push(schedule.nightOffTime ? `כיבוי ב-${schedule.nightOffTime}` : 'נשאר דולק בלילה');
  if (schedule.morningOnTime) {
    parts.push(`נדלק בבוקר ${schedule.morningOnTime}`);
  }
  if (schedule.morningOffTime) {
    parts.push(`נכבה בבוקר ${schedule.morningOffTime}`);
  }
  if (schedule.motzeiOffTime) {
    parts.push(`כיבוי במוצ"ש ${schedule.motzeiOffTime}`);
  }
  return parts.join(' · ');
}

function dateForWeekday(base: Date, weekday: number, time: string) {
  const [hourText, minuteText] = time.split(':');
  const date = new Date(base);
  const daysAhead = (weekday - base.getDay() + 7) % 7;
  date.setDate(base.getDate() + daysAhead);
  date.setHours(Number(hourText), Number(minuteText), 0, 0);

  if (date.getTime() <= base.getTime()) {
    date.setDate(date.getDate() + 7);
  }

  return date;
}

export function getNextShabbatAction(
  schedules: Record<DeviceId, ShabbatDeviceSchedule>,
  candleLightingTime: string,
  now = new Date()
): NextShabbatAction | null {
  const actions = Object.values(schedules).flatMap((schedule) => {
    if (!schedule.enabled) {
      return [];
    }

    const nextActions: NextShabbatAction[] = [];
    if (schedule.beforeShabbatOn) {
      nextActions.push({
        deviceId: schedule.deviceId,
        action: 'turnOn',
        at: dateForWeekday(now, 5, candleLightingTime)
      });
    }
    if (schedule.nightOffTime) {
      const nightOffWeekday =
        Number(schedule.nightOffTime.split(':')[0]) * 60 + Number(schedule.nightOffTime.split(':')[1]) >=
        Number(candleLightingTime.split(':')[0]) * 60 + Number(candleLightingTime.split(':')[1])
          ? 5
          : 6;
      nextActions.push({
        deviceId: schedule.deviceId,
        action: 'turnOff',
        at: dateForWeekday(now, nightOffWeekday, schedule.nightOffTime)
      });
    }
    if (schedule.morningOnTime) {
      nextActions.push({
        deviceId: schedule.deviceId,
        action: 'turnOn',
        at: dateForWeekday(now, 6, schedule.morningOnTime)
      });
    }
    if (schedule.morningOffTime) {
      nextActions.push({
        deviceId: schedule.deviceId,
        action: 'turnOff',
        at: dateForWeekday(now, 6, schedule.morningOffTime)
      });
    }
    if (schedule.motzeiOffTime) {
      nextActions.push({
        deviceId: schedule.deviceId,
        action: 'turnOff',
        at: dateForWeekday(now, 6, schedule.motzeiOffTime)
      });
    }
    return nextActions;
  });

  return actions.sort((first, second) => first.at.getTime() - second.at.getTime())[0] ?? null;
}
