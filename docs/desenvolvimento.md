# Ambiente de desenvolvimento

## PostgreSQL local

Decisão do usuário: Docker local em desenvolvimento; PostgreSQL gerenciado (Neon ou alternativa) em produção.

```sh
docker compose up -d --wait
npm run db:migrate
npm run db:generate
npm run db:seed
npm run dev -- --port 3001
```

O Compose usa PostgreSQL 18, volume persistente `flow-dev_flow_postgres` e porta `127.0.0.1:5433`. Credenciais do Compose são exclusivamente locais, públicas no repositório e não podem ser reutilizadas em produção. Não apagar o volume para resolver problemas de migração.

`DATABASE_URL=postgresql://flow:flow_local_only@localhost:5433/flow` deve ser configurada em `.env.local`. Clerk CLI gerencia as chaves no mesmo arquivo. Nunca imprimir nem versionar esse arquivo.

## Prisma e SQL

Prisma com adapter PostgreSQL para modelos tipados e consultas. Migrações Prisma preservam SQL customizado para exclusão GiST, índices parciais e função transacional de reserva. Nunca usar `prisma db push` neste projeto: pode remover ou ignorar garantias que não estão expressas no schema Prisma. Revisar diffs de migrações antes de aplicar.

`prisma/schema.prisma` descreve entidades e relacionamentos. `prisma/migrations/20261014143000_initial/migration.sql` é a fonte executável inicial, não um script de seed. O cliente gerado fica em `src/generated/prisma` e não deve ser editado ou versionado.

## Produção

Usar URL pooled para runtime e conexão direta em `DIRECT_DATABASE_URL` para migrações conforme configuração do provedor. Confirmar disponibilidade de `btree_gist` no provedor escolhido. Nenhum banco de produção é criado nesta etapa.

## Cobrança

Checkout fica desabilitado por padrão (`FLOW_BILLING_ENABLED=false`). Só habilitar após configurar preços mensais, assinatura do webhook, gestão de cancelamento/downgrade e testar os fluxos em Stripe test mode. Webhook: `/api/billing/webhook`. Cadastro de Google em produção exige configurar a instância Clerk de produção e suas credenciais OAuth.

A cobrança Stripe de teste já está configurada no ambiente local. `npm run dev` conecta o listener e inicia o Next.js no mesmo terminal; para iniciar somente o aplicativo, use `npm run dev:app`. Guia e comandos de verificação: [Stripe](stripe.md). A chave de teste não habilita cobranças reais em produção.
