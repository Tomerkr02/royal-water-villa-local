import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Armchair,
  BedDouble,
  BookOpen,
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Flame,
  Home,
  Info,
  Lamp,
  Moon,
  Minus,
  Palmtree,
  Plus,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  Waves,
  WifiOff
} from 'lucide-react';
import bedroomLightingImage from './assets/images/royal-water-villa-bedroom-lighting-design-18.png';
import blueWaterNightImage from './assets/images/royal-water-villa-blue-water-night-view-25.png';
import outdoorLoungeImage from './assets/images/royal-water-villa-outdoor-lounge-night-08.png';
import poolFruitTrayImage from './assets/images/royal-water-villa-pool-fruit-tray-20.png';
import { languageLabels, type Language, type Translation } from './i18n/translations';
import { useI18n, useLanguageStore } from './i18n/language-store';
import { getNextShabbatAction, type NextShabbatAction } from './services/shabbat-scheduler';
import { startShabbatRunner, stopShabbatRunner } from './services/shabbat-runner';
import { releaseScreenWakeLock, requestScreenWakeLock } from './services/wake-lock';
import { useActivityLogStore } from './store/activity-log-store';
import { useControlStore } from './store/control-store';
import { useShabbatStore } from './store/shabbat-store';
import type { Device, DeviceArea, DeviceId } from './types/device';
import type { ShabbatDeviceSchedule } from './types/shabbat';

type Screen = 'home' | 'lighting' | 'scenes' | 'shabbat' | 'guest';
type DeveloperEntityFilter = 'all' | 'controllable' | 'diagnostics';

const navItems: Array<{ id: Screen; icon: typeof Home }> = [
  { id: 'home', icon: Home },
  { id: 'lighting', icon: Lamp },
  { id: 'scenes', icon: Sparkles },
  { id: 'shabbat', icon: CalendarClock },
  { id: 'guest', icon: Info }
];

const areaIcons: Record<DeviceArea, typeof Home> = {
  living: Armchair,
  outdoor: Palmtree,
  pool: Waves,
  bathroom: Flame,
  bedroom: BedDouble
};

const screenVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 }
};

const screenImages: Record<Screen, string> = {
  home: blueWaterNightImage,
  lighting: outdoorLoungeImage,
  scenes: outdoorLoungeImage,
  shabbat: bedroomLightingImage,
  guest: poolFruitTrayImage
};

function groupByArea(devices: Device[]) {
  return devices.reduce((groups, device) => {
    groups[device.area] = [...(groups[device.area] ?? []), device];
    return groups;
  }, {} as Partial<Record<DeviceArea, Device[]>>);
}

function areaOrder() {
  return ['living', 'outdoor', 'pool', 'bathroom', 'bedroom'] as DeviceArea[];
}

function describeLocalizedSchedule(schedule: ShabbatDeviceSchedule, t: Translation) {
  if (!schedule.enabled) {
    return t.shabbat.summaryInactive;
  }

  const parts: string[] = [schedule.beforeShabbatOn ? t.shabbat.summaryBeforeOn : t.shabbat.summaryBeforeOff];
  parts.push(schedule.nightOffTime ? `${t.shabbat.summaryNightOff}${schedule.nightOffTime}` : t.shabbat.summaryNoNightOff);
  if (schedule.morningOnTime) {
    parts.push(`${t.shabbat.summaryMorningOn}${schedule.morningOnTime}`);
  }
  if (schedule.morningOffTime) {
    parts.push(`${t.shabbat.summaryMorningOff}${schedule.morningOffTime}`);
  }
  if (schedule.motzeiOffTime) {
    parts.push(`${t.shabbat.summaryMotzeiOff}${schedule.motzeiOffTime}`);
  }
  return parts.join(' · ');
}

function ToggleSwitch({
  isOn,
  onToggle,
  label,
  disabled = false
}: {
  isOn: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isOn}
      disabled={disabled}
      onClick={onToggle}
      className={`toggle-switch relative h-14 w-28 rounded-full border transition ${
        isOn
          ? 'border-villa-gold bg-villa-gold/85 shadow-glow'
          : 'border-white/10 bg-white/10'
      }`}
    >
      <span
        className={`absolute top-1.5 h-11 w-11 rounded-full bg-villa-pearl shadow-lg transition ${
          isOn ? 'right-[58px]' : 'right-1.5'
        }`}
      />
    </button>
  );
}

