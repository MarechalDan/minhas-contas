import { useState } from "react";
import { monthKey, todayISO } from "./lib/format";
import { occurrenceIn } from "./lib/ledger";
import { useStore } from "./lib/store";
import { Sheet } from "./components/ui";
import TransactionForm from "./components/TransactionForm";
import Resumo from "./pages/Resumo";
import Lancamentos from "./pages/Lancamentos";
import Calculos from "./pages/Calculos";
import Metas from "./pages/Metas";
import Mais from "./pages/Mais";
import type { Occurrence, TxType } from "./types";

type Page = "resumo" | "lancamentos" | "calculos" | "metas" | "mais";

const NAV: { id: Page; icon: string; label: string }[] = [
  { id: "resumo", icon: "📊", label: "Resumo" },
  { id: "lancamentos", icon: "🧾", label: "Contas" },
  { id: "calculos", icon: "🧮", label: "Férias/13º" },
  { id: "metas", icon: "🎯", label: "Metas" },
  { id: "mais", icon: "⚙️", label: "Ajustes" },
];

type Editor = { mode: "new"; type: TxType } | { mode: "edit"; id: string; month: string } | null;

export default function App() {
  const { data } = useStore();
  const [page, setPage] = useState<Page>("resumo");
  const [month, setMonth] = useState(monthKey());
  const [editor, setEditor] = useState<Editor>(null);

  const openTx = (o: Occurrence) => setEditor({ mode: "edit", id: o.tx.id, month: o.month });
  const newTx = (type: TxType = "expense") => setEditor({ mode: "new", type });
  const editingTx = editor?.mode === "edit" ? data.transactions.find((t) => t.id === editor.id) : undefined;
  const defaultDate = month === monthKey() ? todayISO() : `${month}-${todayISO().slice(8, 10) > "28" ? "28" : todayISO().slice(8, 10)}`;

  return (
    <div className="mx-auto min-h-screen max-w-md">
      <main className="safe-top px-4 pb-32 pt-4">
        {page === "resumo" && <Resumo month={month} setMonth={setMonth} openTx={openTx} newTx={() => newTx()} goSettings={() => setPage("mais")} />}
        {page === "lancamentos" && <Lancamentos month={month} setMonth={setMonth} openTx={openTx} newTx={newTx} />}
        {page === "calculos" && <Calculos />}
        {page === "metas" && <Metas />}
        {page === "mais" && <Mais />}
      </main>

      {(page === "resumo" || page === "lancamentos") && (
        <button
          aria-label="Adicionar lançamento"
          onClick={() => newTx()}
          className="fixed bottom-24 right-[max(1rem,calc(50%-14rem+1rem))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-3xl text-slate-950 shadow-lg shadow-emerald-500/30 active:scale-95"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          +
        </button>
      )}

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setPage(n.id)} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${page === n.id ? "text-emerald-400" : "text-slate-400"}`}>
              <span className={`text-xl ${page === n.id ? "" : "opacity-70 grayscale"}`}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>
      </nav>

      <Sheet open={editor !== null} onClose={() => setEditor(null)} title={editor?.mode === "edit" ? "Editar lançamento" : "Novo lançamento"}>
        {editor?.mode === "new" && <TransactionForm defaultType={editor.type} defaultDate={defaultDate} onDone={() => setEditor(null)} />}
        {editor?.mode === "edit" && editingTx && (
          <>
            {occurrenceIn(editingTx, editor.month)?.installment && (
              <p className="mb-3 rounded-xl bg-slate-950 p-3 text-sm text-slate-400">Alterações valem para todas as parcelas.</p>
            )}
            <TransactionForm initial={editingTx} month={editor.month} onDone={() => setEditor(null)} />
          </>
        )}
      </Sheet>
    </div>
  );
}
