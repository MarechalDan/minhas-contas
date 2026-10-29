# Como Configurar o Supabase para o Projeto Local

## Passo 1: Acessar seu projeto Supabase

1. Vá para https://aufhfvxtwgoptjqjrupo.supabase.co
2. Faça login
3. Você verá o painel do seu projeto

## Passo 2: Executar o Schema SQL

1. No painel lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** (ou "+")
3. Abra o arquivo `supabase/schema.sql` do seu projeto
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **"Run"** (ou aperte Ctrl+Enter)

Isso vai criar todas as tabelas necessárias:
- `profiles` - dados dos usuários
- `user_data` - dados do app (transações, metas, etc)
- `support_tickets` - chamados de suporte
- `app_config` - configurações do app

## Passo 3: Configurar o Administrador

1. Ainda no SQL Editor, execute:
```sql
update public.app_config set admin_email = 'seu-email@exemplo.com';
```
2. Quando você criar uma conta no app com esse email, ela automaticamente será admin

## Passo 4: Verificar a Configuração

1. No painel, vá em **"Database"** > **"Tables"**
2. Você deve ver as tabelas criadas
3. Vá em **"Authentication"** > **"Providers"**
4. Verifique se "Email" está habilitado

## Passo 5: Configurar Email Templates (Opcional)

1. Vá em **"Authentication"** > **"Email Templates"**
2. Você pode customizar os emails de:
   - Confirm signup (confirmação de conta)
   - Reset password (recuperação de senha)
   - Email change (mudança de email)

## Passo 6: Testar no App

1. O app já está configurado com suas credenciais (no arquivo `.env`)
2. Rode o app: `npm run dev`
3. Crie uma conta
4. Verifique se funciona

## O que acontece quando você cria uma conta?

1. O Supabase envia um email de confirmação
2. O usuário clica no link no email
3. O trigger `handle_new_user` cria automaticamente:
   - Um registro em `profiles`
   - Um registro em `user_data` com dados vazios
4. O usuário pode começar a usar o app

## Troubleshooting

### Email não chega
- Verifique se o email não está no spam
- No Supabase, vá em "Logs" para ver erros
- Você pode desabilitar confirmação de email temporariamente em "Authentication" > "Providers" > "Email"

### Erro de permissão
- Verifique se as RLS policies foram criadas
- No SQL Editor, rode: `select * from pg_policies where schemaname = 'public'`

### Dados não salvam
- Verifique se o schema foi aplicado
- Confirme que `user_data` existe
- Teste no SQL Editor: `select * from user_data`

## Pronto!

Depois disso, seu app local já está conectado ao Supabase e vai funcionar normalmente.
