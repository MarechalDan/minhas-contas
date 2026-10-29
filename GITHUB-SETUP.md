# Como Configurar o Repositório GitHub

## Passo 1: Criar o Repositório no GitHub

1. Acesse https://github.com
2. Faça login
3. Clique no **+** no canto superior direito
4. Selecione **"New repository"**
5. Configure:
   - **Repository name**: `minhas-contas` (ou outro nome que preferir)
   - **Description**: "App de controle financeiro pessoal"
   - **Public/Private**: Escolha conforme preferir
   - **NÃO** marque "Initialize this repository with a README" (já temos arquivos)
   - **NÃO** marque "Add .gitignore" (já temos)
   - **NÃO** marque "Choose a license" (já temos)
6. Clique em **"Create repository"**

## Passo 2: Configurar Git Localmente

### Opção A: Via GitHub Desktop (Mais Fácil)

1. Abra o **GitHub Desktop**
2. Clique em **"File"** > **"Add Local Repository..."**
3. Navegue até: `C:\Users\timdd\OneDrive\Documentos\codigos teste devin\minhas-contas-main\minhas-contas-main`
4. Clique em **"Add Repository"**
5. O GitHub Desktop vai detectar que não é um repositório Git
6. Clique em **"Publish repository"** (se aparecer)
7. Ou:
   - Clique em **"Repository"** > **"Publish repository"**
   - Escolha o repositório que você criou no Passo 1
   - Clique em **"Publish repository"**

### Opção B: Via Terminal (se tiver Git instalado)

Se você instalou o Git (https://git-scm.com/download/win):

```bash
cd "C:\Users\timdd\OneDrive\Documentos\codigos teste devin\minhas-contas-main\minhas-contas-main"
git init
git add .
git commit -m "Commit inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/minhas-contas.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo seu username do GitHub.

## Passo 3: Fazer o Push das Alterações Atuais

Depois de configurar o repositório:

### Via GitHub Desktop:
1. Você verá todas as alterações listadas
2. No campo "Summary", digite:
   ```
   Melhorias: layout, notificações, suporte iOS e Android
   
   - Layout profissional menos "IArizado"
   - Correção em campos numéricos
   - Notificações de lembrete de contas
   - Suporte para . e , em valores monetários
   - Botão sair volta ao login
   - Configuração de salário na tela Ajustes
   - Widgets de resumo e meta na home
   - Acesso rápido para gastos comuns
   - Preparado para Google Play e App Store
   - Schema do Supabase atualizado
   - Projeto iOS adicionado
   ```
3. Clique em **"Commit to main"**
4. Clique em **"Push origin"**

### Via Terminal:
```bash
git add .
git commit -m "Melhorias: layout, notificações, suporte iOS e Android"
git push
```

## Solução Alternativa: Clonar do GitHub

Se você quiser fazer de outra forma:

1. Crie o repositório no GitHub (Passo 1)
2. No GitHub Desktop, clique em **"File"** > **"Clone Repository"**
3. Encontre o repositório que você criou
4. Clone para uma pasta vazia
5. Copie todos os arquivos do seu projeto para dentro da pasta clonada
6. Faça o commit e push

## Arquivos Importantes

### .gitignore
Já está configurado para não enviar:
- `node_modules/`
- `.env` (suas credenciais ficam seguras)
- `dist/` (build files)
- `ios/` (opcional - se quiser no Git, remova do .gitignore)
- `android/` (opcional - se quiser no Git, remova do .gitignore)

### Nota sobre Android e iOS
As pastas `android/` e `ios/` podem ser grandes.
- Se quiser no Git: remova do `.gitignore`
- Se não quiser no Git: deixe no `.gitignore` (só você precisa localmente para gerar APK/IPA)

## Problemas Comuns

### "Repository not found"
- Verifique se o nome do repositório está correto
- Confirme se você tem permissão no repositório

### "Authentication failed"
- Verifique se está logado no GitHub Desktop
- Confirme suas credenciais do GitHub

### "Nothing to commit"
- Já está tudo commitado
- Pode fazer push direto

## Pronto!

Depois disso, seu projeto estará no GitHub e você poderá:
- Acessar de qualquer lugar
- Colaborar com outros
- Usar GitHub Actions para CI/CD
- Fazer deploy automático

Se ainda tiver problemas, me avise qual erro aparece!
