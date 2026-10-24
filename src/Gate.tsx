import { useEffect, useState } from "react";
import { useAuth } from "./lib/auth";
import { supabaseConfigured } from "./lib/supabase";
import { StoreProvider } from "./lib/store";
import { Button, Card } from "./components/ui";
import Auth, { NewPassword } from "./pages/Auth";
import App from "./App";

function Screen({ icon, title, text, children }: { icon: string; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="safe-top mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Card className="text-center">
        <p className="text-4xl">{icon}</p>
        <h1 className="mt-2 text-lg font-bold">{title}</h1>
        {text && <p className="mt-1 text-sm text-slate-400">{text}</p>}
        {children && <div className="mt-4 space-y-2">{children}</div>}
      </Card>
    </div>
  );
}

export default function Gate() {
  const { session, profile, loading, recovering, refreshProfile, signOut } = useAuth();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!session || profile) return;
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [session, profile]);

  if (!supabaseConfigured) return <Screen icon="⚙️" title="Banco de dados não configurado" text="Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY." />;
  if (loading) return <Screen icon="⏳" title="Carregando..." />;
  if (recovering) return <NewPassword />;
  if (!session) return <Auth />;
  if (!profile)
    return (
      <Screen icon="⏳" title="Carregando sua conta..." text={slow ? "Está demorando. Verifique sua internet." : undefined}>
        {slow && (
          <>
            <Button className="w-full" onClick={() => refreshProfile()}>Tentar de novo</Button>
            <Button variant="secondary" className="w-full" onClick={signOut}>Sair</Button>
          </>
        )}
      </Screen>
    );
  if (profile.blocked)
    return (
      <Screen icon="🚫" title="Conta bloqueada" text="Sua conta foi bloqueada pelo administrador. Se acha que é um engano, entre em contato com o suporte.">
        <Button variant="secondary" className="w-full" onClick={signOut}>Sair</Button>
      </Screen>
    );
  return (
    <StoreProvider key={session.user.id} userId={session.user.id}>
      <App />
    </StoreProvider>
  );
}
