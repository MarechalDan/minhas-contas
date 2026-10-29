import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { occurrencesIn, summarize } from "../lib/ledger";
import { money } from "../lib/format";
import { Empty, MonthPicker, inputClass } from "../components/ui";
import TransactionItem from "../components/TransactionItem";
import type { Occurrence, TxType } from "../types";

type Filter = "all" | "pending" | "paid";

interface Props {
  month: string;
  setMonth: (m: string) => void;
  openTx: (o: Occurrence) => void;
  newTx: (type: TxType) => void;
}

export default function Lancamentos({ month, setMonth, openTx, newTx }: Props) {
  const { data, togglePaid } = useStore();
  const [type, setType] = useState<TxType>("expense");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const occ = useMemo(() => occurrencesIn(data.transactions, month), [data.transactions, month]);
  const s = summarize(occ);
  const list = occ
    .filter((o) => o.tx.type === type)
    .filter((o) => (filter === "all" ? true : filter === "paid" ? o.paid : !o.paid))
    .filter((o) => o.tx.description.toLowerCase().includes(search.toLowerCase()));
  const total = list.reduce((a, o) => a + o.tx.amount, 0);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Lançamentos</h1>
      <MonthPicker month={month} onChange={setMonth} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => setType("expense")} className={`rounded-xl border p-3 text-left transition-colors ${type === "expense" ? "border-red-600 bg-red-600/10" : "border-slate-800 bg-slate-900/50"}`}>
          <span className="block text-xs text-slate-400">Gastos</span>
          <span className="font-semibold text-red-400">{money(s.expense)}</span>
        </button>
        <button onClick={() => setType("income")} className={`rounded-xl border p-3 text-left transition-colors ${type === "income" ? "border-emerald-600 bg-emerald-600/10" : "border-slate-800 bg-slate-900/50"}`}>
          <span className="block text-xs text-slate-400">Receitas</span>
          <span className="font-semibold text-emerald-400">{money(s.income)}</span>
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        {([
          ["all", "Todos"],
          ["pending", type === "expense" ? "A pagar" : "A receber"],
          ["paid", type === "expense" ? "Pagos" : "Recebidos"],
        ] as [Filter, string][]).map(([f, label]) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm transition-colors ${filter === f ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      <input className={`${inputClass} mt-3`} placeholder="🔎 Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="mt-3">
        {list.length === 0 ? (
          <Empty
            icon={type === "expense" ? "🧾" : "💰"}
            text={type === "expense" ? "Nenhum gasto encontrado." : "Nenhuma receita encontrada."}
            action={<button className="text-emerald-400" onClick={() => newTx(type)}>+ Adicionar {type === "expense" ? "gasto" : "receita"}</button>}
          />
        ) : (
          <>
            <ul className="space-y-2">
              {list.map((o) => (
                <TransactionItem key={o.tx.id} o={o} onOpen={() => openTx(o)} onToggle={() => togglePaid(o.tx.id, o.month)} />
              ))}
            </ul>
            <p className="mt-3 text-right text-sm text-slate-400">Total: <span className="font-semibold text-slate-200">{money(total)}</span></p>
          </>
        )}
      </div>
    </div>
  );
}
