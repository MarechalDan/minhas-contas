import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Button, Field, inputClass } from "./ui";
import type { Ticket } from "../types";

export const statusLabel: Record<Ticket["status"], string> = { aberto: "Aguardando resposta", respondido: "Respondido", fechado: "Encerrado" };

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function Support() {
  const { session, profile } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    const [{ data: t }, { data: cfg }] = await Promise.all([
      supabase.from("support_tickets").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("app_config").select("support_whatsapp").maybeSingle(),
    ]);
    setTickets((t as Ticket[]) ?? []);
    setWhatsapp(cfg?.support_whatsapp || null);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function send() {
    if (!session || !subject.trim() || !message.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: session.user.id,
      email: session.user.email ?? "",
      subject: subject.trim(),
      message: message.trim(),
    });
    setBusy(false);
    if (error) return setFeedback("Não foi possível enviar. Verifique sua internet.");
    setSubject("");
    setMessage("");
    setFeedback("Mensagem enviada! A resposta aparece aqui embaixo.");
    load();
  }

  const waLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Preciso de ajuda com o app Minhas Contas. Meu email: ${profile?.email ?? ""}`)}`
    : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">Encontrou um problema ou tem uma sugestão? Mande uma mensagem.</p>
      {waLink && (
        <a href={waLink} target="_blank" rel="noreferrer" className="block rounded-xl bg-green-600 py-3 text-center font-semibold text-white">
          💬 Chamar no WhatsApp
        </a>
      )}
      <Field label="Assunto"><input className={inputClass} maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Erro ao salvar conta" /></Field>
      <Field label="Mensagem"><textarea className={`${inputClass} min-h-28`} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Conte o que aconteceu" /></Field>
      <Button className="w-full" disabled={busy || !subject.trim() || !message.trim()} onClick={send}>{busy ? "Enviando..." : "Enviar mensagem"}</Button>
      {feedback && <p className="text-center text-sm text-emerald-400">{feedback}</p>}

      {tickets.length > 0 && (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold text-slate-300">Minhas mensagens</p>
          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl bg-slate-950 p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{t.subject}</span>
                <span className={`shrink-0 text-xs ${t.status === "respondido" ? "text-emerald-400" : "text-slate-500"}`}>{statusLabel[t.status]}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-slate-400">{t.message}</p>
              {t.reply && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-emerald-500/10 p-2 text-emerald-200">↪ {t.reply}</p>}
              <p className="mt-1 text-xs text-slate-600">{formatDateTime(t.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
