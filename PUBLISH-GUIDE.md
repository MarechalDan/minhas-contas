# Guia de Publicação - Minhas Contas

## 📱 Google Play (Android)

### Pré-requisitos
- Conta de desenvolvedor Google Play ($25 taxa única)
- Java JDK 17+ instalado
- Android Studio (opcional, mas recomendado)

### Passo 1: Configurar APK Assinado

#### Opção A: Via Android Studio (Recomendado)
```bash
npm run build
npx cap sync android
npx cap open android
```

No Android Studio:
1. Build > Generate Signed Bundle/APK
2. Escolha "APK"
3. Crie um novo keystore:
   - Key store path: escolha onde salvar
   - Password: crie uma senha forte
   - Key alias: "minhascontas"
   - Key password: mesma senha do keystore
4. Build > Generate Signed Bundle/APK novamente
5. APK estará em: `android/app/build/outputs/apk/release/`

#### Opção B: Via Linha de Comando
```bash
# Gerar keystore (primeira vez só)
keytool -genkey -v -keystore minhascontas.jks -keyalg RSA -keysize 2048 -validity 10000 -alias minhascontas

# Configurar variáveis de ambiente
set KEYSTORE_PATH=C:\caminho\para\minhascontas.jks
set KEYSTORE_PASSWORD=sua-senha
set KEY_ALIAS=minhascontas

# Build
npm run build
npx cap sync android
cd android
gradlew.bat assembleRelease
```

### Passo 2: Preparar para Google Play

#### Informações Necessárias
- Nome do app: "Minhas Contas"
- Descrição curta: "Controle suas finanças pessoais de forma simples"
- Descrição completa:
  ```
  Gerencie suas finanças pessoais de forma simples e eficiente.

  Recursos:
  - Controle de gastos e receitas
  - Cálculo de salário líquido, férias e 13º
  - Metas de economia
  - Notificações de lembrete de contas
  - Backup automático na nuvem
  - Funciona offline

  Perfeito para CLT e PJ!
  ```

- Screenshots (mínimo 2, recomendado 8):
  - Tamanho: 1080x1920px ou 1080x2220px
  - De: Tela de resumo, transações, metas, calculadoras

- Ícone:
  - 512x512px PNG
  - Já está em `public/icon-192.png` (precisa aumentar)

### Passo 3: Publicar no Google Play

1. Acesse https://play.google.com/console
2. Criar novo app
3. Preencher informações do app
4. Fazer upload do APK assinado
5. Configurar lista de lojas
6. Definir classificação de conteúdo
7. Preço e distribuição (Gratuito)
8. Enviar para revisão

## 🍎 App Store (iOS)

### Pré-requisitos
- Conta de desenvolvedor Apple ($99/ano)
- Mac com Xcode
- CocoaPods instalado

### Passo 1: Configurar Projeto iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
```

### Passo 2: No Xcode
1. Abra o projeto iOS
2. Configure "Signing & Capabilities"
3. Adicione sua conta Apple Developer
4. Configure Bundle Identifier
5. Adicione permissões necessárias
6. Build > Archive
7. Distribute App

### Passo 3: Publicar no App Store
1. Acesse App Store Connect
2. Criar novo app
3. Preencher informações
4. Fazer upload do build
5. Enviar para revisão

## 🌐 Web (PWA)

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### GitHub Pages
```bash
npm run build
# Upload da pasta dist para gh-pages branch
```

### Netlify
```bash
npm run build
# Drag and drop da pasta dist no Netlify
```

## 🔧 Configurações Atuais

### Android
- Package Name: `com.marechaldan.minhascontas`
- Min SDK: 22 (Android 5.1+)
- Target SDK: 34 (Android 14)
- Orientação: Portrait apenas
- Permissões: Internet, Notificações, Vibrar

### iOS
- Bundle ID: `com.marechaldan.minhascontas`
- Orientação: Portrait

### Supabase
- URL: https://aufhfvxtwgoptjqjrupo.supabase.co
- Schema: Já configurado em `supabase/schema.sql`

## 📋 Checklist de Publicação

### Antes de Publicar
- [ ] Testar todas as funcionalidades
- [ ] Verificar ortografia nos textos
- [ ] Testar em diferentes tamanhos de tela
- [ ] Verificar performance
- [ ] Testar offline
- [ ] Verificar notificações
- [ ] Criar screenshots profissionais
- [ ] Preparar ícone em alta resolução
- [ ] Escrever descrição persuasiva
- [ ] Adicionar política de privacidade

### Google Play
- [ ] Conta de desenvolvedor ativa
- [ ] APK assinado
- [ ] Classificação de conteúdo definida
- [ ] Informações do preenchimento
- [ ] Screenshots carregadas
- [ ] Ícone carregado
- [ ] Banner promocional (opcional)

### App Store
- [ ] Conta de desenvolvedor ativa
- [ ] Build assinado
- [ ] Screenshots para diferentes tamanhos
- [ ] Descrição localizada
- [ ] Palavras-chave
- [ ] URL de suporte
- [] Política de privacidade

## 💡 Dicas

### Aumentar Chances de Aprovação
- Usar ícone original e profissional
- Screenshots mostrando recursos reais
- Descrição clara e honesta
- Política de privacidade completa
- Testar exaustivamente antes de enviar

### Primeira Versão
- Comece com versão 1.0.0
- Adicione recursos básicos primeiro
- Colete feedbacks dos usuários
- Atualize regularmente

### Manutenção
- Monitore reviews e feedback
- Corrija bugs rapidamente
- Adicione recursos solicitados
- Mantenha compatibilidade com atualizações do sistema

## 🆘 Problemas Comuns

### APK não assina
- Verifique se o keystore existe
- Confirme as senhas
- Use Android Studio para facilitar

### Rejeição do Google Play
- Verifique política de conteúdo
- Confirme que não usa permissões desnecessárias
- Revise screenshots (sem watermark)

### Rejeição da Apple
- Teste em dispositivos reais
- Verifique guidelines de design
- Confirme permissões

## 📞 Suporte

Para problemas técnicos:
- Capacitor Docs: https://capacitorjs.com/docs
- Google Play Console Help: https://support.google.com/googleplay
- Apple Developer Support: https://developer.apple.com/support
