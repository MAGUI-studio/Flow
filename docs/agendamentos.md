# Regras de agendamento

## Disponibilidade

O responsável abre a agenda; não há limite fixo de 90 dias. Pode liberar semana a semana ou meses do ano seguinte.

- Recorrências semanais com período de validade, janelas diárias e pausas.
- Datas específicas e sessões pontuais.
- Bloqueios, férias e exceções prevalecem sobre recorrências.
- Cada profissional tem disponibilidade própria. Serviço deve estar vinculado ao profissional.
- Duração do serviço e intervalo entre horários de início são independentes.
- Buffers antes/depois ocupam a agenda. Usar intervalos semiabertos `[início,fim)`; reservas adjacentes sem buffer são permitidas.
- Fuso IANA por estabelecimento; armazenar instantes em UTC e converter na apresentação. Não converter horários locais por concatenação textual com `Z`.

## Individual e coletivo

- Individual: um atendimento por profissional por intervalo.
- Coletivo: sessão definida por serviço, profissional, início, duração e capacidade; cada consumidor ocupa uma vaga.
- A sessão coletiva bloqueia o profissional durante todo o encontro, mesmo antes de lotar; não criar um bloqueio por participante.
- Profissional não pode conduzir duas sessões sobrepostas nem atendimento paralelo.
- Não exceder capacidade mesmo com confirmações concorrentes.

## Estados

Solicitado → pendente ou confirmado conforme configuração. Pendente → confirmado, recusado, cancelado ou expirado. Confirmado → cancelado, concluído ou falta.

- Pendentes ocupam horário/vaga.
- Expiração: menor entre criação + 24h e início do atendimento.
- O responsável não pode reservar serviços no próprio estabelecimento; a regra é aplicada na página pública e na API.
- Reservas confirmadas são concluídas automaticamente 24 horas após o início agendado, liberando a avaliação do cliente mesmo sem conclusão manual. O processamento é idempotente, registra auditoria e não altera cancelamentos, recusas, pendências, expirações ou faltas.
- Cancelamento/recusa/expiração libera capacidade. Liberar bloqueio da sessão individual quando não houver reservas ativas; sessão coletiva continua bloqueando o profissional enquanto aberta.
- Uma conta não pode reservar duas vagas na mesma sessão no MVP.
- Aprovação após expiração deve falhar. Aprovar não reinicia o prazo nem altera o início.

## Cancelamento e reagendamento

- Antecedência mínima configurável pelo estabelecimento.
- Fora do prazo, consumidor deve contatar o responsável; este pode cancelar pelo painel.
- Reagendamento deve ser transacional: só liberar a reserva anterior se a nova estiver garantida.
- Registrar autor, horário e motivo das mudanças.
- Punição automática por cancelamentos/faltas foi adiada. Futuro: por estabelecimento, com janela de ocorrências, transparência e reversão; sem bloqueio global automático.

## Confirmação de presença

Proposta aceita no planejamento: código numérico de seis dígitos por reserva confirmada; coletivo tem um código por participante. Gerar com fonte criptográfica e armazenar hash; código nunca lista para o responsável. Validar contra uma reserva específica, limitar tentativas e invalidar após uso. Não comprova pagamento. Presença manual permitida com registro de autor e motivo.

## Concorrência

Nunca confiar no calendário do navegador. Validar disponibilidade no servidor, checar assinatura, profissional/serviço/estabelecimento e reservar na mesma transação. Banco deve impedir sobreposição e serializar contagem de vagas. Idempotência protege repetição de requisições. Expiração precisa de tarefa periódica e limpeza transacional na tentativa de reserva; apenas um cron não basta.
