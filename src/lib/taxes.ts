/**
 * Tabelas de INSS e IRRF usadas nas estimativas.
 * Atualize aqui quando o governo publicar novos valores.
 */
export const TAX_YEAR = 2026;

const INSS_BRACKETS = [
  { upTo: 1621.0, rate: 0.075 },
  { upTo: 2902.84, rate: 0.09 },
  { upTo: 4354.27, rate: 0.12 },
  { upTo: 8475.55, rate: 0.14 },
];

const IRRF_BRACKETS = [
  { upTo: 2428.8, rate: 0, deduction: 0 },
  { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
  { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
  { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
  { upTo: Infinity, rate: 0.275, deduction: 908.73 },
];

export const DEPENDENT_DEDUCTION = 189.59;
export const SIMPLIFIED_DISCOUNT = 607.2;

/** Redução do IR mensal (Lei 15.270/2025): isenção até R$ 5.000 e redução parcial até R$ 7.350 */
const REDUCTION_FULL_UNTIL = 5000;
const REDUCTION_PARTIAL_UNTIL = 7350;

const round2 = (v: number) => Math.round(v * 100) / 100;

/** INSS progressivo (cada faixa aplica sua alíquota sobre a parte do salário nela) */
export function inss(gross: number) {
  let total = 0;
  let prev = 0;
  for (const b of INSS_BRACKETS) {
    if (gross <= prev) break;
    total += (Math.min(gross, b.upTo) - prev) * b.rate;
    prev = b.upTo;
  }
  return round2(total);
}

/** IRRF mensal, escolhendo a dedução mais vantajosa (legal ou desconto simplificado) */
export function irrf(gross: number, inssValue: number, dependents = 0) {
  const legal = inssValue + dependents * DEPENDENT_DEDUCTION;
  const base = Math.max(0, gross - Math.max(legal, SIMPLIFIED_DISCOUNT));
  const bracket = IRRF_BRACKETS.find((b) => base <= b.upTo)!;
  let tax = Math.max(0, base * bracket.rate - bracket.deduction);

  if (gross <= REDUCTION_FULL_UNTIL) tax = 0;
  else if (gross <= REDUCTION_PARTIAL_UNTIL) tax = Math.max(0, tax - (978.62 - 0.133145 * gross));

  return round2(tax);
}

export function netSalary(gross: number, dependents = 0) {
  const i = inss(gross);
  const ir = irrf(gross, i, dependents);
  return { gross, inss: i, irrf: ir, net: round2(gross - i - ir) };
}

export interface VacationInput {
  salary: number;
  extrasAverage: number;
  days: number;
  soldDays: number;
  dependents: number;
}

export function vacation({ salary, extrasAverage, days, soldDays, dependents }: VacationInput) {
  const base = salary + extrasAverage;
  const daily = base / 30;
  const vacationPay = round2(daily * days);
  const third = round2(vacationPay / 3);
  const allowance = round2(daily * soldDays);
  const allowanceThird = round2(allowance / 3);
  const taxable = vacationPay + third;
  const inssValue = inss(taxable);
  const irrfValue = irrf(taxable, inssValue, dependents);
  const gross = round2(taxable + allowance + allowanceThird);
  return {
    vacationPay,
    third,
    allowance,
    allowanceThird,
    inss: inssValue,
    irrf: irrfValue,
    gross,
    net: round2(gross - inssValue - irrfValue),
  };
}

export interface ThirteenthInput {
  salary: number;
  extrasAverage: number;
  months: number;
  dependents: number;
}

export function thirteenth({ salary, extrasAverage, months, dependents }: ThirteenthInput) {
  const total = round2(((salary + extrasAverage) / 12) * Math.min(12, Math.max(0, months)));
  const first = round2(total / 2);
  const inssValue = inss(total);
  const irrfValue = irrf(total, inssValue, dependents);
  const second = round2(total - first - inssValue - irrfValue);
  return { total, first, inss: inssValue, irrf: irrfValue, second, net: round2(first + second) };
}