function TimeStepper({
  value,
  onChange,
  nullable = false
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  nullable?: boolean;
}) {
  const { t } = useI18n();
  const current = value ?? '00:00';
  const [hourText, minuteText] = current.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const setTime = (nextHour: number, nextMinute: number) => {
    const normalizedHour = (nextHour + 24) % 24;
    const normalizedMinute = (nextMinute + 60) % 60;
    onChange(`${String(normalizedHour).padStart(2, '0')}:${String(normalizedMinute).padStart(2, '0')}`);
  };

  return (
    <div className="time-stepper flex items-center gap-3">
      {nullable ? (
        <button
          type="button"
          onClick={() => onChange(value ? null : '00:00')}
          className="touch-button rounded-xl border border-white/10 bg-white/10 px-4 text-sm text-villa-pearl"
        >
          {value ? t.common.clearTime : t.common.addTime}
        </button>
      ) : null}
      <div className={`time-stepper-controls flex items-center gap-2 ${nullable && !value ? 'opacity-40' : ''}`}>
        <button className="icon-button" type="button" onClick={() => setTime(hour + 1, minute)}>
          <Plus size={20} />
        </button>
        <button className="icon-button" type="button" onClick={() => setTime(hour, minute + 15)}>
          <Plus size={16} />
        </button>
        <div className="time-display min-w-24 rounded-2xl border border-villa-gold/30 bg-black/25 px-5 py-3 text-center text-2xl font-semibold text-villa-pearl">
          {value ?? '--:--'}
        </div>
        <button className="icon-button" type="button" onClick={() => setTime(hour, minute - 15)}>
          <Minus size={16} />
        </button>
        <button className="icon-button" type="button" onClick={() => setTime(hour - 1, minute)}>
          <Minus size={20} />
        </button>
      </div>
    </div>
  );
}

