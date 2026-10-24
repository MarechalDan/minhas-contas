import { useState } from "react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { money } from "../lib/format";
import { DEPENDENT_DEDUCTION, TAX_YEAR, netSalary, thirteenth, vacation } from "../lib/taxes";
import { monthKey, todayISO } from "../lib/format";
import { Button, Card, Field, MoneyInput, Row, inputClass } from "../components/ui";

type Tab = "salario" | "ferias" | "decimo";

function Disclaimer() {
  return (
    <p className="mt-4 text-xs text-slate-500">
      Estimativa com as tabelas de INSS e IR de {TAX_YEAR} (dedução de {DEPENDENT_DEDUCTION.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} por dependente). Pensão, plano de saúde e outros descontos da empresa não entram. Confira sempre no holerite.
    </p>
  );
}

function Added({ show }: { show: boolean }) {
  return show ? <p className="mt-2 text-center text-sm text-emerald-400">✓ Adicionado nos lançamentos!</p> : null;
}

function SalarioTab() {
  const { data } = useStore();
  const [gross, setGross] = useState(data.settings.grossSalary);
  const [deps, setDeps] = useState(data.settings.dependents);
  const r = netSalary(gross, deps);
  return (
    <Card>
      <div className="space-y-3">
        <Field label="Salário bruto"><MoneyInput value={gross} onChange={setGross} /></Field>
        <Field label="Dependentes"><input className={inputClass} type="number" min={0} value={deps} onChange={(e) => setDeps(Math.max(0, Number(e.target.value) || 0))} /></Field>
      </div>
      <div className="mt-4">
        <Row label="Salário bruto" value={r.gross} />
        <Row label="INSS" value={r.inss} negative />
        <Row label="Imposto de renda" value={r.irrf} negative />
        <Row label="Salário líquido" value={r.net} strong />
      </div>
      <Disclaimer />
    </Card>
  );
}

function FeriasTab() {
  const { data, saveTransaction } = useStore();
  const [salary, setSalary] = useState(data.settings.grossSalary);
  const [extras, setExtras] = useState(0);
  const [days, setDays] = useState(30);
  const [sell, setSell] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [added, setAdded] = useState(false);
  const soldDays = sell ? Math.min(10, Math.floor(days / 3)) : 0;
  const restDays = days - soldDays;
  const r = vacation({ salary, extrasAverage: extras, days: restDays, soldDays, dependents: data.settings.dependents });

  return (
    <Card>
      <div className="space-y-3">
        <Field label="Salário bruto"><MoneyInput value={salary} onChange={setSalary} /></Field>
        <Field label="Média de horas extras/adicionais (opcional)"><MoneyInput value={extras} onChange={setExtras} /></Field>
        <Field label="Dias de direito">
          <select className={inputClass} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={30}>30 dias (até 5 faltas)</option>
            <option value={24}>24 dias (6 a 14 faltas)</option>
            <option value={18}>18 dias (15 a 23 faltas)</option>
            <option value={12}>12 dias (24 a 32 faltas)</option>
          </select>
        </Field>
        <label className="flex items-center gap-3 rounded-xl bg-slate-950 p-3">
          <input type="checkbox" className="h-5 w-5 accent-emerald-500" checked={sell} onChange={(e) => setSell(e.target.checked)} />
          <span>Vender 1/3 das férias (abono de {Math.floor(days / 3)} dias)</span>
        </label>
      </div>
      <div className="mt-4">
        <Row label={`Férias (${restDays} dias)`} value={r.vacationPay} />
        <Row label="1/3 constitucional" value={r.third} />
        {soldDays > 0 && <Row label={`Abono (${soldDays} dias vendidos)`} value={r.allowance} />}
        {soldDays > 0 && <Row label="1/3 sobre o abono" value={r.allowanceThird} />}
        <Row label="INSS" value={r.inss} negative />
        <Row label="Imposto de renda" value={r.irrf} negative />
        <Row label="Você recebe" value={r.net} strong />
      </div>
      <p className="mt-2 text-xs text-slate-500">O valor das férias é pago até 2 dias antes de você sair. O abono não tem desconto de INSS nem IR.</p>
      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        <Field label="Quando você vai receber?"><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Button
          className="w-full"
          disabled={r.net <= 0}
          onClick={() => {
            saveTransaction({ type: "income", description: "Férias", amount: r.net, category: "ferias", date, recurrence: "none" });
            setAdded(true);
          }}
        >
          Adicionar como receita
        </Button>
        <Added show={added} />
      </div>
      <Disclaimer />
    </Card>
  );
}

