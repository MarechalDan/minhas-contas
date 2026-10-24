import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Button, Card, Empty, Field, SectionTitle, inputClass } from "../components/ui";
import { formatDateTime, statusLabel } from "../components/Support";
import type { Profile, Ticket } from "../types";

type Tab = "geral" | "usuarios" | "chamados";
const DAY = 86_400_000;

function TicketCard({ t, onSaved }: { t: Ticket; onSaved: () => void }) {
  const [reply, setReply] = useState(t.reply ?? "");
  const [busy, setBusy] = useState(false);
  async function update(fields: Partial<Ticket>) {
    setBusy(true);
    await supabase.from("support_tickets").update(fields).eq("id", t.id);
    setBusy(false);
    onSaved();
  }
  return (
    <Card>
      <div className="flex justify-between gap-2 text-sm">
        <span className="font-semibold">{t.subject}</span>
        <span className={`shrink-0 text-xs ${t.status === "aberto" ? "text-yellow-400" : "text-slate-500"}`}>{statusLabel[t.status]}</span>
      </div>
      <p className="text-xs text-slate-500">{t.email} · {formatDateTime(t.created_at)}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{t.message}</p>
      {t.status !== "fechado" && (
        <>
          <textarea className={`${inputClass} mt-3 min-h-20 text-sm`} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escreva a resposta" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="secondary" className="py-2" disabled={busy} onClick={() => update({ status: "fechado" })}>Encerrar</Button>
            <Button className="py-2" disabled={busy || !reply.trim()} onClick={() => update({ reply: reply.trim(), status: "respondido", replied_at: new Date().toISOString() })}>Responder</Button>
          </div>
        </>
      )}
      {t.status === "fechado" && t.reply && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-emerald-500/10 p-2 text-sm text-emerald-200">↪ {t.reply}</p>}
    </Card>
  );
}

export default function Admin() {
  const { profile: me } = useAuth();
  const [tab, setTab] = useState<Tab>("geral");
  const [users, setUsers] = useState<Profile[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [u, t, c] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("app_config").select("support_whatsapp").maybeSingle(),
    ]);
    if (u.error || t.error) setError("Não foi possível carregar. Verifique a internet.");
    setUsers((u.data as Profile[]) ?? []);
    setTickets((t.data as Ticket[]) ?? []);
    setWhatsapp(c.data?.support_whatsapp ?? "");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: users.length,
      clt: users.filter((u) => u.work_type === "clt").length,
      pj: users.filter((u) => u.work_type === "pj").length,
      novos: users.filter((u) => now - new Date(u.created_at).getTime() < 7 * DAY).length,
      ativos: users.filter((u) => u.last_seen_at && now - new Date(u.last_seen_at).getTime() < 7 * DAY).length,
      bloqueados: users.filter((u) => u.blocked).length,
      abertos: tickets.filter((t) => t.status === "aberto").length,
    };
  }, [users, tickets]);

  async function toggleBlock(u: Profile) {
    if (!confirm(u.blocked ? `Desbloquear ${u.email}?` : `Bloquear ${u.email}? A pessoa não vai conseguir usar o app.`)) return;
    await supabase.from("profiles").update({ blocked: !u.blocked }).eq("id", u.id);
    load();
  }

  const filteredUsers = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
  const visibleTickets = tickets.filter((t) => showClosed || t.status !== "fechado");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel admin</h1>
        <button onClick={load} className="text-sm text-emerald-400">↻ Atualizar</button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-slate-900 p-1">
        {([
          ["geral", "Visão geral"],
          ["usuarios", `Usuários (${stats.total})`],
          ["chamados", `Suporte${stats.abertos ? ` (${stats.abertos})` : ""}`],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl py-2 text-xs font-semibold ${tab === t ? "bg-emerald-500 text-slate-950" : "text-slate-300"}`}>{label}</button>
        ))}
      </div>

      {tab === "geral" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["👥 Usuários", stats.total],
              ["🟢 Ativos (7 dias)", stats.ativos],
              ["✨ Novos (7 dias)", stats.novos],
              ["💬 Chamados abertos", stats.abertos],
              ["💼 CLT", stats.clt],
              ["🧾 PJ", stats.pj],
            ].map(([label, value]) => (
              <Card key={label as string}>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </Card>
            ))}
          </div>
          {stats.bloqueados > 0 && <p className="mt-3 text-sm text-slate-400">🚫 {stats.bloqueados} usuário(s) bloqueado(s)</p>}

          <SectionTitle>Configurações do suporte</SectionTitle>
          <Card className="space-y-3">
            <Field label="WhatsApp do suporte (com DDD)" hint="Deixe vazio para esconder o botão de WhatsApp.">
              <input className={inputClass} inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex: 31 99999-9999" />
            </Field>
            <Button
              className="w-full"
              onClick={async () => {
                const digits = whatsapp.replace(/\D/g, "");
                const value = digits ? (digits.startsWith("55") ? digits : `55${digits}`) : null;
                const { error } = await supabase.from("app_config").update({ support_whatsapp: value }).eq("id", 1);
                setSaved(error ? "Erro ao salvar." : "Salvo!");
                setTimeout(() => setSaved(""), 2500);
              }}
            >
              Salvar
            </Button>
            {saved && <p className="text-center text-sm text-emerald-400">{saved}</p>}
          </Card>
          <p className="mt-4 text-xs text-slate-500">Por privacidade, o painel não mostra os valores financeiros dos usuários.</p>
        </>
      )}

      {tab === "usuarios" && (
        <>
          <input className={`${inputClass} mb-3`} placeholder="🔎 Buscar por nome ou email" value={search} onChange={(e) => setSearch(e.target.value)} />
          {filteredUsers.length === 0 ? (
            <Empty icon="👥" text="Nenhum usuário encontrado." />
          ) : (
            <ul className="space-y-2">
              {filteredUsers.map((u) => (
                <li key={u.id} className={`rounded-2xl bg-slate-900 p-3 ${u.blocked ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{u.name || "(sem nome)"} {u.role === "admin" && <span className="text-xs text-emerald-400">admin</span>}</p>
                      <p className="truncate text-sm text-slate-400">{u.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${u.work_type === "pj" ? "bg-sky-500/20 text-sky-300" : "bg-emerald-500/20 text-emerald-300"}`}>{u.work_type.toUpperCase()}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Desde {formatDateTime(u.created_at)} · Último acesso {u.last_seen_at ? formatDateTime(u.last_seen_at) : "—"}
                  </p>
                  {u.id !== me?.id && (
                    <button onClick={() => toggleBlock(u)} className={`mt-2 text-sm ${u.blocked ? "text-emerald-400" : "text-red-400"}`}>
                      {u.blocked ? "Desbloquear" : "Bloquear"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "chamados" && (
        <>
          <label className="mb-3 flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" className="accent-emerald-500" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Mostrar encerrados
          </label>
          {visibleTickets.length === 0 ? (
            <Empty icon="📭" text="Nenhum chamado por aqui." />
          ) : (
            <div className="space-y-3">{visibleTickets.map((t) => <TicketCard key={`${t.id}-${t.status}`} t={t} onSaved={load} />)}</div>
          )}
        </>
      )}
    </div>
  );
}
