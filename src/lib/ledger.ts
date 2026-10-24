import type { Occurrence, Transaction } from "../types";
import { addMonths, monthDiff } from "./format";

function dateInMonth(tx: Transaction, month: string) {
  const day = Number(tx.date.slice(8, 10));
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${month}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

/** Retorna a ocorrência do lançamento no mês, ou null se ele não aparece nesse mês */
export function occurrenceIn(tx: Transaction, month: string): Occurrence | null {
  const start = tx.date.slice(0, 7);
  const diff = monthDiff(start, month);
  if (diff < 0) return null;

  if (tx.recurrence === "none" && diff !== 0) return null;
  if (tx.recurrence === "monthly" && tx.endMonth && monthDiff(tx.endMonth, month) > 0) return null;
  if (tx.recurrence === "installments" && diff >= (tx.installments ?? 1)) return null;

  return {
    tx,
    month,
    date: dateInMonth(tx, month),
    installment: tx.recurrence === "installments" ? { current: diff + 1, total: tx.installments ?? 1 } : undefined,
    paid: tx.paidMonths.includes(month),
  };
}

export function occurrencesIn(transactions: Transaction[], month: string) {
  return transactions
    .map((t) => occurrenceIn(t, month))
    .filter((o): o is Occurrence => o !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function summarize(occurrences: Occurrence[]) {
  let income = 0;
  let expense = 0;
  let paidExpense = 0;
  let receivedIncome = 0;
  for (const o of occurrences) {
    if (o.tx.type === "income") {
      income += o.tx.amount;
      if (o.paid) receivedIncome += o.tx.amount;
    } else {
      expense += o.tx.amount;
      if (o.paid) paidExpense += o.tx.amount;
    }
  }
  return { income, expense, balance: income - expense, paidExpense, pendingExpense: expense - paidExpense, receivedIncome };
}

export function byCategory(occurrences: Occurrence[], type: "income" | "expense") {
  const map = new Map<string, number>();
  for (const o of occurrences) {
    if (o.tx.type !== type) continue;
    map.set(o.tx.category, (map.get(o.tx.category) ?? 0) + o.tx.amount);
  }
  return [...map.entries()].map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
}

export function lastMonths(month: string, count: number) {
  return Array.from({ length: count }, (_, i) => addMonths(month, i - count + 1));
}
