import { useEffect, useState, type ReactNode } from "react";
import { addMonths, monthLabel, money, parseMoney } from "../lib/format";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/5 bg-slate-900 p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{children}</h2>
      {action}
    </div>
  );
}

export function MonthPicker({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-1">
      <button aria-label="Mês anterior" className="rounded-xl px-4 py-2 text-xl text-slate-300 active:bg-slate-800" onClick={() => onChange(addMonths(month, -1))}>‹</button>
      <span className="font-semibold">{monthLabel(month)}</span>
      <button aria-label="Próximo mês" className="rounded-xl px-4 py-2 text-xl text-slate-300 active:bg-slate-800" onClick={() => onChange(addMonths(month, 1))}>›</button>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";

export function MoneyInput({ value, onChange, placeholder = "0,00", autoFocus }: { value: number; onChange: (v: number) => void; placeholder?: string; autoFocus?: boolean }) {
  const [text, setText] = useState(value ? value.toFixed(2).replace(".", ",") : "");
  useEffect(() => {
    if (parseMoney(text) !== value) setText(value ? value.toFixed(2).replace(".", ",") : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
      <input
        className={`${inputClass} pl-10`}
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseMoney(e.target.value));
        }}
      />
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "secondary" }) {
  const styles = {
    primary: "bg-emerald-500 text-slate-950 active:bg-emerald-400",
    secondary: "bg-slate-800 text-slate-100 active:bg-slate-700",
    ghost: "text-slate-300 active:bg-slate-800",
    danger: "bg-red-500/15 text-red-400 active:bg-red-500/25",
  }[variant];
  return (
    <button className={`rounded-xl px-4 py-3 font-semibold transition disabled:opacity-40 ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="safe-bottom max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-slate-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-700" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button aria-label="Fechar" className="rounded-full px-3 py-1 text-2xl text-slate-400" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Row({ label, value, strong, negative }: { label: string; value: number; strong?: boolean; negative?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${strong ? "border-t border-white/10 pt-3 text-lg font-bold" : "text-sm"}`}>
      <span className={strong ? "" : "text-slate-400"}>{label}</span>
      <span className={negative ? "text-red-400" : ""}>{negative ? `− ${money(value)}` : money(value)}</span>
    </div>
  );
}

export function Progress({ value, color = "bg-emerald-500" }: { value: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}

export function Empty({ icon, text, action }: { icon: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
      <span className="text-4xl">{icon}</span>
      <p>{text}</p>
      {action}
    </div>
  );
}
