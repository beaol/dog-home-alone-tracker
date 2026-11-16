import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData, Attempt, LiveSession } from './types';

const KEY = 'dog-home-alone-tracker/v1';

const EMPTY: AppData = { version: 1, dogName: '', onboarded: false, attempts: [], live: null };

interface Store {
  ready: boolean;
  data: AppData;
  saveAttempt: (a: Attempt) => void;
  deleteAttempt: (id: string) => void;
  setDogName: (name: string) => void;
  completeOnboarding: (dogName: string, attempts: Attempt[]) => void;
  setLive: (live: LiveSession | null) => void;
  replaceAll: (data: AppData) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function parseBackup(json: string): AppData {
  const raw = JSON.parse(json);
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.attempts)) throw new Error('This is not a backup from this app.');
  const attempts: Attempt[] = raw.attempts
    .filter((a: any) => a && typeof a.startedAt === 'string' && typeof a.durationSec === 'number')
    .map((a: any) => ({
      id: String(a.id ?? Math.random()),
      startedAt: a.startedAt,
      durationSec: a.durationSec,
      events: Array.isArray(a.events) ? a.events : [],
      notes: typeof a.notes === 'string' ? a.notes : undefined,
    }));
  return { version: 1, dogName: String(raw.dogName ?? ''), onboarded: true, attempts, live: null };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => {
        if (s) setData({ ...EMPTY, ...JSON.parse(s) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const saveAttempt = useCallback((a: Attempt) => {
    setData((d) => {
      const exists = d.attempts.some((x) => x.id === a.id);
      return { ...d, attempts: exists ? d.attempts.map((x) => (x.id === a.id ? a : x)) : [...d.attempts, a] };
    });
  }, []);

  const store = useMemo<Store>(
    () => ({
      ready,
      data,
      saveAttempt,
      deleteAttempt: (id) => setData((d) => ({ ...d, attempts: d.attempts.filter((x) => x.id !== id) })),
      setDogName: (dogName) => setData((d) => ({ ...d, dogName })),
      completeOnboarding: (dogName, attempts) => setData((d) => ({ ...d, dogName, attempts, onboarded: true })),
      setLive: (live) => setData((d) => ({ ...d, live })),
      replaceAll: (next) => setData(next),
      reset: () => setData(EMPTY),
    }),
    [ready, data, saveAttempt],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside DataProvider');
  return s;
}
