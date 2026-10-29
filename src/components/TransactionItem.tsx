import type { Occurrence } from "../types";
import { getCategory } from "../lib/categories";
import { formatDate, money, todayISO } from "../lib/format";

export default function TransactionItem({ o, onToggle, onOpen }: { o: Occurrence; onToggle: () => void; onOpen: () => void }) {
  const cat = getCategory(o.tx.category);
  const income = o.tx.type === "income";
  const overdue = !income && !o.paid && o.date < todayISO();

  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: `${cat.color}1a` }}>
          {cat.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-medium text-sm ${o.paid ? "text-slate-500 line-through decoration-slate-700" : ""}`}>{o.tx.description}</span>
          <span className="block truncate text-xs text-slate-500">
            {formatDate(o.date)}
            {o.installment && ` · ${o.installment.current}/${o.installment.total}`}
            {o.tx.recurrence === "monthly" && " · mensal"}
            {overdue && <span className="text-red-400"> · atrasado</span>}
          </span>
        </span>
        <span className={`shrink-0 font-semibold text-sm ${income ? "text-emerald-400" : "text-slate-100"}`}>
          {income ? "+" : "−"} {money(o.tx.amount)}
        </span>
      </button>
      <button
        onClick={onToggle}
        aria-label={o.paid ? "Marcar como pendente" : income ? "Marcar como recebido" : "Marcar como pago"}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm transition-colors ${o.paid ? "border-emerald-600 bg-emerald-600 text-white" : overdue ? "border-red-400 text-red-400 hover:bg-red-400/10" : "border-slate-600 text-slate-400 hover:border-slate-500"}`}
      >
        {o.paid ? "✓" : ""}
      </button>
    </li>
  );
}
