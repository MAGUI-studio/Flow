# Flow

SaaS de agendamentos da MAGUI.studio. Next.js + React + TypeScript.

## Desenvolvimento

```sh
npm install
npm run dev
```

Abra http://localhost:3000. Leia [docs/README.md](docs/README.md) antes de alterar regras de negócio.

```sh
npm run typecheck
npm test
npm run test:db
npm run build
```

Configure variáveis a partir de `.env.example`; nunca versionar secrets. Clerk já está vinculado em desenvolvimento com Google exclusivo. PostgreSQL local via Docker e Prisma: veja [docs/desenvolvimento.md](docs/desenvolvimento.md). Assinaturas Stripe de teste: veja [docs/stripe.md](docs/stripe.md). Com a cobrança de teste configurada, `npm run dev` inicia o encaminhador de webhooks e o Next.js juntos. Não executar migrações em produção sem revisão.

Os estabelecimentos e horários presentes são demonstrativos. Estado e pendências: [docs/implementacao.md](docs/implementacao.md).

## Popular uma conta existente

O seed permanente em `scripts/seed-account.ts` preenche uma conta identificada pelo email no Clerk, no PostgreSQL local. Ele exige uma assinatura ativa, respeita os limites do plano (1 estabelecimento e 10 profissionais no Essencial; 3 e 20 por estabelecimento no PRO) e cria até 12 serviços por estabelecimento ativo. Os profissionais novos recebem horários semanais de segunda a sábado.

```sh
npm run db:seed:account -- --email conta@exemplo.com --dry-run
npm run db:seed:account -- --email conta@exemplo.com
```

Também aceita `FLOW_SEED_EMAIL` em `.env.local`. Executar novamente preserva os cadastros existentes e completa apenas o que faltar, sem duplicar registros. Não cria contas, assinaturas, pagamentos ou agendamentos e não altera outros usuários. As unidades recebem bios completas, serviços específicos e endereços de referência com dados estruturados e mapa. A interface usa a apresentação normal do produto. O script recusa produção e bancos fora do PostgreSQL local do Flow.

Cada unidade de demonstração recebe uma equipe exclusiva, com nomes definidos em `prisma/account-seed-teams.ts`, e serviços próprios da sua categoria. Para corrigir as equipes repetidas da primeira versão do seed, execute o mesmo comando com `--repair-teams`: ele renomeia apenas os registros legados nas unidades reconhecidas do seed, mantendo IDs, horários e vínculos. A correção também pode ser repetida sem duplicar dados.

`--refresh-content` atualiza as bios, os endereços e os nomes legados de serviços apenas nas três unidades reconhecidas do seed da conta selecionada. Preserva IDs, equipe, preços, horários, agendamentos e vínculos. Use essa opção explicitamente para reaplicar o conteúdo editorial; a execução normal não substitui alterações manuais.
