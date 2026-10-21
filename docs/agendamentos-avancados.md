# Agenda, reagendamento, clientes, recorrência e lista de espera

## Navegação

- Painel → **Bloqueios**: período por profissional ou toda a equipe, incluindo profissionais cadastrados posteriormente. Dia inteiro inclui a data final. O fuso é o do estabelecimento.
- Painel → **Reagendamentos**: aprovar ou recusar mudanças solicitadas pelo cliente. A reserva original permanece confirmada até a aprovação.
- Painel → **Clientes**: busca por nome/e-mail, filtros de reservas futuras, faltas e cancelamentos, histórico e observações privadas. Dados de identidade vêm do Clerk; o relacionamento e as observações são isolados por estabelecimento.
- Painel → **Recorrências**: até 12 atendimentos semanais ou quinzenais, com data final opcional. A prévia permite excluir conflitos. Alterar os próximos atendimentos preserva os anteriores; a agenda permite alterar apenas uma ocorrência.
- Área pessoal → **Lista de espera**: inscrições, ofertas e cancelamento. O acesso para entrar fica na escolha de data/horário da página do estabelecimento.
- Área pessoal → **Meus agendamentos**: reagendar um atendimento confirmado dentro do prazo do estabelecimento.

## Garantias

Os bloqueios, reservas, ofertas e mudanças compartilham o lock do estabelecimento. As operações que reservam em nome de um cliente também usam seu lock de conta, impedindo reservas simultâneas conflitantes em estabelecimentos diferentes.

Um bloqueio com reservas conflitantes não é salvo até que o proprietário revise os atendimentos e confirme explicitamente seu cancelamento. O servidor confere os IDs novamente; novos conflitos exigem nova revisão. Há proteção adicional no PostgreSQL para impedir a confirmação de reservas em intervalos bloqueados.

Reagendamentos automáticos liberam a reserva anterior somente na mesma transação que confirma a nova. Na aprovação manual, o novo horário é mantido temporariamente e o antigo continua válido. O pedido expira em até 24 horas, antes do novo atendimento ou no limite de alteração do atendimento original, o que acontecer primeiro. Recusa ou expiração libera apenas o novo horário. Cancelar a reserva original encerra a solicitação associada.

Recorrências são criadas integralmente ou nenhuma alteração é persistida. A alteração de uma sequência também é transacional. A prévia de edição usa savepoint e desfaz alterações temporárias antes de retornar. O proprietário confirma a série diretamente, mesmo quando reservas públicas exigem aprovação manual. O cliente recebe uma notificação resumida, sem uma mensagem por ocorrência.

Ofertas da lista de espera usam reservas pendentes internas para consumir capacidade. Não aparecem como agendamento confirmado na área pessoal. O cliente tem até 30 minutos para aceitar. Em estabelecimentos com aprovação manual, aceitar encaminha a reserva para aprovação, sem confirmar por conta própria. A disponibilidade do cliente é verificada novamente ao aceitar. Ofertas vencidas não são aceitas.

O processamento percorre uma fila com cursor e lotes limitados; entradas mais antigas disputam primeiro as vagas correspondentes às preferências. O cursor de datas evita reconsultar indefinidamente a primeira semana indisponível. Cancelamentos reiniciam a busca das inscrições interessadas no serviço. Uma vaga já oferecida e vencida não é oferecida novamente à mesma inscrição. Após expirar, a inscrição continua buscando outras vagas até o fim do período escolhido.

O worker local roda a cada minuto. Na Vercel, o cron existente e os acessos autenticados ao drawer de notificações e à lista de espera fazem o processamento de recuperação; ele é limitado a uma execução por minuto por instância. Sem cron frequente ou acessos, a criação de novas ofertas pode atrasar. O prazo de aceitação é conferido no servidor, independentemente da frequência do worker. Não há envio de e-mails.

## Banco e validação

Migrações aditivas:

1. `20261021210000_scheduling_workflows`
2. `20261021211000_waitlist_processing_cursor`
3. `20261021212000_hold_notification_guard`

Aplicadas no banco local. O deploy usa o `prisma migrate deploy` já configurado no projeto. Antes de aplicar em outro ambiente, validar as migrações em uma cópia/branch desse banco. Não executar reset ou substituir dados existentes.

`npm run test:journey` inclui o teste de integração dos novos fluxos em schema isolado, removido ao final. Ele cobre alterações automáticas e manuais, preservação da reserva original, autorização, observações, prévia e substituição de recorrências, expiração, fila de espera, capacidade, aceitação concorrente e disputa entre bloqueio e reserva.

`npx playwright test tests/e2e/scheduling.spec.ts` exercita componentes reais dos formulários em desktop e celular, com respostas de API controladas. Não substitui uma compra Stripe, autenticação real ou criação de reservas no ambiente publicado.
