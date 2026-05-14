import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Armchair,
  BedDouble,
  BookOpen,
  CalendarClock,
  Check,
  ChevronDown,
  Flame,
  Home,
  Info,
  Lamp,
  Moon,
  Minus,
  Palmtree,
  Plus,
  Power,
  Sparkles,
  Sun,
  Waves,
  WifiOff
} from 'lucide-react';
import { languageLabels, type Language, type Translation } from './i18n/translations';
import { useI18n, useLanguageStore } from './i18n/language-store';
import { startShabbatRunner, stopShabbatRunner } from './services/shabbat-runner';
import { useControlStore } from './store/control-store';
import { useShabbatStore } from './store/shabbat-store';
import type { Device, DeviceArea, DeviceId } from './types/device';
import type { ShabbatDeviceSchedule } from './types/shabbat';

type Screen = 'home' | 'lighting' | 'scenes' | 'shabbat' | 'guest';

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

function ToggleSwitch({ isOn, onToggle, label }: { isOn: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isOn}
      onClick={onToggle}
      className={`relative h-14 w-28 rounded-full border transition ${
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
    <div className="flex items-center gap-3">
      {nullable ? (
        <button
          type="button"
          onClick={() => onChange(value ? null : '00:00')}
          className="touch-button rounded-xl border border-white/10 bg-white/10 px-4 text-sm text-villa-pearl"
        >
          {value ? t.common.clearTime : t.common.addTime}
        </button>
      ) : null}
      <div className={`flex items-center gap-2 ${nullable && !value ? 'opacity-40' : ''}`}>
        <button className="icon-button" type="button" onClick={() => setTime(hour + 1, minute)}>
          <Plus size={20} />
        </button>
        <button className="icon-button" type="button" onClick={() => setTime(hour, minute + 15)}>
          <Plus size={16} />
        </button>
        <div className="min-w-24 rounded-2xl border border-villa-gold/30 bg-black/25 px-5 py-3 text-center text-2xl font-semibold text-villa-pearl">
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
  const setDeviceState = useControlStore((state) => state.setDeviceState);
  const isOn = states?.[device.id]?.isOn ?? false;
  const Icon = areaIcons[device.area];

  return (
    <motion.div layout className={`glass-panel device-tile ${isOn ? 'device-on' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-villa-gold">
            <Icon size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-villa-pearl">{t.devices[device.id]}</h3>
            <p className="mt-1 text-base text-villa-mist">{t.areas[device.area]}</p>
          </div>
        </div>
        <ToggleSwitch
          isOn={isOn}
          label={`${isOn ? t.lighting.turnOff : t.lighting.turnOn} ${t.devices[device.id]}`}
          onToggle={() => void setDeviceState(device.id, !isOn)}
        />
      </div>
    </motion.div>
  );
}

function StatusRibbon() {
  const { t } = useI18n();
  const isOffline = useControlStore((state) => state.isOffline);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-villa-mist">
      {isOffline ? (
        <span className="flex items-center gap-2 rounded-full border border-red-300/20 bg-red-500/10 px-4 py-2 text-red-100">
          <WifiOff size={16} />
          {t.common.offline}
        </span>
      ) : (
        <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2">
          {t.common.connected}
        </span>
      )}
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
  const activeCount = devices.filter((device) => states?.[device.id]?.isOn).length;

  return (
    <ScreenFrame title={t.home.title} subtitle={t.home.subtitle}>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="hero-panel">
          <div className="max-w-3xl">
            <p className="mb-4 text-xl text-villa-gold">{t.home.eyebrow}</p>
            <h2 className="text-6xl font-semibold leading-tight text-villa-pearl">
              {t.home.headline}
            </h2>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
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
          </button>
          <div className="glass-panel">
            <p className="text-lg text-villa-mist">{t.home.activeDevices}</p>
            <p className="mt-4 text-6xl font-semibold text-villa-pearl">{activeCount}</p>
          </div>
        </section>
      </div>
    </ScreenFrame>
  );
}

function LightingScreen() {
  const { t } = useI18n();
  const devices = useControlStore((state) => state.devices);
  const grouped = useMemo(() => groupByArea(devices), [devices]);

  return (
    <ScreenFrame title={t.lighting.title} subtitle={t.lighting.subtitle}>
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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-black/18 p-4">
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
    [t.guest.poolTitle, t.guest.poolText],
    [t.guest.checkoutTitle, t.guest.checkoutText],
    [t.guest.supportTitle, t.guest.supportText]
  ];

  return (
    <ScreenFrame title={t.guest.title} subtitle={t.guest.subtitle}>
      <div className="grid gap-5 md:grid-cols-2">
        {items.map(([title, text]) => (
          <div key={title} className="glass-panel">
            <BookOpen size={32} className="mb-8 text-villa-gold" />
            <h3 className="text-3xl font-semibold text-villa-pearl">{title}</h3>
            <p className="mt-4 text-xl leading-9 text-villa-mist">{text}</p>
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}

function ScreenFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.main variants={screenVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.24 }}>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-semibold leading-tight text-villa-pearl">{title}</h1>
          <p className="mt-3 text-xl text-villa-mist">{subtitle}</p>
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
  const setOffline = useControlStore((state) => state.setOffline);
  const isLoading = useControlStore((state) => state.isLoading);

  useEffect(() => {
    void loadDevices();
    startShabbatRunner();
    const updateOnline = () => setOffline(!navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      stopShabbatRunner();
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, [loadDevices, setOffline]);

  const content = {
    home: <HomeScreen goTo={setScreen} />,
    lighting: <LightingScreen />,
    scenes: <ScenesScreen />,
    shabbat: <ShabbatScreen />,
    guest: <GuestInfoScreen />
  }[screen];

  return (
    <div className="min-h-screen overflow-hidden bg-villa-ink text-villa-pearl" dir={direction}>
      <div className="app-background" />
      <div className="relative z-10 grid min-h-screen grid-cols-[112px_1fr]">
        <nav className="border-l border-white/10 bg-black/20 px-3 py-6 backdrop-blur-2xl">
          <div className="mb-9 flex h-16 items-center justify-center rounded-3xl border border-villa-gold/35 bg-villa-gold/10 text-villa-gold">
            <Sun size={32} />
          </div>
          <div className="space-y-3">
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
                  {active ? <Check size={14} className="absolute left-2 top-2" /> : null}
                </button>
              );
            })}
          </div>
        </nav>
        <section className="h-screen overflow-y-auto px-7 py-6 lg:px-10">
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
