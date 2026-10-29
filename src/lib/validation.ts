import { z } from "zod";

// Validação de email
export const emailSchema = z.string()
  .min(1, "Email é obrigatório")
  .email("Email inválido")
  .max(255, "Email muito longo")
  .transform((val) => val.trim().toLowerCase());

// Validação de senha
export const passwordSchema = z.string()
  .min(6, "A senha deve ter pelo menos 6 caracteres")
  .max(128, "Senha muito longa");

// Validação de nome
export const nameSchema = z.string()
  .min(1, "Nome é obrigatório")
  .max(100, "Nome muito longo")
  .transform((val) => val.trim());

// Validação de valores monetários
export const moneySchema = z.number()
  .min(0, "Valor não pode ser negativo")
  .max(999999999.99, "Valor muito grande");

// Validação de número de dias (1-31)
export const daySchema = z.number()
  .int("Deve ser um número inteiro")
  .min(1, "Dia deve ser entre 1 e 31")
  .max(31, "Dia deve ser entre 1 e 31");

// Validação de número de parcelas
export const installmentsSchema = z.number()
  .int("Deve ser um número inteiro")
  .min(2, "Mínimo de 2 parcelas")
  .max(120, "Máximo de 120 parcelas");

// Validação de descrição
export const descriptionSchema = z.string()
  .min(1, "Descrição é obrigatória")
  .max(200, "Descrição muito longa")
  .transform((val) => val.trim());

// Validação de categoria
export const categorySchema = z.string()
  .min(1, "Categoria é obrigatória")
  .max(50, "Categoria inválida");

// Schema de login
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Schema de cadastro
export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  work_type: z.enum(["clt", "pj"]),
});

// Schema de transação
export const transactionSchema = z.object({
  description: descriptionSchema,
  amount: moneySchema,
  category: categorySchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use YYYY-MM-DD)"),
  type: z.enum(["expense", "income"]),
  recurrence: z.enum(["none", "monthly", "installments"]),
  installments: installmentsSchema.optional(),
  notes: z.string().max(500, "Observação muito longa").optional(),
});

// Schema de meta
export const goalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  target: moneySchema,
  saved: moneySchema,
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").optional(),
});

// Sanitização de texto HTML (previne XSS)
export function sanitizeHtml(text: string): string {
  if (!text) return "";
  // Remove tags HTML perigosas
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Sanitização de input de usuário
export function sanitizeInput(text: string): string {
  if (!text) return "";
  return text.trim().slice(0, 500); // Limita tamanho
}

// Validação e sanitização combinada
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message || "Dados inválidos";
      return { success: false, error: message };
    }
    return { success: false, error: "Erro de validação" };
  }
}
