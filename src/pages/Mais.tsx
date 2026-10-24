import { useRef, useState } from "react";
import { useStore, normalize } from "../lib/store";
import { exportBackup } from "../lib/backup";
import { netSalary } from "../lib/taxes";
import { money, monthKey } from "../lib/format";
import { Button, Card, Field, MoneyInput, SectionTitle, inputClass } from "../components/ui";

export default function Mais() {
  const { data, updateSettings, saveTransaction, replaceAll, resetAll } = useStore();
  const [name, setName] = useState(data.settings.name);
  const [gross, setGross] = useState(data.settings.grossSalary);
  const [deps, setDeps] = useState(data.settings.dependents);
  const [payday, setPayday] = useState(data.settings.payday);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const net = netSalary(gross, deps).net;
  const hasSalaryTx = data.transactions.some((t) => t.category === "salario" && t.recurrence === "monthly" && !t.endMonth);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }

  function saveProfile(createSalary: boolean) {
    updateSettings({ name: name.trim(), grossSalary: gross, dependents: deps, payday });
    if (createSalary && net > 0) {
      saveTransaction({
        type: "income",
        description: "Salário",
        amount: net,
        category: "salario",
        date: `${monthKey()}-${String(Math.min(28, Math.max(1, payday))).padStart(2, "0")}`,
        recurrence: "monthly",
      });
      flash("Salário mensal adicionado nas receitas!");
    } else flash("Dados salvos!");
  }

  async function onImport(file: File) {
    try {
      const parsed = normalize(JSON.parse(await file.text()));
      if (!confirm(`Importar backup com ${parsed.transactions.length} lançamentos e ${parsed.goals.length} metas? Os dados atuais serão substituídos.`)) return;
      replaceAll(parsed);
      flash("Backup restaurado!");
    } catch {
      alert("Não foi possível ler esse arquivo. Escolha um backup do Minhas Contas (.json).");
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Ajustes</h1>
      {message && <div className="mb-3 rounded-xl bg-emerald-500/15 p-3 text-center text-emerald-300">{message}</div>}

      <SectionTitle>Meu perfil e salário</SectionTitle>
      <Card className="space-y-3">
        <Field label="Seu nome"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Salário bruto (da carteira)"><MoneyInput value={gross} onChange={setGross} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dependentes"><input className={inputClass} type="number" min={0} value={deps} onChange={(e) => setDeps(Math.max(0, Number(e.target.value) || 0))} /></Field>
          <Field label="Dia do pagamento"><input className={inputClass} type="number" min={1} max={28} value={payday} onChange={(e) => setPayday(Math.min(28, Math.max(1, Number(e.target.value) || 1)))} /></Field>
        </div>
        {gross > 0 && <p className="text-sm text-slate-400">Salário líquido estimado: <span className="font-semibold text-emerald-400">{money(net)}</span></p>}
        <Button className="w-full" onClick={() => saveProfile(false)}>Salvar</Button>
        {!hasSalaryTx && gross > 0 && (
          <Button variant="secondary" className="w-full" onClick={() => saveProfile(true)}>Salvar e lançar salário todo mês</Button>
        )}
      </Card>

      <SectionTitle>Backup dos dados</SectionTitle>
      <Card className="space-y-3">
        <p className="text-sm text-slate-400">Seus dados ficam salvos só neste aparelho. Faça backup de vez em quando e guarde no Google Drive ou WhatsApp. Se trocar de celular, é só importar.</p>
        <Button variant="secondary" className="w-full" onClick={() => exportBackup(data).catch(() => alert("Não foi possível exportar o backup."))}>⬆️ Exportar backup</Button>
        <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>⬇️ Importar backup</Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
      </Card>

      <SectionTitle>Zona de perigo</SectionTitle>
      <Card>
        <Button variant="danger" className="w-full" onClick={() => { if (confirm("Apagar TODOS os dados do app? Isso não pode ser desfeito.")) { resetAll(); flash("Dados apagados."); } }}>
          Apagar todos os dados
        </Button>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-600">Minhas Contas · v{__APP_VERSION__}</p>
    </div>
  );
}
