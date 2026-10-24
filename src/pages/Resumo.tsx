import { useMemo } from "react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { syncLabel } from "./Mais";
import { byCategory, lastMonths, occurrencesIn, summarize } from "../lib/ledger";
import { getCategory } from "../lib/categories";
import { money, monthLabel, todayISO } from "../lib/format";
import { Button, Card, Empty, MonthPicker, Progress, SectionTitle } from "../components/ui";
import TransactionItem from "../components/TransactionItem";
import type { Occurrence } from "../types";

interface Props {
  month: string;
  setMonth: (m: string) => void;
  openTx: (o: Occurrence) => void;
  newTx: () => void;
  goSettings: () => void;
}

export default function Resumo({ month, setMonth, openTx, newTx, goSettings }: Props) {
  const { data, status, togglePaid } = useStore();
  const { profile } = useAuth();
  const firstName = profile?.name.split(" ")[0] ?? "";
  const occ = useMemo(() => occurrencesIn(data.transactions, month), [data.transactions, month]);
  const s = summarize(occ);
  const cats = byCategory(occ, "expense");
  const upcoming = occ.filter((o) => o.tx.type === "expense" && !o.paid).slice(0, 5);
  const today = todayISO();
  const overdueCount = upcoming.filter((o) => o.date < today).length;

  const history = useMemo(
    () =>
      lastMonths(month, 6).map((m) => {
        const sm = summarize(occurrencesIn(data.transactions, m));
        return { name: monthLabel(m, true), Receitas: sm.income, Gastos: sm.expense };
      }),
    [data.transactions, month],
  );

  const savedTotal = data.goals.reduce((a, g) => a + g.saved, 0);
  const spentRatio = s.income > 0 ? s.expense / s.income : 0;

  return (
    <div>
      <header className="mb-4">
        <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
          <span>Olá{firstName ? `, ${firstName}` : ""} 👋</span>
          <span className="text-xs text-slate-500">{syncLabel[status]}</span>
        </div>
        <h1 className="text-2xl font-bold">Resumo do mês</h1>
      </header>

      <MonthPicker month={month} onChange={setMonth} />

      {data.transactions.length === 0 && (
        <Card className="mt-4 border-emerald-500/30 bg-emerald-500/5">
          <h2 className="font-bold">Bem-vindo! 🎉</h2>
          <p className="mt-1 text-sm text-slate-300">Comece cadastrando seu salário e depois suas contas fixas (aluguel, luz, internet...). Dá pra marcar cada conta como paga.</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={goSettings} className="flex-1">Cadastrar salário</Button>
            <Button variant="secondary" onClick={newTx} className="flex-1">Adicionar conta</Button>
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <p className="text-sm text-slate-400">Saldo previsto</p>
        <p className={`text-3xl font-bold ${s.balance < 0 ? "text-red-400" : "text-emerald-400"}`} data-testid="saldo">{money(s.balance)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-950 p-3">
            <p className="text-xs text-slate-400">Receitas</p>
            <p className="font-semibold text-emerald-400">{money(s.income)}</p>
          </div>
          <div className="rounded-xl bg-slate-950 p-3">
            <p className="text-xs text-slate-400">Gastos</p>
            <p className="font-semibold text-red-400">{money(s.expense)}</p>
          </div>
        </div>
        {s.income > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Você vai gastar {Math.round(spentRatio * 100)}% do que ganha</span>
            </div>
            <Progress value={spentRatio} color={spentRatio > 1 ? "bg-red-500" : spentRatio > 0.8 ? "bg-yellow-500" : "bg-emerald-500"} />
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-400">Já pago: </span>{money(s.paidExpense)}</div>
          <div className="text-right"><span className="text-slate-400">A pagar: </span><span className="text-yellow-400">{money(s.pendingExpense)}</span></div>
        </div>
      </Card>

      {savedTotal > 0 && (
        <Card className="mt-3 flex items-center justify-between">
          <span className="text-slate-400">🎯 Guardado nas metas</span>
          <span className="font-semibold">{money(savedTotal)}</span>
        </Card>
      )}

      <SectionTitle>Contas a pagar {overdueCount > 0 && <span className="ml-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs normal-case text-red-400">{overdueCount} atrasada(s)</span>}</SectionTitle>
      {upcoming.length === 0 ? (
        <Empty icon="✅" text={occ.some((o) => o.tx.type === "expense") ? "Tudo pago neste mês!" : "Nenhuma conta neste mês."} />
      ) : (
        <ul className="space-y-2">
          {upcoming.map((o) => (
            <TransactionItem key={o.tx.id} o={o} onOpen={() => openTx(o)} onToggle={() => togglePaid(o.tx.id, o.month)} />
          ))}
        </ul>
      )}

      {cats.length > 0 && (
        <>
          <SectionTitle>Gastos por categoria</SectionTitle>
          <Card>
            <div className="h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={cats} dataKey="value" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                    {cats.map((c) => <Cell key={c.category} fill={getCategory(c.category).color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [money(v), getCategory(n).label]} contentStyle={{ background: "#0f172a", border: "none", borderRadius: 12 }} itemStyle={{ color: "#e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-2">
              {cats.map((c) => {
                const cat = getCategory(c.category);
                return (
                  <li key={c.category} className="text-sm">
                    <div className="mb-1 flex justify-between">
                      <span>{cat.emoji} {cat.label}</span>
                      <span className="text-slate-300">{money(c.value)} <span className="text-slate-500">({Math.round((c.value / s.expense) * 100)}%)</span></span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${(c.value / s.expense) * 100}%`, background: cat.color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}

      {data.transactions.length > 0 && (
        <>
          <SectionTitle>Últimos 6 meses</SectionTitle>
          <Card>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={history}>
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => money(v)} cursor={{ fill: "#ffffff08" }} contentStyle={{ background: "#0f172a", border: "none", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Receitas" fill="#34d399" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gastos" fill="#f87171" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
