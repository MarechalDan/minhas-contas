# Minhas Contas

App para organizar as finanças pessoais: gastos, salário, férias, 13º e metas.
Funciona como **app Android (APK)** e como **site instalável (PWA)**, com o mesmo código.

- **Site:** https://marechaldan.github.io/minhas-contas/
- **APK:** https://github.com/MarechalDan/minhas-contas/releases/latest

## Funções

- Resumo do mês: saldo previsto, quanto já pagou, quanto falta pagar e gráficos
- Gastos e receitas únicos, mensais ou parcelados, com vencimento e marcação de pago
- Categoria sugerida automaticamente pela descrição ("Netflix" vira Assinaturas)
- Salário líquido (INSS e IR), calculadora de férias (1/3 e abono) e de 13º (1ª e 2ª parcela)
- Metas de economia com prazo e valor por mês
- Backup: exportar e importar os dados em arquivo `.json`
- Funciona sem internet: os dados ficam salvos no aparelho

## Como fica online

Todo `push` na branch `main` roda o workflow `.github/workflows/deploy.yml`, que:

1. publica o site no GitHub Pages (grátis);
2. gera o APK assinado e cria uma nova versão em **Releases**.

Para atualizar o app no celular, baixe o APK mais novo e instale por cima. Os dados continuam salvos.

## Rodar no computador

```bash
npm install
npm run dev          # abre em http://localhost:5173
npm run build        # gera o site em dist/
npx cap sync android # copia o site para o projeto Android
cd android && ./gradlew assembleDebug
```

Tecnologias: React, TypeScript, Vite, Tailwind CSS, Recharts, vite-plugin-pwa e Capacitor.

Os cálculos de INSS/IR estão em `src/lib/taxes.ts`. Atualize as tabelas quando o governo mudar os valores.

## Contas de usuário e banco de dados (Supabase)

- Login e cadastro por email e senha. No cadastro a pessoa escolhe **CLT** (com INSS, IR, férias e 13º) ou **PJ** (sem descontos; a aba vira "Reserva PJ").
- Os dados de cada pessoa ficam na tabela `user_data` do Supabase e também no aparelho (funciona sem internet e sincroniza quando a conexão volta).
- O email definido em `app_config.admin_email` vira admin ao se cadastrar e vê a aba **Admin**: usuários, CLT/PJ, último acesso, bloquear/desbloquear, chamados de suporte e WhatsApp do suporte.
- Regras de segurança (RLS) em `supabase/schema.sql`: cada usuário só acessa os próprios dados; o admin não vê valores financeiros.
- `.env.production` guarda só a URL e a chave **pública** do Supabase (protegidas pelas regras de segurança).
