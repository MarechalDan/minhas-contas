import { useState } from "react";
import type { Recurrence, Transaction, TxType } from "../types";
import { expenseCategories, guessCategory, incomeCategories } from "../lib/categories";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/format";
import { Button, Field, MoneyInput, inputClass } from "./ui";

interface Props {
  initial?: Transaction;
  defaultType?: TxType;
  defaultDate?: string;
  onDone: () => void;
  /** Mês exibido, usado para "encerrar a partir deste mês" */
  month?: string;
}

export default function TransactionForm({ initial, defaultType = "expense", defaultDate, onDone, month }: Props) {
  const { saveTransaction, deleteTransaction, endRecurrence } = useStore();
  const [type, setType] = useState<TxType>(initial?.type ?? defaultType);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [category, setCategory] = useState(initial?.category ?? (defaultType === "income" ? "salario" : "outros"));
  const [categoryTouched, setCategoryTouched] = useState(!!initial);
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? todayISO());
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? "none");
  const [installments, setInstallments] = useState(initial?.installments ?? 2);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [totalMode, setTotalMode] = useState(false);

  const categories = type === "income" ? incomeCategories : expenseCategories;
  const perInstallment = recurrence === "installments" && totalMode ? amount / Math.max(1, installments) : amount;
  const valid = description.trim() && perInstallment > 0 && date;

  function changeType(t: TxType) {
    setType(t);
    setCategory(guessCategory(description, t) ?? (t === "income" ? "salario" : "outros"));
    setCategoryTouched(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    saveTransaction({
      id: initial?.id,
      paidMonths: initial?.paidMonths,
      endMonth: recurrence === "monthly" ? initial?.endMonth : undefined,
      type,
      description: description.trim(),
      amount: Math.round(perInstallment * 100) / 100,
      category,
      date,
      recurrence,
      installments: recurrence === "installments" ? installments : undefined,
      notes: notes.trim() || undefined,
    });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
        {(["expense", "income"] as TxType[]).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => changeType(t)}
            className={`rounded-lg py-2 font-semibold ${type === t ? (t === "expense" ? "bg-red-500 text-white" : "bg-emerald-500 text-slate-950") : "text-slate-400"}`}
          >
            {t === "expense" ? "Gasto" : "Receita"}
          </button>
        ))}
      </div>

      <Field label="Descrição">
        <input className={inputClass} value={description} onChange={(e) => {
            setDescription(e.target.value);
            const guess = !categoryTouched && guessCategory(e.target.value, type);
            if (guess) setCategory(guess);
          }} placeholder={type === "expense" ? "Ex: Aluguel, Netflix, Mercado" : "Ex: Salário, Freela"} />
      </Field>

      <Field label="Repetição">
        <div className="grid grid-cols-3 gap-2">
          {([
            ["none", "Única"],
            ["monthly", "Todo mês"],
            ["installments", "Parcelada"],
          ] as [Recurrence, string][]).map(([r, label]) => (
            <button type="button" key={r} onClick={() => setRecurrence(r)} className={`rounded-xl border py-2 text-sm ${recurrence === r ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-slate-300"}`}>
              {label}
            </button>
          ))}
        </div>
      </Field>

      {recurrence === "installments" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nº de parcelas">
            <input className={inputClass} type="number" min={2} max={120} value={installments} onChange={(e) => setInstallments(Math.max(2, Number(e.target.value) || 2))} />
          </Field>
          <Field label="O valor é">
            <select className={inputClass} value={totalMode ? "total" : "parcela"} onChange={(e) => setTotalMode(e.target.value === "total")}>
              <option value="parcela">Da parcela</option>
              <option value="total">Total da compra</option>
            </select>
          </Field>
        </div>
      )}

      <Field label={recurrence === "installments" ? (totalMode ? "Valor total" : "Valor da parcela") : "Valor"} hint={recurrence === "installments" && totalMode && amount > 0 ? `${installments}x de ${(perInstallment).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : undefined}>
        <MoneyInput value={amount} onChange={setAmount} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria">
          <select className={inputClass} value={category} onChange={(e) => { setCategory(e.target.value); setCategoryTouched(true); }}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </Field>
        <Field label={recurrence === "none" ? (type === "expense" ? "Vencimento" : "Data") : "Primeiro mês"}>
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      <Field label="Observação (opcional)">
        <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <Button type="submit" className="w-full" disabled={!valid}>
        {initial ? "Salvar alterações" : "Adicionar"}
      </Button>

      {initial && (
        <div className="grid gap-2">
          {initial.recurrence === "monthly" && month && !initial.endMonth && (
            <Button type="button" variant="secondary" onClick={() => { endRecurrence(initial.id, month); onDone(); }}>
              Encerrar depois deste mês
            </Button>
          )}
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (confirm(`Excluir "${initial.description}"${initial.recurrence !== "none" ? " e todas as repetições" : ""}?`)) {
                deleteTransaction(initial.id);
                onDone();
              }
            }}
          >
            Excluir
          </Button>
        </div>
      )}
    </form>
  );
}
