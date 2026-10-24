export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const expenseCategories: Category[] = [
  { id: "moradia", label: "Moradia", emoji: "🏠", color: "#60a5fa" },
  { id: "contas", label: "Contas (luz, água, internet)", emoji: "💡", color: "#facc15" },
  { id: "mercado", label: "Mercado", emoji: "🛒", color: "#34d399" },
  { id: "transporte", label: "Transporte", emoji: "🚗", color: "#f97316" },
  { id: "saude", label: "Saúde", emoji: "💊", color: "#f87171" },
  { id: "educacao", label: "Educação", emoji: "📚", color: "#a78bfa" },
  { id: "lazer", label: "Lazer", emoji: "🎮", color: "#f472b6" },
  { id: "alimentacao", label: "Restaurante/Delivery", emoji: "🍔", color: "#fb923c" },
  { id: "assinaturas", label: "Assinaturas", emoji: "📺", color: "#22d3ee" },
  { id: "cartao", label: "Cartão de crédito", emoji: "💳", color: "#e879f9" },
  { id: "dividas", label: "Empréstimos/Dívidas", emoji: "🏦", color: "#ef4444" },
  { id: "compras", label: "Compras", emoji: "🛍️", color: "#c084fc" },
  { id: "pets", label: "Pets", emoji: "🐶", color: "#a3e635" },
  { id: "outros", label: "Outros", emoji: "📦", color: "#94a3b8" },
];

export const incomeCategories: Category[] = [
  { id: "salario", label: "Salário", emoji: "💼", color: "#34d399" },
  { id: "ferias", label: "Férias", emoji: "🏖️", color: "#38bdf8" },
  { id: "decimo", label: "13º salário", emoji: "🎁", color: "#fbbf24" },
  { id: "extra", label: "Renda extra / Freela", emoji: "💡", color: "#a78bfa" },
  { id: "investimentos", label: "Rendimentos", emoji: "📈", color: "#22d3ee" },
  { id: "beneficios", label: "Benefícios (VA/VR, PLR)", emoji: "🎟️", color: "#f472b6" },
  { id: "outros-r", label: "Outros", emoji: "💰", color: "#94a3b8" },
];

const all = [...expenseCategories, ...incomeCategories];

export function getCategory(id: string): Category {
  return all.find((c) => c.id === id) ?? { id, label: id, emoji: "❔", color: "#94a3b8" };
}

const KEYWORDS: [string, RegExp][] = [
  ["moradia", /aluguel|condom|iptu|financiamento.*(casa|ap)|presta.*casa/],
  ["contas", /luz|energia|[aá]gua|internet|g[aá]s|telefone|celular.*(plano|conta)|vivo|claro|tim\b|oi\b/],
  ["mercado", /mercado|feira|a[cç]ougue|padaria|hortifruti/],
  ["transporte", /uber|99|gasolina|combust|[oô]nibus|metr[oô]|estacionamento|ped[aá]gio|ipva|seguro.*carro|oficina/],
  ["saude", /farm[aá]cia|rem[eé]dio|m[eé]dico|consulta|plano de sa[uú]de|dentista|exame|academia/],
  ["educacao", /escola|faculdade|curso|livro|mensalidade/],
  ["assinaturas", /netflix|spotify|prime|disney|hbo|max\b|youtube|globoplay|icloud|google one|assinatura/],
  ["alimentacao", /ifood|restaurante|lanche|pizza|delivery|hamb[uú]rguer|bar\b/],
  ["cartao", /cart[aã]o|fatura|nubank|inter\b/],
  ["dividas", /empr[eé]stimo|d[ií]vida|consignado|acordo/],
  ["lazer", /cinema|viagem|show|jogo|passeio/],
  ["pets", /pet|ra[cç][aã]o|veterin/],
  ["salario", /sal[aá]rio|pagamento/],
  ["ferias", /f[eé]rias/],
  ["decimo", /13|d[eé]cimo/],
  ["extra", /freela|extra|bico|venda/],
  ["investimentos", /rendimento|juros|dividendo|cdb|poupan/],
];

export function guessCategory(description: string, type: "expense" | "income"): string | null {
  const d = description.toLowerCase();
  const pool = type === "expense" ? expenseCategories : incomeCategories;
  for (const [id, re] of KEYWORDS) {
    if (pool.some((c) => c.id === id) && re.test(d)) return id;
  }
  return null;
}
