import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData, Goal, Settings, Transaction } from "../types";
import { uid } from "./format";
import { supabase } from "./supabase";

const STORAGE_KEY = "minhas-contas:v1";

export type SyncStatus = "loading" | "synced" | "saving" | "offline";

const emptyData: AppData = {
  version: 1,
  transactions: [],
  goals: [],
  settings: { name: "", grossSalary: 0, dependents: 0, payday: 5 },
};

interface Meta {
  updatedAt: string | null;
  dirty: boolean;
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function normalize(input: unknown): AppData {
  const d = (input ?? {}) as Partial<AppData>;
  if (!Array.isArray(d.transactions) || !Array.isArray(d.goals)) throw new Error("Arquivo de backup inválido");
  return {
    version: 1,
    transactions: d.transactions.map((t) => ({ ...t, paidMonths: Array.isArray(t.paidMonths) ? t.paidMonths : [] })),
    goals: d.goals,
    settings: { ...emptyData.settings, ...(d.settings ?? {}) },
  };
}

function safeNormalize(input: unknown): AppData | null {
  try {
    return input ? normalize(input) : null;
  } catch {
    return null;
  }
}

function useStoreValue(userId: string) {
  const cacheKey = `${STORAGE_KEY}:${userId}`;
  const metaKey = `${cacheKey}:meta`;
  const [data, setData] = useState<AppData>(() => safeNormalize(readJSON(cacheKey)) ?? emptyData);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const ready = useRef(false);
  const skipNextPush = useRef(true);
  const latest = useRef(data);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const meta = useCallback((): Meta => readJSON<Meta>(metaKey) ?? { updatedAt: null, dirty: false }, [metaKey]);
  const setMeta = useCallback((m: Meta) => localStorage.setItem(metaKey, JSON.stringify(m)), [metaKey]);

  const push = useCallback(async () => {
    const updatedAt = new Date().toISOString();
    setStatus("saving");
    const { error } = await supabase.from("user_data").upsert({ user_id: userId, data: latest.current, updated_at: updatedAt });
    if (error) {
      setStatus("offline");
      return false;
    }
    setMeta({ updatedAt, dirty: false });
    setStatus("synced");
    return true;
  }, [userId, setMeta]);

  const pull = useCallback(async () => {
    const { data: row, error } = await supabase.from("user_data").select("data, updated_at").eq("user_id", userId).maybeSingle();
    if (error) return { ok: false as const };
    return { ok: true as const, row: row as { data: unknown; updated_at: string } | null };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = safeNormalize(readJSON(cacheKey));
      const m = meta();
      const res = await pull();
      if (cancelled) return;
      ready.current = true;
      if (!res.ok) {
        setStatus("offline");
        return;
      }
      const remote = res.row ? safeNormalize(res.row.data) : null;
      if (res.row && remote && !(m.dirty && local)) {
        skipNextPush.current = true;
        setData(remote);
        setMeta({ updatedAt: res.row.updated_at, dirty: false });
        setStatus("synced");
        return;
      }
      let initial = local;
      const legacy = safeNormalize(readJSON(STORAGE_KEY));
      if (!initial && legacy) initial = legacy;
      if (initial) {
        latest.current = initial;
        skipNextPush.current = true;
        setData(initial);
        if (await push()) localStorage.removeItem(STORAGE_KEY);
      } else {
        setStatus("synced");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, meta, pull, push, setMeta]);

  useEffect(() => {
    latest.current = data;
    localStorage.setItem(cacheKey, JSON.stringify(data));
    if (!ready.current) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    setMeta({ ...meta(), dirty: true });
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(push, 800);
  }, [data, cacheKey, meta, setMeta, push]);

  useEffect(() => {
    async function refresh() {
      if (!ready.current || document.visibilityState !== "visible") return;
      const m = meta();
      if (m.dirty) {
        push();
        return;
      }
      const res = await pull();
      if (!res.ok) return setStatus("offline");
      const remote = res.row ? safeNormalize(res.row.data) : null;
      if (res.row && remote && (!m.updatedAt || res.row.updated_at > m.updatedAt)) {
        skipNextPush.current = true;
        setData(remote);
        setMeta({ updatedAt: res.row.updated_at, dirty: false });
      }
      setStatus("synced");
    }
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [meta, pull, push, setMeta]);

  const saveTransaction = useCallback((tx: Omit<Transaction, "id" | "paidMonths"> & Partial<Pick<Transaction, "id" | "paidMonths">>) => {
    setData((d) => {
      if (tx.id && d.transactions.some((t) => t.id === tx.id)) {
        return { ...d, transactions: d.transactions.map((t) => (t.id === tx.id ? ({ ...t, ...tx } as Transaction) : t)) };
      }
      return { ...d, transactions: [...d.transactions, { ...tx, id: uid(), paidMonths: tx.paidMonths ?? [] }] };
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
  }, []);

  const togglePaid = useCallback((id: string, month: string) => {
    setData((d) => ({
      ...d,
      transactions: d.transactions.map((t) =>
        t.id !== id ? t : { ...t, paidMonths: t.paidMonths.includes(month) ? t.paidMonths.filter((m) => m !== month) : [...t.paidMonths, month] },
      ),
    }));
  }, []);

  const endRecurrence = useCallback((id: string, lastMonth: string) => {
    setData((d) => ({ ...d, transactions: d.transactions.map((t) => (t.id === id ? { ...t, endMonth: lastMonth } : t)) }));
  }, []);

  const saveGoal = useCallback((goal: Omit<Goal, "id"> & { id?: string }) => {
    setData((d) => {
      if (goal.id && d.goals.some((g) => g.id === goal.id)) {
        return { ...d, goals: d.goals.map((g) => (g.id === goal.id ? ({ ...g, ...goal } as Goal) : g)) };
      }
      return { ...d, goals: [...d.goals, { ...goal, id: uid() }] };
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }, []);

  const moveGoal = useCallback((id: string, amount: number) => {
    setData((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved + amount) } : g)) }));
  }, []);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...s } }));
  }, []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);
  const resetAll = useCallback(() => setData(emptyData), []);

  return useMemo(
    () => ({ data, status, saveTransaction, deleteTransaction, togglePaid, endRecurrence, saveGoal, deleteGoal, moveGoal, updateSettings, replaceAll, resetAll }),
    [data, status, saveTransaction, deleteTransaction, togglePaid, endRecurrence, saveGoal, deleteGoal, moveGoal, updateSettings, replaceAll, resetAll],
  );
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const value = useStoreValue(userId);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}
