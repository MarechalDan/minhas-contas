# Como Fazer Commit no Git

## Opção 1: Via GitHub Desktop (Recomendado)

1. Abra o GitHub Desktop
2. Abra o repositório: `C:\Users\timdd\OneDrive\Documentos\codigos teste devin\minhas-contas-main\minhas-contas-main`
3. Você verá todas as alterações listadas
4. No campo "Summary", digite:
   ```
   Melhorias: layout, notificações, suporte iOS e Android
   
   - Layout profissional menos "IArizado"
   - Correção em campos numéricos
   - Notificações de lembrete de contas
   - Suporte para . e , em valores monetários
   - Botão sair volta ao login
   - Configuração de salário no cadastro
   - Widgets de resumo e meta na home
   - Acesso rápido para gastos comuns
   - Preparado para Google Play e App Store
   - Schema do Supabase atualizado
   ```
5. Clique em "Commit to main"
6. Clique em "Push origin"

## Opção 2: Via Terminal (se tiver Git instalado)

Se você tiver Git instalado em outro lugar (ex: Git Bash):

```bash
cd "C:\Users\timdd\OneDrive\Documentos\codigos teste devin\minhas-contas-main\minhas-contas-main"
git add .
git commit -m "Melhorias: layout, notificações, suporte iOS e Android

- Layout profissional menos 'IArizado'
- Correção em campos numéricos
- Notificações de lembrete de contas
- Suporte para . e , em valores monetários
- Botão sair volta ao login
- Configuração de salário no cadastro
- Widgets de resumo e meta na home
- Acesso rápido para gastos comuns
- Preparado para Google Play e App Store
- Schema do Supabase atualizado"
git push
```

## Opção 3: Instalar Git e fazer via comando

1. Baixe Git: https://git-scm.com/download/win
2. Instale com as opções padrão
3. Depois use os comandos da Opção 2

## Arquivos Adicionados para Publicação

### Android (Google Play)
- **Pasta**: `android/`
- **Contém**:
  - Código nativo Android
  - Manifest com permissões
  - Configurações de build
  - Plugin Capacitor Android

### iOS (App Store)
- **Pasta**: `ios/`
- **Contém**:
  - Projeto Xcode
  - Configurações iOS
  - Plugin Capacitor iOS
  - **Nota**: Precisa de Mac com Xcode para compilar

### Documentação
- `PUBLISH-GUIDE.md` - Guia completo para publicação nas lojas
- `SUPABASE-GUIDE.md` - Guia para configurar Supabase
- `DEPLOY.md` - Guia de deploy geral

### Configurações
- `capacitor.config.ts` - Configurações Capacitor (Android e iOS)
- `.env` - Credenciais do Supabase (NÃO vai para o Git - está no .gitignore)
- `supabase/schema.sql` - Schema do banco de dados

## Próximos Passos Após Fazer Commit

1. **No Supabase**:
   - Acesse https://aufhfvxtwgoptjqjrupo.supabase.co
   - Vá em SQL Editor
   - Execute o conteúdo de `supabase/schema.sql`
   - Configure o admin com seu email

2. **Para Gerar APK Android**:
   - Instale Java JDK 17+
   - Siga o guia em `PUBLISH-GUIDE.md`
   - APK ficará em: `android/app/build/outputs/apk/release/`

3. **Para Gerar iOS**:
   - Precisa de Mac com Xcode
   - Siga o guia em `PUBLISH-GUIDE.md`

## Servidor Local

O servidor está rodando em: **http://localhost:5173**

Se não estiver abrindo no navegador:
1. Abra o navegador
2. Digite: http://localhost:5173
3. Se não funcionar, pode ser a porta - tente http://localhost:5174

Para parar o servidor, aperte Ctrl+C no terminal onde está rodando.
