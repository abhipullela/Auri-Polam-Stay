import { useState, useEffect } from "react";

const STORAGE_KEY = "polam_poll_interval_ms";
const DEFAULT_INTERVAL = 5000;

const VALID_INTERVALS = [5000, 15000, 30000, 60000];

function getStoredInterval(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INTERVAL;
    const parsed = parseInt(raw, 10);
    if (VALID_INTERVALS.includes(parsed)) return parsed;
  } catch {
    // localStorage unavailable (e.g. private mode)
  }
  return DEFAULT_INTERVAL;
}

export function usePollInterval() {
  const [interval, setIntervalState] = useState<number>(getStoredInterval);

  function setInterval(value: number) {
    if (!VALID_INTERVALS.includes(value)) return;
    setIntervalState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  }

  return { interval, setInterval, options: VALID_INTERVALS };
}
