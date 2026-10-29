# Minhas Contas - Guia de Deploy

## 1. Configuração do Banco de Dados (Supabase)

### Passo 1: Criar projeto no Supabase
1. Acesse https://supabase.com
2. Crie um novo projeto
3. Anote a URL e a Anon Key do projeto

### Passo 2: Configurar Schema
1. No painel do Supabase, vá em "SQL Editor"
2. Copie o conteúdo do arquivo `supabase/schema.sql`
3. Cole e execute o SQL

### Passo 3: Configurar Admin
1. No SQL Editor, execute:
```sql
update public.app_config set admin_email = 'seu-email@exemplo.com';
```
2. Crie uma conta no app com esse email - ela automaticamente será admin

### Passo 4: Configurar Variáveis de Ambiente
1. Copie `.env.production` para o servidor
2. Ou use as variáveis no seu CI/CD:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Anon Key do seu projeto

## 2. Deploy Web

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### GitHub Pages
```bash
npm run build
# Faça upload da pasta dist para GitHub Pages
```

### Outros hosts
```bash
npm run build
# Upload da pasta dist para seu host
```

## 3. Build APK Android

### Pré-requisitos
- Java JDK 17+ instalado
- Android Studio (ou apenas SDK)
- Variável JAVA_HOME configurada

### Passos
```bash
# 1. Build do app
npm run build

# 2. Sincronizar com Capacitor
npx cap sync android

# 3. Abrir Android Studio (se instalado)
npx cap open android

# 4. Ou build direto via linha de comando
cd android
./gradlew assembleDebug  # Linux/Mac
gradlew.bat assembleDebug  # Windows
```

O APK ficará em: `android/app/build/outputs/apk/debug/app-debug.apk`

### Assinar APK para Release
1. No Android Studio: Build > Generate Signed Bundle/APK
2. Crie um keystore (.jks)
3. Use o mesmo keystore para atualizações futuras

## 4. Recursos Adicionados

### Notificações de Lembrete
- Sistema de notificações para contas a vencer
- Configurável em "Ajustes" (1-7 dias antes)
- Requer permissão do usuário
- Verifica a cada hora

### Campos de Edição
- Inputs numéricos agora usam type="number" nativo
- Comportamento padrão de edição do navegador
- Mais fácil de corrigir erros

### Layout Profissional
- Design mais sóbrio e profissional
- Bordas mais sutis
- Transições suaves
- Tipografia otimizada

## 5. Configurações do App

### URL Dinâmica
O app agora usa `window.location.origin` como `SITE_URL`, funciona em qualquer domínio.

### PWA
- Service Worker incluído
- Funciona offline
- Pode ser instalado como app no navegador

## 6. Troubleshooting

### Java não encontrado
```bash
# Windows
set JAVA_HOME=C:\Program Files\Java\jdk-17
# Adicionar ao PATH
set PATH=%JAVA_HOME%\bin;%PATH%
```

### Build falha
```bash
# Limpar cache
npm run build
rm -rf node_modules
npm install
```

### Erros no Supabase
- Verifique se o schema foi aplicado
- Confirme as RLS policies estão ativas
- Teste no SQL Editor do Supabase
