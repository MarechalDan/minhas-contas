import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppData, Goal, Settings, Transaction } from "../types";
import { uid } from "./format";

const STORAGE_KEY = "minhas-contas:v1";

const emptyData: AppData = {
  version: 1,
  transactions: [],
  goals: [],
  settings: { name: "", grossSalary: 0, dependents: 0, payday: 5 },
};

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData;
    return normalize(JSON.parse(raw));
  } catch {
    return emptyData;
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

function useStoreValue() {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const saveTransaction = useCallback((tx: Omit<Transaction, "id" | "paidMonths"> & Partial<Pick<Transaction, "id" | "paidMonths">>) => {
    setData((d) => {
      if (tx.id && d.transactions.some((t) => t.id === tx.id)) {
        return { ...d, transactions: d.transactions.map((t) => (t.id === tx.id ? { ...t, ...tx } as Transaction : t)) };
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
        return { ...d, goals: d.goals.map((g) => (g.id === goal.id ? { ...g, ...goal } as Goal : g)) };
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
    () => ({ data, saveTransaction, deleteTransaction, togglePaid, endRecurrence, saveGoal, deleteGoal, moveGoal, updateSettings, replaceAll, resetAll }),
    [data, saveTransaction, deleteTransaction, togglePaid, endRecurrence, saveGoal, deleteGoal, moveGoal, updateSettings, replaceAll, resetAll],
  );
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}
