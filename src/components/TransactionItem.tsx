import type { Occurrence } from "../types";
import { getCategory } from "../lib/categories";
import { formatDate, money, todayISO } from "../lib/format";

export default function TransactionItem({ o, onToggle, onOpen }: { o: Occurrence; onToggle: () => void; onOpen: () => void }) {
  const cat = getCategory(o.tx.category);
  const income = o.tx.type === "income";
  const overdue = !income && !o.paid && o.date < todayISO();

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-slate-900 p-3">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: `${cat.color}22` }}>
          {cat.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-medium ${o.paid ? "text-slate-400 line-through decoration-slate-600" : ""}`}>{o.tx.description}</span>
          <span className="block truncate text-xs text-slate-500">
            {formatDate(o.date)}
            {o.installment && ` · ${o.installment.current}/${o.installment.total}`}
            {o.tx.recurrence === "monthly" && " · mensal"}
            {overdue && <span className="text-red-400"> · atrasado</span>}
          </span>
        </span>
        <span className={`shrink-0 font-semibold ${income ? "text-emerald-400" : "text-slate-100"}`}>
          {income ? "+" : "−"} {money(o.tx.amount)}
        </span>
      </button>
      <button
        onClick={onToggle}
        aria-label={o.paid ? "Marcar como pendente" : income ? "Marcar como recebido" : "Marcar como pago"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm ${o.paid ? "border-emerald-500 bg-emerald-500 text-slate-950" : overdue ? "border-red-400" : "border-slate-600"}`}
      >
        {o.paid ? "✓" : ""}
      </button>
    </li>
  );
}
