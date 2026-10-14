# Arquitetura

## Stack

Next.js App Router, React, TypeScript, PostgreSQL com Prisma e adapter `pg`, Clerk e Stripe. Instalar releases estáveis via npm e preservar versões resolvidas no lockfile. Docker PostgreSQL local no desenvolvimento; Neon ou outro PostgreSQL gerenciado em produção. Hospedagem final ainda não configurada; domínio previsto `flow.magui.studio`.

## Isolamento e autorização

Usar Clerk user ID como identidade externa. Cada estabelecimento pertence a um responsável. Toda consulta/mutação privada verifica usuário, propriedade e assinatura no servidor. Proteção de rota não substitui autorização de recurso. Slug é endereço público, nunca credencial. Profissionais não são contas.

## Modelo inicial

`accounts` → `subscriptions` → `establishments` → `professionals` e `services`; vínculo `professional_services`; janelas de disponibilidade e bloqueios; `sessions` reservam intervalo profissional; `bookings` ocupam vagas; eventos de auditoria e eventos Stripe.

`prisma/migrations/20261014143000_initial/migration.sql` é a migração inicial. Constraint GiST em sessões impede sobreposição de intervalos ativos; função de reserva bloqueia a sessão antes de contar participantes. PostgreSQL e extensão `btree_gist` são necessários. O schema Prisma não substitui as restrições SQL customizadas.

Disponibilidade recorrente exige resolver o fuso IANA antes de criar sessões. O banco inicial usa janelas com instantes absolutos, e não é ainda a implementação completa do editor de recorrências.

## Operação

Job de expiração, monitoramento de falhas, backups, migrações, rate limiting, auditoria e tratamento de dados pessoais são necessários antes de produção. Logs não devem conter códigos de presença, secrets, telefones ou dados sensíveis de atendimento. Não armazenar prontuários no Flow.

## Referências oficiais consultadas

- https://nextjs.org/docs/app
- https://clerk.com/docs/reference/nextjs/overview
- https://clerk.com/docs/reference/components/clerk-provider
- Prompt da CLI fornecido pelo usuário em 14/10/2026; usar `clerk auth login` antes de `clerk init --app app_3KgjBcfD1JlBEOCHQ8UHZWFt3MA`, verificar matcher `/__clerk/:path*`, executar `clerk doctor`.
