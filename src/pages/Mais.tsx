import { useRef, useState, useEffect } from "react";
import { useStore, normalize, type SyncStatus } from "../lib/store";
import { useAuth } from "../lib/auth";
import { exportBackup } from "../lib/backup";
import { netSalary } from "../lib/taxes";
import { money, monthKey } from "../lib/format";
import { Button, Card, Field, MoneyInput, NumberInput, SectionTitle, Sheet, inputClass } from "../components/ui";
import Support from "../components/Support";
import { WorkTypePicker } from "./Auth";
import type { WorkType } from "../types";

export const syncLabel: Record<SyncStatus, string> = {
  loading: "⏳ Carregando da nuvem...",
  synced: "☁️ Salvo na nuvem",
  saving: "⏳ Salvando...",
  offline: "📴 Sem internet: salvo no aparelho",
};

export default function Mais() {
  const { data, status, updateSettings, saveTransaction, replaceAll, resetAll } = useStore();
  const { profile, updateProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [workType, setWorkType] = useState<WorkType>(profile?.work_type ?? "clt");
  const [gross, setGross] = useState(data.settings.grossSalary);
  const [deps, setDeps] = useState(data.settings.dependents);
  const [payday, setPayday] = useState(data.settings.payday);
  const [reminderDays, setReminderDays] = useState(data.settings.reminderDays ?? 3);
  const [message, setMessage] = useState("");
  const [support, setSupport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Solicitar permissão de notificação
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Sincronizar estados com dados salvos
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setWorkType(profile.work_type);
    }
    setGross(data.settings.grossSalary);
    setDeps(data.settings.dependents);
    setPayday(data.settings.payday);
    setReminderDays(data.settings.reminderDays ?? 3);
  }, [profile, data.settings]);

  const isPJ = workType === "pj";
  const net = isPJ ? gross : netSalary(gross, deps).net;
  const hasSalaryTx = data.transactions.some((t) => t.category === "salario" && t.recurrence === "monthly" && !t.endMonth);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }

  async function saveProfile(createSalary: boolean) {
    try {
      // Atualizar configurações localmente
      updateSettings({ grossSalary: gross, dependents: deps, payday, reminderDays });

      // Atualizar perfil no Supabase se mudou
      if (name.trim() !== profile?.name || workType !== profile?.work_type) {
        const err = await updateProfile({ name: name.trim(), work_type: workType });
        if (err) {
          flash("Não foi possível salvar o perfil. Verifique a internet.");
          return;
        }
      }

      // Criar transação de salário se solicitado
      if (createSalary && net > 0) {
        saveTransaction({
          type: "income",
          description: isPJ ? "Pagamento PJ" : "Salário",
          amount: net,
          category: "salario",
          date: `${monthKey()}-${String(Math.min(28, Math.max(1, payday))).padStart(2, "0")}`,
          recurrence: "monthly",
        });
        flash("Salário mensal adicionado nas receitas!");
      } else {
        flash("Dados salvos com sucesso!");
      }
    } catch (e) {
      flash("Erro ao salvar. Tente novamente.");
      console.error(e);
    }
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
      <h1 className="mb-4 text-xl font-bold">Ajustes</h1>
      {message && <div className="mb-3 rounded-lg bg-emerald-600/15 p-3 text-center text-emerald-300">{message}</div>}

      <Card className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{profile?.name || "Minha conta"}</p>
          <p className="truncate text-sm text-slate-400">{profile?.email}</p>
          <p className="text-xs text-slate-500">{syncLabel[status]}</p>
        </div>
        <Button variant="secondary" className="shrink-0 py-2" onClick={async () => {
          if (confirm("Sair da conta?")) {
            await signOut();
            window.location.reload();
          }
        }}>Sair</Button>
      </Card>

      <SectionTitle>Meu perfil e salário</SectionTitle>
      <Card className="space-y-3">
        <Field label="Seu nome"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div>
          <span className="mb-1.5 block text-sm text-slate-400">Como você trabalha?</span>
          <WorkTypePicker value={workType} onChange={setWorkType} />
        </div>
        <Field label={isPJ ? "Quanto você recebe por mês (PJ)" : "Salário bruto (da carteira)"}><MoneyInput value={gross} onChange={setGross} /></Field>
        <div className="grid grid-cols-2 gap-3">
          {!isPJ && <Field label="Dependentes"><NumberInput value={deps} onChange={setDeps} min={0} /></Field>}
          <Field label="Dia do pagamento"><NumberInput value={payday} onChange={setPayday} min={1} max={28} /></Field>
        </div>
        <Field label="Lembrete de contas (dias antes)" hint="Será notificado antes do vencimento das contas">
          <NumberInput value={reminderDays} onChange={setReminderDays} min={1} max={7} />
        </Field>
        {gross > 0 && (
          <p className="text-sm text-slate-400">
            {isPJ ? "Valor que entra (PJ, sem descontos): " : "Salário líquido estimado: "}
            <span className="font-semibold text-emerald-400">{money(net)}</span>
          </p>
        )}
        <Button className="w-full" onClick={() => saveProfile(false)}>Salvar</Button>
        {!hasSalaryTx && gross > 0 && (
          <Button variant="secondary" className="w-full" onClick={() => saveProfile(true)}>Salvar e lançar salário todo mês</Button>
        )}
      </Card>

      <SectionTitle>Ajuda</SectionTitle>
      <Card>
        <Button variant="secondary" className="w-full" onClick={() => setSupport(true)}>💬 Falar com o suporte</Button>
      </Card>

      <SectionTitle>Backup dos dados</SectionTitle>
      <Card className="space-y-3">
        <p className="text-sm text-slate-400">Seus dados ficam salvos na nuvem, na sua conta, e aparecem em qualquer aparelho em que você entrar. Se quiser, também pode guardar uma cópia em arquivo.</p>
        <Button variant="secondary" className="w-full" onClick={() => exportBackup(data).catch(() => alert("Não foi possível exportar o backup."))}>⬆️ Exportar backup</Button>
        <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>⬇️ Importar backup</Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
      </Card>

      <SectionTitle>Zona de perigo</SectionTitle>
      <Card>
        <Button variant="danger" className="w-full" onClick={() => { if (confirm("Apagar TODOS os seus lançamentos e metas? Isso não pode ser desfeito.")) { resetAll(); flash("Dados apagados."); } }}>
          Apagar todos os dados
        </Button>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-600">Minhas Contas · v{__APP_VERSION__}</p>

      <Sheet open={support} onClose={() => setSupport(false)} title="Falar com o suporte">
        {support && <Support />}
      </Sheet>
    </div>
  );
}
