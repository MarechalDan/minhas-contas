import { useState, type FormEvent } from "react";
import { supabase, SITE_URL } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Button, Card, Field, inputClass } from "../components/ui";
import { validateAndSanitize, loginSchema, signupSchema } from "../lib/validation";
import type { WorkType } from "../types";

type Mode = "login" | "signup" | "forgot";

export function translateError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Esse email já tem conta. Use \"Entrar\".";
  if (m.includes("password should be") || m.includes("at least 6")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("email not confirmed")) return "Confirme seu email pelo link que enviamos antes de entrar.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Espere alguns minutos e tente de novo.";
  if (m.includes("invalid") && m.includes("email")) return "Email inválido.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sem conexão com a internet.";
  return message;
}

function WorkTypePicker({ value, onChange }: { value: WorkType; onChange: (v: WorkType) => void }) {
  const options: { id: WorkType; title: string; text: string }[] = [
    { id: "clt", title: "💼 CLT", text: "Carteira assinada. Calcula INSS, IR, férias e 13º." },
    { id: "pj", title: "🧾 PJ", text: "Pessoa jurídica. Sem descontos na folha, sem férias/13º." },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`rounded-lg border p-3 text-left transition-colors ${value === o.id ? "border-emerald-600 bg-emerald-600/10" : "border-slate-700 bg-slate-950/50 hover:border-slate-600"}`}
        >
          <span className="block font-medium text-sm">{o.title}</span>
          <span className="mt-1 block text-xs text-slate-400">{o.text}</span>
        </button>
      ))}
    </div>
  );
}

export { WorkTypePicker };

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [workType, setWorkType] = useState<WorkType>("clt");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        const validation = validateAndSanitize(loginSchema, { email, password });
        if (!validation.success) {
          setError(validation.error);
          setBusy(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email: validation.data.email, password });
        if (error) setError(translateError(error.message));
      } else if (mode === "signup") {
        const validation = validateAndSanitize(signupSchema, { name, email, password, work_type: workType });
        if (!validation.success) {
          setError(validation.error);
          setBusy(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: validation.data.email,
          password,
          options: { data: { name: validation.data.name, work_type: validation.data.work_type }, emailRedirectTo: SITE_URL },
        });
        if (error) setError(translateError(error.message));
        else if (!data.session) {
          setInfo("Conta criada! Abra o link que enviamos para o seu email e depois entre.");
        }
      } else {
        const validation = validateAndSanitize(emailSchema, email);
        if (!validation.success) {
          setError(validation.error);
          setBusy(false);
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, { redirectTo: SITE_URL });
        if (error) setError(translateError(error.message));
        else setInfo("Se esse email tiver conta, enviamos um link para criar uma nova senha.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="safe-top mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <img src="./icon-192.png" alt="" className="mx-auto h-14 w-14 rounded-xl shadow-lg" />
        <h1 className="mt-4 text-xl font-bold">Minhas Contas</h1>
        <p className="text-sm text-slate-400">Controle suas finanças pessoais</p>
      </div>

      <Card>
        {mode !== "forgot" && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-950/50 p-1">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); setInfo(""); }} className={`rounded-md py-2 text-sm font-medium ${mode === m ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-300"}`}>
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
        )}
        {mode === "forgot" && <h2 className="mb-3 font-semibold text-lg">Esqueci minha senha</h2>}

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field label="Seu nome">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
          )}
          <Field label="Email">
            <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
          </Field>
          {mode !== "forgot" && (
            <Field label="Senha" hint={mode === "signup" ? "Mínimo de 6 caracteres." : undefined}>
              <div className="relative">
                <input
                  className={inputClass}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </Field>
          )}
          {mode === "signup" && (
            <div>
              <span className="mb-1.5 block text-sm text-slate-400">Como você trabalha?</span>
              <WorkTypePicker value={workType} onChange={setWorkType} />
            </div>
          )}

          {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          {info && <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">{info}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "login" && <button className="text-slate-400 underline" onClick={() => { setMode("forgot"); setError(""); setInfo(""); }}>Esqueci minha senha</button>}
          {mode === "forgot" && <button className="text-slate-400 underline" onClick={() => setMode("login")}>Voltar para o login</button>}
        </div>
      </Card>
    </div>
  );
}

export function NewPassword() {
  const { setRecovering } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="safe-top mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Card>
        <h2 className="mb-3 font-semibold text-lg">Criar nova senha</h2>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const { error } = await supabase.auth.updateUser({ password });
            setBusy(false);
            if (error) setError(translateError(error.message));
            else setRecovering(false);
          }}
        >
          <Field label="Nova senha">
            <div className="relative">
              <input
                className={inputClass}
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </Field>
          {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>Salvar senha</Button>
        </form>
      </Card>
    </div>
  );
}
