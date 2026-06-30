import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

// Single persistence seam for the app. Today it mirrors a piece of React state to
// localStorage so data survives a page reload; it is a drop-in replacement for
// useState (same [value, setValue] signature).
//
// When the Supabase backend is wired up, this is the ONE place to change: swap the
// localStorage read/write for queries/subscriptions (or replace these hooks with a
// data-fetching layer). The App.tsx mutation handlers don't need to change.

const PREFIX = 'byteflow:';

export function usePersistentState<T>(
  key: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = PREFIX + key;

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      // Corrupt JSON or storage unavailable — fall back to the seed value.
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore quota / serialization errors — persistence is best-effort.
    }
  }, [storageKey, state]);

  return [state, setState];
}

// Clears every key this module owns. Used by the "restore demo data" action so the
// app can fall back to its seed datasets on the next load.
export function clearPersistedState(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
