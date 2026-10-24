export type TxType = "expense" | "income";
export type Recurrence = "none" | "monthly" | "installments";

export interface Transaction {
  id: string;
  type: TxType;
  description: string;
  amount: number;
  category: string;
  /** Data (YYYY-MM-DD) do primeiro vencimento/recebimento */
  date: string;
  recurrence: Recurrence;
  /** Número de parcelas quando recurrence = "installments" */
  installments?: number;
  /** Último mês (YYYY-MM) de uma recorrência mensal encerrada */
  endMonth?: string;
  /** Meses (YYYY-MM) já pagos/recebidos */
  paidMonths: string[];
  notes?: string;
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  target: number;
  saved: number;
  deadline?: string;
}

export interface Settings {
  name: string;
  grossSalary: number;
  dependents: number;
  payday: number;
}

export interface AppData {
  version: 1;
  transactions: Transaction[];
  goals: Goal[];
  settings: Settings;
}

/** Ocorrência de um lançamento em um mês específico */
export interface Occurrence {
  tx: Transaction;
  month: string;
  date: string;
  installment?: { current: number; total: number };
  paid: boolean;
}