function DecimoTab() {
  const { data, saveTransaction } = useStore();
  const [salary, setSalary] = useState(data.settings.grossSalary);
  const [extras, setExtras] = useState(0);
  const [months, setMonths] = useState(12);
  const [added, setAdded] = useState(false);
  const r = thirteenth({ salary, extrasAverage: extras, months, dependents: data.settings.dependents });
  const year = Number(monthKey().slice(0, 4));

  return (
    <Card>
      <div className="space-y-3">
        <Field label="Salário bruto"><MoneyInput value={salary} onChange={setSalary} /></Field>
        <Field label="Média de horas extras/adicionais (opcional)"><MoneyInput value={extras} onChange={setExtras} /></Field>
        <Field label="Meses trabalhados no ano" hint="Conta o mês em que você trabalhou 15 dias ou mais.">
          <input className={inputClass} type="number" min={1} max={12} value={months} onChange={(e) => setMonths(Math.min(12, Math.max(1, Number(e.target.value) || 1)))} />
        </Field>
      </div>
      <div className="mt-4">
        <Row label="13º bruto" value={r.total} />
        <div className="mt-3 rounded-xl bg-slate-950 p-3">
          <p className="text-sm font-semibold">1ª parcela · até 30/11</p>
          <Row label="Metade do 13º, sem descontos" value={r.first} />
        </div>
        <div className="mt-2 rounded-xl bg-slate-950 p-3">
          <p className="text-sm font-semibold">2ª parcela · até 20/12</p>
          <Row label="Restante" value={r.total - r.first} />
          <Row label="INSS (sobre o total)" value={r.inss} negative />
          <Row label="Imposto de renda" value={r.irrf} negative />
          <Row label="2ª parcela líquida" value={r.second} />
        </div>
        <Row label="Total líquido" value={r.net} strong />
      </div>
      <div className="mt-4 border-t border-white/10 pt-4">
        <Button
          className="w-full"
          disabled={r.net <= 0}
          onClick={() => {
            saveTransaction({ type: "income", description: "13º salário · 1ª parcela", amount: r.first, category: "decimo", date: `${year}-11-30`, recurrence: "none" });
            saveTransaction({ type: "income", description: "13º salário · 2ª parcela", amount: r.second, category: "decimo", date: `${year}-12-20`, recurrence: "none" });
            setAdded(true);
          }}
        >
          Adicionar as 2 parcelas em {year}
        </Button>
        <Added show={added} />
      </div>
      <Disclaimer />
    </Card>
  );
}

function ReservaPJ() {
  const { data, saveGoal } = useStore();
  const [income, setIncome] = useState(data.settings.grossSalary);
  const [added, setAdded] = useState(false);
  const vacation = (income / 12) * (4 / 3);
  const thirteenthPart = income / 12;
  const monthly = vacation + thirteenthPart;
  const year = Number(monthKey().slice(0, 4));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Reserva PJ</h1>
      <Card>
        <p className="text-sm text-slate-400">
          Como PJ, o valor que você recebe não tem desconto de INSS ou IR na folha. Mas também não existe férias nem 13º pagos pela empresa. Para ter esse dinheiro no fim do ano, o ideal é guardar um pouco todo mês.
        </p>
        <div className="mt-4">
          <Field label="Quanto você recebe por mês"><MoneyInput value={income} onChange={setIncome} /></Field>
        </div>
        <div className="mt-4">
          <Row label="Para suas férias (+1/3)" value={vacation} />
          <Row label={'Para o seu "13º"'} value={thirteenthPart} />
          <Row label="Guarde por mês" value={monthly} strong />
        </div>
        <p className="mt-2 text-xs text-slate-500">Em 12 meses você junta {money(monthly * 12)}, o mesmo que um CLT receberia de férias + 13º (sem descontos).</p>
        <Button
          className="mt-4 w-full"
          disabled={income <= 0}
          onClick={() => {
            saveGoal({ name: "Férias e 13º (PJ)", emoji: "🏖️", target: Math.round(monthly * 12 * 100) / 100, saved: 0, deadline: `${year}-12-20` });
            setAdded(true);
          }}
        >
          Criar meta de reserva
        </Button>
        <Added show={added} />
        <p className="mt-4 text-xs text-slate-500">Lembre de separar também o imposto da sua empresa (DAS/Simples), se for o seu caso.</p>
      </Card>
    </div>
  );
}

export default function Calculos() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("ferias");
  if (profile?.work_type === "pj") return <ReservaPJ />;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Calculadoras</h1>
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-slate-900 p-1">
        {([
          ["salario", "💼 Salário"],
          ["ferias", "🏖️ Férias"],
          ["decimo", "🎁 13º"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl py-2 text-sm font-semibold ${tab === t ? "bg-emerald-500 text-slate-950" : "text-slate-300"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "salario" && <SalarioTab />}
      {tab === "ferias" && <FeriasTab />}
      {tab === "decimo" && <DecimoTab />}
    </div>
  );
}