function DeviceTile({ device }: { device: Device }) {
  const { t } = useI18n();
  const states = useControlStore((state) => state.states);
  const toggleDeviceState = useControlStore((state) => state.toggleDeviceState);
  const isPending = useControlStore((state) => Boolean(state.pendingDeviceIds[device.id]));
  const hasError = useControlStore((state) => Boolean(state.deviceErrorIds[device.id]));
  const isOn = states?.[device.id]?.isOn ?? false;
  const isAvailable = states?.[device.id]?.isAvailable ?? true;
  const Icon = areaIcons[device.area];
  const statusLabel = !isAvailable ? t.common.unavailable : isOn ? t.common.deviceOn : t.common.deviceOff;

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18 }}
      className={`glass-panel device-tile ${isOn ? 'device-on' : ''} ${!isAvailable ? 'device-unavailable' : ''} ${isPending ? 'device-pending' : ''} ${hasError ? 'device-error' : ''}`}
    >
      {isPending ? (
        <div className="device-pending-indicator" aria-hidden="true">
          <RefreshCw size={18} className="animate-spin" />
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="device-icon flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-villa-gold">
            <Icon size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-villa-pearl">{t.devices[device.id]}</h3>
            <p className="mt-1 text-base text-villa-mist">{t.areas[device.area]}</p>
            <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ${isOn ? 'status-on' : 'status-off'}`}>
              {statusLabel}
            </span>
          </div>
        </div>
        {device.kind === 'switch' ? (
          <ToggleSwitch
            isOn={isOn}
            disabled={!isAvailable || isPending}
            label={`${isOn ? t.lighting.turnOff : t.lighting.turnOn} ${t.devices[device.id]}`}
            onToggle={() => void toggleDeviceState(device.id)}
          />
        ) : null}
      </div>
      {device.kind === 'fan' ? <FanControls deviceId={device.id} /> : null}
      {device.kind === 'climate' ? <ClimateControls deviceId={device.id} /> : null}
    </motion.div>
  );
}

function FanControls({ deviceId }: { deviceId: DeviceId }) {
  const { t } = useI18n();
  const state = useControlStore((store) => store.states?.[deviceId]);
  const setFanPercentage = useControlStore((store) => store.setFanPercentage);
  const [draftPercentage, setDraftPercentage] = useState<number | null>(null);
  const percentage = state?.percentage ?? 0;
  const sliderValue = draftPercentage ?? percentage;
  const isAvailable = state?.isAvailable ?? true;

  const commitPercentage = () => {
    if (!isAvailable || draftPercentage === null || draftPercentage === percentage) {
      setDraftPercentage(null);
      return;
    }
    const next = draftPercentage;
    setDraftPercentage(null);
    void setFanPercentage(deviceId, next);
  };

  return (
    <div className="advanced-control mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-villa-gold">{t.common.fanSpeed}</span>
        <span className="quiet-pill">{percentage}%</span>
      </div>
      <input
        className="luxury-slider"
        type="range"
        min="0"
        max="100"
        step="5"
        value={sliderValue}
        disabled={!isAvailable}
        aria-label={t.common.fanSpeed}
        onChange={(event) => setDraftPercentage(Number(event.target.value))}
        onMouseUp={commitPercentage}
        onTouchEnd={commitPercentage}
        onKeyUp={commitPercentage}
      />
      <div className="mt-2 flex justify-between text-xs text-villa-mist">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function ClimateControls({ deviceId }: { deviceId: DeviceId }) {
  const { t } = useI18n();
  const state = useControlStore((store) => store.states?.[deviceId]);
  const setClimatePower = useControlStore((store) => store.setClimatePower);
  const setClimateHvacMode = useControlStore((store) => store.setClimateHvacMode);
  const isAvailable = state?.isAvailable ?? true;
  const hvacMode = state?.hvacMode ?? 'off';

  return (
    <div className="advanced-control mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-villa-gold">{t.common.heaterMode}</span>
        <span className="quiet-pill">{hvacMode}</span>
      </div>
      <div className="heater-actions">
        <button type="button" disabled={!isAvailable} onClick={() => void setClimatePower(deviceId, true)}>
          {t.common.heaterOn}
        </button>
        <button type="button" disabled={!isAvailable} onClick={() => void setClimateHvacMode(deviceId, 'heat')}>
          {t.common.heaterHeat}
        </button>
        <button type="button" disabled={!isAvailable} onClick={() => void setClimatePower(deviceId, false)}>
          {t.common.heaterOff}
        </button>
      </div>
    </div>
  );
}

function HomeAssistantDebugPanel() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<DeveloperEntityFilter>('all');
  const [searchText, setSearchText] = useState('');
  const entities = useControlStore((state) => state.homeAssistantEntities);
  const syncDevices = useControlStore((state) => state.syncDevices);
  const isSyncing = useControlStore((state) => state.isSyncing);
  const normalizedSearch = searchText.trim().toLowerCase();
  const filters: Array<{ id: DeveloperEntityFilter; label: string }> = [
    { id: 'all', label: t.common.haFilterAll },
    { id: 'controllable', label: t.common.haFilterControllable },
    { id: 'diagnostics', label: t.common.haFilterDiagnostics }
  ];
  const visibleEntities = entities.filter((entity) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'controllable' && entity.isControllable) ||
      (filter === 'diagnostics' && entity.isDiagnostic);
    const matchesSearch =
      !normalizedSearch ||
      entity.entityId.toLowerCase().includes(normalizedSearch) ||
      entity.friendlyName.toLowerCase().includes(normalizedSearch) ||
      entity.domain.toLowerCase().includes(normalizedSearch) ||
      entity.state.toLowerCase().includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });
  const groupedEntities = visibleEntities.reduce<Record<string, typeof visibleEntities>>((groups, entity) => {
    groups[entity.domain] = [...(groups[entity.domain] ?? []), entity];
    return groups;
  }, {});
  const domainOrder = Object.keys(groupedEntities).sort((a, b) => {
    const priority = ['switch', 'light', 'cover', 'fan', 'climate', 'select', 'sensor'];
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    }
    return a.localeCompare(b);
  });
  const controllableCount = entities.filter((entity) => entity.isControllable).length;
  const diagnosticsCount = entities.filter((entity) => entity.isDiagnostic).length;
  const copyEntityId = (entityId: string) => {
    if (!navigator.clipboard) {
      console.info('[HA] copy unavailable', { entityId });
      return;
    }
    void navigator.clipboard.writeText(entityId);
  };

  return (
    <div className="glass-panel ha-entities-panel">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-villa-pearl">{t.common.haEntities}</h3>
          <p className="mt-1 text-sm text-villa-mist">{t.common.haRelevantOnly}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="quiet-pill">
            {t.common.haRawCount}: {entities.length}
          </span>
          <span className="active-pill">
            {t.common.haControllableCount}: {controllableCount}
          </span>
          <span className="quiet-pill">
            {t.common.haDiagnosticsCount}: {diagnosticsCount}
          </span>
          <button
            type="button"
            className="refresh-button"
            onClick={() => void syncDevices()}
            disabled={isSyncing}
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            <span>{t.common.refresh}</span>
          </button>
        </div>
      </div>
      <div className="ha-tools mb-4">
        <div className="ha-search">
          <Search size={18} />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={t.common.haSearchPlaceholder}
          />
        </div>
        <div className="ha-filter-tabs">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ha-filter-tab ${filter === item.id ? 'ha-filter-tab-active' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ha-entities-list">
        {domainOrder.map((domain) => (
          <section key={domain} className="ha-domain-group">
            <div className="ha-domain-heading">
              <h4>{domain}</h4>
              <span className="quiet-pill">{groupedEntities[domain].length}</span>
            </div>
            <div className="grid gap-2">
              {groupedEntities[domain].map((entity) => (
                <div
                  key={entity.entityId}
                  className={`ha-entity-row ${entity.isControllable ? 'ha-entity-relevant' : ''} ${entity.isMapped ? 'ha-entity-mapped' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-villa-pearl">{entity.entityId}</p>
                      {entity.isMapped ? <span className="active-pill">{t.common.haMapped}</span> : null}
                      {entity.isControllable ? <span className="ha-entity-chip">{t.common.haRecommended}</span> : null}
                    </div>
                    <p className="truncate text-sm text-villa-mist">{entity.friendlyName}</p>
                    {entity.deviceClass || entity.entityCategory ? (
                      <p className="mt-1 truncate text-xs text-villa-mist">
                        {entity.deviceClass ? `${t.common.haDeviceClass}: ${entity.deviceClass}` : ''}
                        {entity.deviceClass && entity.entityCategory ? ' · ' : ''}
                        {entity.entityCategory ? `${t.common.haEntityCategory}: ${entity.entityCategory}` : ''}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 text-xs font-bold">
                    <span className="ha-entity-chip">{entity.domain}</span>
                    <span className={entity.state === 'on' || entity.state === 'open' ? 'status-on rounded-full px-3 py-1' : 'status-off rounded-full px-3 py-1'}>
                      {entity.state}
                    </span>
                    <button type="button" className="ha-copy-button" onClick={() => copyEntityId(entity.entityId)}>
                      <Copy size={16} />
                      <span>{t.common.copy}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function StatusRibbon() {
  const { t } = useI18n();
  const isOffline = useControlStore((state) => state.isOffline);
  const isSyncing = useControlStore((state) => state.isSyncing);
  const controlError = useControlStore((state) => state.controlError);
  const localSystemOnline = useControlStore((state) => state.localSystemOnline);

  const label = isOffline
    ? t.common.offlineStatus
    : controlError
      ? t.common.controlErrorStatus
      : isSyncing
        ? t.common.syncingStatus
        : localSystemOnline === false
          ? t.common.localSystemOffline
          : localSystemOnline === true
            ? t.common.localSystemOnline
            : t.common.connectedStatus;
  const statusClass =
    isOffline || controlError || localSystemOnline === false
      ? 'connection-error'
      : isSyncing
        ? 'connection-syncing'
        : 'connection-connected';

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-villa-mist">
      <span className={`connection-pill ${statusClass}`}>
        {isOffline ? <WifiOff size={16} /> : null}
        {label}
      </span>
    </div>
  );
}

function ErrorToast() {
  const { t } = useI18n();
  const controlError = useControlStore((state) => state.controlError);
  if (!controlError || controlError === 'offline') {
    return null;
  }

  return <div className="error-toast">{t.common.commandFailed}</div>;
}

function formatActionTime(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function ShabbatSummaryPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const isEnabled = useShabbatStore((state) => state.isEnabled);
  const schedules = useShabbatStore((state) => state.schedules);
  const candleLightingTime = useShabbatStore((state) => state.candleLightingTime);
  const includedCount = Object.values(schedules).filter((schedule) => schedule.enabled).length;
  const nextAction = getNextShabbatAction(schedules, candleLightingTime);

  return (
    <div className={`shabbat-summary ${compact ? 'shabbat-summary-compact' : ''}`}>
      <span>{isEnabled ? t.home.shabbatActive : t.common.off}</span>
      <span>
        {t.common.shabbatIncluded}: {includedCount}
      </span>
      <span>{formatNextAction(nextAction, t)}</span>
    </div>
  );
}

function formatNextAction(nextAction: NextShabbatAction | null, t: Translation) {
  if (!nextAction) {
    return `${t.common.nextShabbatAction}: ${t.common.noNextShabbatAction}`;
  }

  return `${t.common.nextShabbatAction}: ${t.devices[nextAction.deviceId]} · ${
    nextAction.action === 'turnOn' ? t.common.turnOnAction : t.common.turnOffAction
  } · ${formatActionTime(nextAction.at)}`;
}

function ActivityLogPanel() {
  const { t } = useI18n();
  const entries = useActivityLogStore((state) => state.entries);
  const visibleEntries = entries.slice(0, 5);

  return (
    <div className="glass-panel activity-log-panel">
      <h3 className="text-2xl font-semibold text-villa-pearl">{t.common.activityLog}</h3>
      <div className="mt-4 space-y-3">
        {visibleEntries.length ? (
          visibleEntries.map((entry) => (
            <div key={entry.id} className="activity-log-row">
              <div>
                <p className="font-semibold text-villa-pearl">{t.devices[entry.deviceId]}</p>
                <p className="text-sm text-villa-mist">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                  {entry.isOn ? t.common.deviceOn : t.common.deviceOff}
                </p>
              </div>
              <span className={entry.success ? 'status-on rounded-full px-3 py-1 text-xs font-bold' : 'status-off rounded-full px-3 py-1 text-xs font-bold'}>
                {entry.success ? t.common.success : t.common.failed}
              </span>
            </div>
          ))
        ) : (
          <p className="text-villa-mist">{t.common.noActivity}</p>
        )}
      </div>
    </div>
  );
}

function LanguageSwitcher() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const languages: Language[] = ['he', 'en', 'fr'];

  return (
    <div className="language-switcher" aria-label="Language">
      {languages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          className={`language-option ${language === item ? 'language-option-active' : ''}`}
        >
          {languageLabels[item]}
        </button>
      ))}
    </div>
  );
}

function HomeScreen({ goTo }: { goTo: (screen: Screen) => void }) {
  const { t } = useI18n();
  const devices = useControlStore((state) => state.devices);
  const states = useControlStore((state) => state.states);
  const turnOffAll = useControlStore((state) => state.turnOffAll);
  const isShabbatEnabled = useShabbatStore((state) => state.isEnabled);
  const activeCount = Object.values(states ?? {}).filter((state) => state.isOn).length;

  return (
    <ScreenFrame title={t.home.title} subtitle={t.home.subtitle}>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="hero-panel">
          <img className="hero-panel-image" src={blueWaterNightImage} alt="" aria-hidden="true" />
          <div className="hero-panel-overlay" />
          <div className="relative z-10 max-w-3xl">
            <p className="mb-4 text-xl text-villa-gold">{t.home.eyebrow}</p>
            <h2 className="whitespace-pre-line text-6xl font-semibold leading-tight text-villa-pearl">
              {t.home.headline}
            </h2>
          </div>
          <div className="relative z-10 mt-10 flex flex-wrap gap-4">
            <button className="primary-button" type="button" onClick={() => goTo('lighting')}>
              <Lamp size={24} />
              {t.home.lightingButton}
            </button>
            <button className="secondary-button" type="button" onClick={() => void turnOffAll()}>
              <Power size={24} />
              {t.home.turnOffAll}
            </button>
          </div>
        </section>
        <section className="grid gap-5">
          <button type="button" className="glass-panel text-start" onClick={() => goTo('shabbat')}>
            <div className="mb-8 flex items-center justify-between">
              <CalendarClock className="text-villa-gold" size={36} />
              {isShabbatEnabled ? <span className="active-pill">{t.common.active}</span> : <span className="quiet-pill">{t.common.off}</span>}
            </div>
            <h3 className="text-3xl font-semibold text-villa-pearl">{t.home.shabbatTitle}</h3>
            <p className="mt-3 text-lg leading-8 text-villa-mist">
              {isShabbatEnabled ? t.home.shabbatActive : t.home.shabbatDescription}
            </p>
            {isShabbatEnabled ? (
              <p className="mt-3 text-base leading-7 text-villa-gold">
                {t.home.shabbatActiveNote}
              </p>
            ) : null}
            <ShabbatSummaryPanel compact />
          </button>
          <div className="glass-panel active-devices-card">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg text-villa-mist">{t.home.activeDevices}</p>
              <span className={activeCount > 0 ? 'status-on rounded-full px-3 py-1 text-sm font-bold' : 'status-off rounded-full px-3 py-1 text-sm font-bold'}>
                {activeCount > 0 ? t.common.deviceOn : t.common.deviceOff}
              </span>
            </div>
            <p className="active-devices-count mt-4 text-6xl font-semibold text-villa-pearl">{activeCount}</p>
          </div>
          <ActivityLogPanel />
        </section>
      </div>
    </ScreenFrame>
  );
}

function LightingScreen() {
  const { t } = useI18n();
  const devices = useControlStore((state) => state.devices);
  const syncDevices = useControlStore((state) => state.syncDevices);
  const isSyncing = useControlStore((state) => state.isSyncing);
  const grouped = useMemo(() => groupByArea(devices), [devices]);

  return (
    <ScreenFrame title={t.lighting.title} subtitle={t.lighting.subtitle}>
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          className="refresh-button"
          onClick={() => void syncDevices()}
          disabled={isSyncing}
          aria-label={t.common.refresh}
          title={t.common.refresh}
        >
          <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          <span>{t.common.refresh}</span>
        </button>
      </div>
      <div className="space-y-8">
        {areaOrder().map((area) =>
          grouped[area]?.length ? (
            <section key={area}>
              <h2 className="mb-4 text-2xl font-semibold text-villa-gold">{t.areas[area]}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {grouped[area]?.map((device) => <DeviceTile key={device.id} device={device} />)}
              </div>
            </section>
          ) : null
        )}
      </div>
    </ScreenFrame>
  );
}

function ScenesScreen() {
  const { t } = useI18n();
  const setDeviceState = useControlStore((state) => state.setDeviceState);
  const turnOffAll = useControlStore((state) => state.turnOffAll);

  const scenes = [
    {
      label: t.scenes.poolEvening,
      icon: Waves,
      action: () => Promise.all(['poolLight', 'pergolaLight', 'barLight'].map((id) => setDeviceState(id as DeviceId, true)))
    },
    {
      label: t.scenes.calmHosting,
      icon: Sparkles,
      action: () =>
        Promise.all(['livingRoomLedWall', 'livingRoomCeilingSpots', 'outdoorWallLight'].map((id) => setDeviceState(id as DeviceId, true)))
    },
    {
      label: t.scenes.quietNight,
      icon: Moon,
      action: () => turnOffAll()
    }
  ];

  return (
    <ScreenFrame title={t.scenes.title} subtitle={t.scenes.subtitle}>
      <div className="grid gap-5 md:grid-cols-3">
        {scenes.map((scene) => {
          const Icon = scene.icon;
          return (
            <button key={scene.label} type="button" className="glass-panel min-h-64 text-start" onClick={() => void scene.action()}>
              <Icon size={42} className="mb-10 text-villa-gold" />
              <h3 className="text-3xl font-semibold text-villa-pearl">{scene.label}</h3>
              <p className="mt-4 text-lg leading-8 text-villa-mist">{t.scenes.description}</p>
            </button>
          );
        })}
      </div>
    </ScreenFrame>
  );
}

function ShabbatCard({ schedule }: { schedule: ShabbatDeviceSchedule }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const updateSchedule = useShabbatStore((state) => state.updateSchedule);

  return (
    <motion.div layout className="glass-panel p-0">
      <button type="button" className="flex w-full items-center justify-between gap-4 p-5 text-start" onClick={() => setOpen((value) => !value)}>
        <div>
          <h3 className="text-2xl font-semibold text-villa-pearl">{t.devices[schedule.deviceId]}</h3>
          <p className="mt-2 text-base leading-7 text-villa-mist">{describeLocalizedSchedule(schedule, t)}</p>
        </div>
        <div className="flex items-center gap-3">
          {schedule.enabled ? <span className="active-pill">{t.common.included}</span> : <span className="quiet-pill">{t.common.inactive}</span>}
          <ChevronDown className={`text-villa-gold transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-white/10 p-5">
              <SettingRow label={t.shabbat.deviceEnabled}>
                <ToggleSwitch
                  isOn={schedule.enabled}
                  label={`${t.shabbat.enableDevice} ${t.devices[schedule.deviceId]}`}
                  onToggle={() => updateSchedule(schedule.deviceId, { enabled: !schedule.enabled })}
                />
              </SettingRow>
              <SettingRow label={t.shabbat.beforeShabbat}>
                <ToggleSwitch
                  isOn={schedule.beforeShabbatOn}
                  label={`${t.shabbat.beforeShabbat} ${t.devices[schedule.deviceId]}`}
                  onToggle={() => updateSchedule(schedule.deviceId, { beforeShabbatOn: !schedule.beforeShabbatOn })}
                />
              </SettingRow>
              <SettingRow label={t.shabbat.nightOff}>
                <TimeStepper
                  nullable
                  value={schedule.nightOffTime}
                  onChange={(nightOffTime) => updateSchedule(schedule.deviceId, { nightOffTime })}
                />
              </SettingRow>
              <SettingRow label={t.shabbat.morningOn}>
                <TimeStepper
                  nullable
                  value={schedule.morningOnTime}
                  onChange={(morningOnTime) => updateSchedule(schedule.deviceId, { morningOnTime })}
                />
              </SettingRow>
              <SettingRow label={t.shabbat.morningOff}>
                <TimeStepper
                  nullable
                  value={schedule.morningOffTime}
                  onChange={(morningOffTime) => updateSchedule(schedule.deviceId, { morningOffTime })}
                />
              </SettingRow>
              <SettingRow label={t.shabbat.motzeiOff}>
                <TimeStepper
                  nullable
                  value={schedule.motzeiOffTime}
                  onChange={(motzeiOffTime) => updateSchedule(schedule.deviceId, { motzeiOffTime })}
                />
              </SettingRow>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="setting-row flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-black/18 p-4">
      <span className="text-xl font-medium text-villa-pearl">{label}</span>
      {children}
    </div>
  );
}

function ShabbatScreen() {
  const { t } = useI18n();
  const isEnabled = useShabbatStore((state) => state.isEnabled);
  const setEnabled = useShabbatStore((state) => state.setEnabled);
  const schedules = useShabbatStore((state) => state.schedules);
  const grouped = useMemo(() => {
    return Object.values(schedules).reduce((groups, schedule) => {
      groups[schedule.area] = [...(groups[schedule.area] ?? []), schedule];
      return groups;
    }, {} as Partial<Record<DeviceArea, ShabbatDeviceSchedule[]>>);
  }, [schedules]);

  return (
    <ScreenFrame title={t.shabbat.title} subtitle={t.shabbat.subtitle}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-villa-gold/25 bg-villa-gold/10 p-5">
        <div>
          <p className="text-2xl font-semibold text-villa-pearl">{t.shabbat.appToggleTitle}</p>
          <p className="mt-2 text-villa-mist">{t.shabbat.storedLocally}</p>
          <p className="mt-3 text-base leading-7 text-villa-gold">
            {isEnabled ? t.shabbat.runnerActive : t.shabbat.runnerOff} · {t.shabbat.keepTabletOn}
          </p>
          <ShabbatSummaryPanel compact />
        </div>
        <ToggleSwitch isOn={isEnabled} label={t.shabbat.enableMode} onToggle={() => setEnabled(!isEnabled)} />
      </div>
      <div className="space-y-7">
        {areaOrder().map((area) =>
          grouped[area]?.length ? (
            <section key={area}>
              <h2 className="mb-4 text-2xl font-semibold text-villa-gold">{t.areas[area]}</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {grouped[area]?.map((schedule) => (
                  <ShabbatCard key={schedule.deviceId} schedule={schedule} />
                ))}
              </div>
            </section>
          ) : null
        )}
      </div>
    </ScreenFrame>
  );
}

function GuestInfoScreen() {
  const { t } = useI18n();
  const items = [
    [t.guest.wifiTitle, t.guest.wifiText],
    [t.guest.checkinTitle, t.guest.checkinText],
    [t.guest.checkoutTitle, t.guest.checkoutText],
    [t.guest.houseRulesTitle, t.guest.houseRulesText]
  ];

  return (
    <ScreenFrame title={t.guest.title} subtitle={t.guest.subtitle}>
      <div className="grid gap-5 md:grid-cols-2">
        {items.map(([title, text]) => (
          <div key={title} className="glass-panel">
            <BookOpen size={32} className="mb-8 text-villa-gold" />
            <h3 className="text-3xl font-semibold text-villa-pearl">{title}</h3>
            <p className="mt-4 whitespace-pre-line text-xl leading-9 text-villa-mist">{text}</p>
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}

function DeveloperHomeAssistantScreen() {
  const { t } = useI18n();
  const localSystemOnline = useControlStore((state) => state.localSystemOnline);
  const localSystemError = useControlStore((state) => state.localSystemError);

  return (
    <ScreenFrame title={t.common.haEntities} subtitle={t.common.haRelevantOnly}>
      <div className="mb-5 flex flex-wrap gap-3 text-sm text-villa-mist">
        <span className="ha-debug-line">
          {t.common.haMode}: {localSystemOnline ? t.common.haActive : t.common.haUnavailable}
        </span>
        <span className="ha-debug-line">
          {t.common.lastHaError}: {localSystemError ?? t.common.noHaError}
        </span>
      </div>
      <HomeAssistantDebugPanel />
    </ScreenFrame>
  );
}

function ScreenFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.main variants={screenVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.24 }}>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="screen-title text-5xl font-semibold leading-tight text-villa-pearl">{title}</h1>
          <p className="screen-subtitle mt-3 text-xl text-villa-mist">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <LanguageSwitcher />
          <StatusRibbon />
        </div>
      </div>
      {children}
    </motion.main>
  );
}

export function App() {
  const { direction, t } = useI18n();
  const [screen, setScreen] = useState<Screen>('home');
  const loadDevices = useControlStore((state) => state.loadDevices);
  const syncDevices = useControlStore((state) => state.syncDevices);
  const setOffline = useControlStore((state) => state.setOffline);
  const isLoading = useControlStore((state) => state.isLoading);
  const isDeveloperRoute = typeof window !== 'undefined' && window.location.pathname === '/developer/home-assistant';
  const backgroundImage = isDeveloperRoute ? outdoorLoungeImage : screenImages[screen];

  useEffect(() => {
    void loadDevices();
    startShabbatRunner();
    void requestScreenWakeLock();
    const pollingId = window.setInterval(() => {
      void syncDevices();
    }, 12_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestScreenWakeLock();
        void syncDevices();
      }
    };
    const updateOnline = () => setOffline(!navigator.onLine);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.clearInterval(pollingId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void releaseScreenWakeLock();
      stopShabbatRunner();
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, [loadDevices, setOffline, syncDevices]);

  const content = isDeveloperRoute
    ? <DeveloperHomeAssistantScreen />
    : {
      home: <HomeScreen goTo={setScreen} />,
      lighting: <LightingScreen />,
      scenes: <ScenesScreen />,
      shabbat: <ShabbatScreen />,
      guest: <GuestInfoScreen />
    }[screen];

  return (
    <div className="min-h-screen overflow-hidden bg-villa-ink text-villa-pearl" dir={direction}>
      <ErrorToast />
      <div className="app-background">
        <AnimatePresence mode="wait">
          <motion.img
            key={isDeveloperRoute ? 'developer-home-assistant' : screen}
            src={backgroundImage}
            alt=""
            aria-hidden="true"
            className="app-background-image"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        </AnimatePresence>
      </div>
      <div className="responsive-shell relative z-10 grid min-h-screen grid-cols-[112px_1fr]">
        <nav className="app-nav border-l border-white/10 bg-black/20 px-3 py-6 backdrop-blur-2xl">
          <div className="brand-mark mb-9 flex h-16 items-center justify-center rounded-3xl border border-villa-gold/35 bg-villa-gold/10 text-villa-gold">
            <Sun size={32} />
          </div>
          <div className="nav-items space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === screen;
              const label = t.nav[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScreen(item.id)}
                  className={`nav-button ${active ? 'nav-button-active' : ''}`}
                  aria-label={label}
                  title={label}
                >
                  <Icon size={28} />
                  <span className="nav-label">{label}</span>
                  {active ? <Check size={14} className="absolute left-2 top-2" /> : null}
                </button>
              );
            })}
          </div>
        </nav>
        <section className="app-content h-screen overflow-y-auto px-7 py-6 lg:px-10">
          <div className="rotate-hint mb-4 rounded-2xl border border-villa-gold/25 bg-black/45 px-4 py-3 text-sm font-semibold text-villa-pearl backdrop-blur-xl">
            {t.common.rotateHint}
          </div>
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-2xl text-villa-mist">{t.common.loading}</div>
          ) : (
            <AnimatePresence mode="wait">{content}</AnimatePresence>
          )}
        </section>
      </div>
    </div>
  );
}
