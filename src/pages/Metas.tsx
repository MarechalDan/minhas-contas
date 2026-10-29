import { useState } from "react";
import { useStore } from "../lib/store";
import { formatDate, money, monthDiff, monthKey } from "../lib/format";
import { Button, Card, Empty, Field, MoneyInput, Progress, Sheet, inputClass } from "../components/ui";
import { validateAndSanitize, goalSchema, sanitizeInput } from "../lib/validation";
import type { Goal } from "../types";

const EMOJIS = ["🎯", "🏖️", "🚗", "🏠", "💍", "🎓", "📱", "🛟", "✈️", "🎮"];

function GoalForm({ initial, onDone }: { initial?: Goal; onDone: () => void }) {
  const { saveGoal, deleteGoal } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🎯");
  const [target, setTarget] = useState(initial?.target ?? 0);
  const [saved, setSaved] = useState(initial?.saved ?? 0);
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const validation = validateAndSanitize(goalSchema, {
          name: sanitizeInput(name),
          target,
          saved,
          deadline: deadline || undefined,
        });
        if (!validation.success) {
          alert(validation.error);
          return;
        }
        saveGoal({ id: initial?.id, name: validation.data.name, emoji, target: validation.data.target, saved: validation.data.saved, deadline: validation.data.deadline });
        onDone();
      }}
    >
      <div className="flex flex-wrap gap-2">
        {EMOJIS.map((e) => (
          <button type="button" key={e} onClick={() => setEmoji(e)} className={`h-10 w-10 rounded-lg text-lg transition-colors ${emoji === e ? "bg-emerald-600/20 ring-2 ring-emerald-600" : "bg-slate-950/50 hover:bg-slate-800"}`}>{e}</button>
        ))}
      </div>
      <Field label="Nome da meta"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Reserva de emergência, Viagem" /></Field>
      <Field label="Quanto quer juntar"><MoneyInput value={target} onChange={setTarget} /></Field>
      <Field label="Já tenho guardado"><MoneyInput value={saved} onChange={setSaved} /></Field>
      <Field label="Prazo (opcional)"><input type="date" className={inputClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
      <Button type="submit" className="w-full" disabled={!name.trim() || target <= 0}>{initial ? "Salvar" : "Criar meta"}</Button>
      {initial && (
        <Button type="button" variant="danger" className="w-full" onClick={() => { if (confirm(`Excluir a meta "${initial.name}"?`)) { deleteGoal(initial.id); onDone(); } }}>
          Excluir meta
        </Button>
      )}
    </form>
  );
}

function MoveForm({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const { moveGoal } = useStore();
  const [amount, setAmount] = useState(0);
  return (
    <div className="space-y-4">
      <p className="text-slate-400">Guardado: <span className="font-semibold text-slate-100">{money(goal.saved)}</span></p>
      <MoneyInput value={amount} onChange={setAmount} autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled={amount <= 0} onClick={() => { moveGoal(goal.id, -amount); onDone(); }}>Retirar</Button>
        <Button disabled={amount <= 0} onClick={() => { moveGoal(goal.id, amount); onDone(); }}>Guardar</Button>
      </div>
    </div>
  );
}

export default function Metas() {
  const { data } = useStore();
  const [editing, setEditing] = useState<Goal | "new" | null>(null);
  const [moving, setMoving] = useState<Goal | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Metas</h1>
        <Button onClick={() => setEditing("new")} className="py-2">+ Nova</Button>
      </div>

      {data.goals.length === 0 ? (
        <Empty icon="🎯" text="Crie metas para juntar dinheiro: reserva de emergência, viagem, carro..." action={<button className="text-emerald-400" onClick={() => setEditing("new")}>+ Criar primeira meta</button>} />
      ) : (
        <div className="space-y-3">
          {data.goals.map((g) => {
            const pct = g.target > 0 ? g.saved / g.target : 0;
            const remaining = Math.max(0, g.target - g.saved);
            const monthsLeft = g.deadline ? monthDiff(monthKey(), g.deadline.slice(0, 7)) : 0;
            const perMonth = monthsLeft > 0 ? remaining / monthsLeft : remaining;
            return (
              <Card key={g.id}>
                <button className="w-full text-left" onClick={() => setEditing(g)}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{g.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{g.name}</p>
                      <p className="text-sm text-slate-400">{money(g.saved)} de {money(g.target)}</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-400">{Math.round(pct * 100)}%</span>
                  </div>
                  <div className="mt-3"><Progress value={pct} /></div>
                  <p className="mt-2 text-xs text-slate-500">
                    {pct >= 1
                      ? "🎉 Meta alcançada!"
                      : g.deadline
                        ? `Prazo ${formatDate(g.deadline)} · guarde ${money(perMonth)}/mês`
                        : `Faltam ${money(remaining)}`}
                  </p>
                </button>
                <Button variant="secondary" className="mt-3 w-full py-2" onClick={() => setMoving(g)}>Guardar / retirar</Button>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Nova meta" : "Editar meta"}>
        {editing !== null && <GoalForm initial={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      </Sheet>
      <Sheet open={moving !== null} onClose={() => setMoving(null)} title={moving ? `${moving.emoji} ${moving.name}` : ""}>
        {moving && <MoveForm goal={moving} onDone={() => setMoving(null)} />}
      </Sheet>
    </div>
  );
}
