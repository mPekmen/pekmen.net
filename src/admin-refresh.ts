const NORMAL_DELAY = 45_000;
const MAX_DELAY = 300_000;

export function createAdminRefresh(options: {
  canCheck: () => boolean;
  check: (manual: boolean) => Promise<boolean>;
  schedule: (delay: number) => void;
}): (manual?: boolean) => Promise<void> {
  let inFlight = false;
  let delay = NORMAL_DELAY;

  return async (manual = false) => {
    if (inFlight) return;
    if (!manual && !options.canCheck()) {
      options.schedule(delay);
      return;
    }

    inFlight = true;
    try {
      delay = await options.check(manual) ? NORMAL_DELAY : Math.min(delay * 2, MAX_DELAY);
    } finally {
      inFlight = false;
      options.schedule(delay);
    }
  };
}
