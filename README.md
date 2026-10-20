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
