# Cenários do seed local

Pessoas e empresas inventadas para desenvolvimento, persistidas como cadastros no PostgreSQL. A aplicação não usa mocks. Esses registros não representam clientes comerciais e não devem ser publicados em produção.

| Estabelecimento    | Profissionais | Serviços | Cenários                                                                         |
| ------------------ | ------------: | -------: | -------------------------------------------------------------------------------- |
| Studio Aurora      |             3 |        4 | Corte, escova, manicure, avaliação gratuita; cadência 15 min e buffer            |
| Barbearia Essência |             2 |        3 | Corte, barba e combo; 30/60 min                                                  |
| Movimento Yoga     |             1 |        3 | Grupo gratuito de 10, meditação paga de 20, individual online                    |
| Clínica Viva       |             4 |        4 | Gratuito/pago; presencial/online; aprovação manual; especialidades               |
| Ateliê Linha Fina  |             1 |        3 | Março/abril de 2027; sessões de 2/4h; buffers; online gratuito; aprovação manual |
| Casa do Movimento  |             5 |        5 | Dupla, dança de 12, alongamento gratuito de 15, individuais                      |
| Conecta Idiomas    |             2 |        4 | Individuais online, conversação de 8 e nivelamento gratuito                      |
| Norte Consultoria  |             1 |        4 | Uma semana aberta; online/presencial; oficina de 6; aprovação manual             |

Inclui almoço, bloqueios de pausa, profissionais específicos por serviço, preços em centavos e sessões ocupadas (inclusive uma turma de duas vagas lotada).

`npm run db:seed` aceita somente PostgreSQL local `localhost:5433/flow`. Repetir não duplica cadastros, janelas ou sessões; não apaga reservas. As janelas de 7/45 dias são exemplos, não limites do produto.

Empresas distribuídas entre quatro contas técnicas, respeitando os limites do plano. A conta Google do usuário mantém seus próprios estabelecimentos: ative um plano e cadastre seu negócio pelo painel; as oito páginas públicas estão disponíveis para testar reservas.

Fontes: `prisma/seed-data.ts`, `prisma/seed.ts` e `src/lib/business-write.ts` (compartilhado pelos formulários).
