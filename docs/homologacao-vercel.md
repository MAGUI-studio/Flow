# Homologação: Vercel e Neon

Domínio: `https://flow.magui.studio`. Apesar de a Vercel chamar o ambiente do domínio principal de **Production**, este deploy usa dados de teste, Clerk de desenvolvimento e Stripe em modo de teste. Não definir `NODE_ENV=development`: a Vercel deve compilar normalmente.

## Variáveis

O arquivo local **`.env.homolog`** contém as variáveis para importar na Vercel. Ele é ignorado pelo Git e inclui credenciais: não anexar a issues, commits ou logs. As configurações locais permanecem em `.env.local`, com o banco Docker original. O backup anterior à configuração Neon está em `.env.neon-backup`, também ignorado.

Na Vercel, importar o projeto GitHub, selecionar Next.js e importar `.env.homolog` em **Settings → Environment Variables**, no ambiente **Production** usado pelo domínio. Marcar como sensíveis as variáveis secretas e as conexões de banco. Não importar `VERCEL`, `NODE_ENV` ou credenciais da CLI Neon.

Variáveis públicas: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, URLs de login/cadastro/retorno do Clerk e `NEXT_PUBLIC_MAP_TILES_URL`.

Variáveis do servidor: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `CLERK_SECRET_KEY`, `UPLOADTHING_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_MULTI`, `STRIPE_PORTAL_CONFIGURATION`, `FLOW_BILLING_ENABLED`, `DEV_SUBSCRIPTIONS_ENABLED`, `CRON_SECRET` e `PHOTON_URL`.

`DATABASE_URL` usa o endpoint Neon com `-pooler`. `DIRECT_DATABASE_URL` usa a conexão direta para migrações. Ambas exigem validação TLS (`sslmode=verify-full`). Os pools Node.js têm limite de cinco conexões e integração com `attachDatabasePool` na Vercel. Prisma e as consultas SQL existentes são preservados.

## Banco

Projeto Neon: `odd-thunder-50832991`; organização `org-fragrant-rain-31482629`; branch `production`. Somente Postgres foi habilitado. Clerk continua sendo o provedor de autenticação e UploadThing continua responsável pelos arquivos.

As 12 migrações foram aplicadas. A cópia local → Neon preservou IDs, vínculos, assinaturas de teste, banners, favoritos, histórico e auditoria: **16 tabelas, 2.358 registros**. Cada tabela foi conferida por contagem e hash do conteúdo, dentro de transações. A origem não foi alterada. Não rodar seeds no deploy.

`scripts/copy-dev-to-neon.ts --confirm-copy` documenta a cópia e recusa destino com dados; não é uma sincronização contínua. O histórico `_prisma_migrations` do destino é o produzido pelo Prisma, não uma cópia do histórico local.

## Deploy e domínio

`vercel.json` executa `npm run vercel-build`: geração do Prisma, `prisma migrate deploy` e `next build`. O build usa as variáveis importadas na Vercel.

Adicionar `flow.magui.studio` em **Settings → Domains** e configurar o registro DNS exatamente como indicado pela Vercel. Isso depende do projeto Vercel e do DNS; esta preparação não publica o site nem altera esses registros.

O login continua na mesma instância Clerk de desenvolvimento para manter os IDs dos usuários já copiados. Depois de publicar, validar o login Google no domínio. Não trocar pelas chaves de outra instância Clerk sem planejar a migração das identidades. Chaves de desenvolvimento mantêm os avisos e limites de desenvolvimento do Clerk.

## Stripe

Webhook de teste criado em `https://flow.magui.studio/api/billing/webhook`. Seu segredo está em `.env.homolog`; ele é diferente do segredo do listener local. Eventos: criação/atualização/cancelamento de assinatura, fatura paga/falha, reembolso, disputa e alerta de fraude. Preços BRL 49,90 e BRL 89,90 foram conferidos na API como test mode.

O webhook só será acessível quando o domínio apontar para a Vercel. Se houver proteção de deploy, garantir que o Stripe consiga chamar esse endpoint. Após publicar, executar um checkout com cartão de teste e conferir a entrega do evento no Stripe e o acesso ao painel. O teste local de assinatura do webhook não substitui essa entrega pública.

## Agendamentos automáticos

Na Vercel, o timer contínuo é desabilitado. Um endpoint Node.js protegido por `Authorization: Bearer CRON_SECRET` processa a conclusão automática em lotes idempotentes. `vercel.json` agenda a execução diária às 06:00 UTC (03:00 de São Paulo), compatível com o plano Hobby.

O prazo de elegibilidade continua sendo 24 horas após o início do atendimento. As páginas do cliente e do dono e o envio de avaliação também atualizam registros vencidos durante o acesso. Sem acesso, no Hobby, a atualização pode aguardar a execução diária. Para processamento em segundo plano próximo do limite de 24 horas, usar cron mais frequente em um plano que permita isso ou um agendador externo autenticado; não depender de `setInterval` em funções serverless.

## Validação

Com `.env.homolog` local:

```powershell
npm run build:homolog
npm run start:homolog -- --port 3001
npm run verify:homolog
npx tsx scripts/verify-homolog-providers.ts
```

`build:homolog` chama **`npm run build`** com as variáveis de homologação, sem substituir `.env.local`. O teste consulta o pool Neon, lê páginas públicas e a API de disponibilidade, valida a autenticação do cron e testa assinaturas válidas/inválidas do webhook, sem criar pagamento. O cron pode concluir agendamentos de teste que já ultrapassaram 24 horas.

Evidências obtidas:

```text
neon deploy: No changes — branch production already matches the policy.
Utilized services: Postgres
All migrations have been successfully applied.
Cópia concluída: 16 tabelas, 2358 registros. Origem preservada.
Compiled successfully
Finished TypeScript
Generating static pages (42/42)
Neon pooled connection: {"establishments":12,"professionals":80,"services":68}
HTTP /: 200
HTTP /explorar: 200
HTTP /entrar: 200
HTTP /flow-espaco-jardins-db27d46b: 200
Availability API backed by Neon: 200
Cron authentication: 401 without secret / 200 with secret
Stripe webhook signature: 200 valid / 400 invalid (no payment created)
Stripe test prices: BRL 49.90 / BRL 89.90 verified
Homologation smoke checks passed.
Clerk test instance: API credentials accepted
UploadThing: token accepted
Homologation environment: 13 required variables populated; secrets not displayed
```

Referências: [Neon CLI](https://neon.com/docs/cli/init), [Prisma e Neon](https://neon.com/docs/guides/prisma), [limites de cron Vercel](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [ambientes Clerk](https://clerk.com/docs/guides/development/managing-environments).
