interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

let sentinel: WakeLockSentinelLike | null = null;

export async function requestScreenWakeLock() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock;
  if (!wakeLock || sentinel) {
    return Boolean(sentinel);
  }

  try {
    sentinel = await wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
    return true;
  } catch (error) {
    console.info('[WakeLock] unavailable', { error });
    return false;
  }
}

export async function releaseScreenWakeLock() {
  if (!sentinel) {
    return;
  }

  try {
    await sentinel.release();
  } finally {
    sentinel = null;
  }
}
