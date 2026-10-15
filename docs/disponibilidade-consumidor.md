# Sobreposição de agendamentos

- A ocupação do profissional considera todos os seus serviços. Reservas confirmadas e pendentes com prazo vigente bloqueiam o intervalo ocupado; outros profissionais continuam disponíveis para outros clientes. Sessões coletivas mantêm a capacidade configurada.
- Quando o cliente está autenticado, a disponibilidade também exclui horários que coincidam com qualquer atendimento confirmado ou pendente vigente dele, inclusive em outro estabelecimento ou com outro profissional. Intervalos adjacentes são permitidos.
- A API de disponibilidade usa a identidade do Clerk, nunca um identificador informado pelo navegador, e responde com cache privado desativado. A página refaz a consulta quando a identidade muda.
- A criação de reserva verifica a mesma disponibilidade dentro da transação, após bloquear a conta do cliente e o profissional. Requisições simultâneas da mesma conta não conseguem criar dois atendimentos sobrepostos pelo endpoint.
- O aviso de agendamento existente inclui o nome do profissional para distinguir agendas independentes.
- Testes com PostgreSQL cobrem bloqueio de pendentes e confirmados, conflito pessoal entre profissionais, manutenção de disponibilidade para outros clientes e liberação de pendentes expirados.
