import type { DeviceId } from '../types/device';
import type { ShabbatActionPreview, ShabbatDeviceSchedule } from '../types/shabbat';

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
