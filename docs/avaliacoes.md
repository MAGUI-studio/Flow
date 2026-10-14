# Avaliações

- Selo `flow_king.svg`: cinco estabelecimentos públicos mais bem avaliados em todo o catálogo, antes de filtros e paginação. Exige ao menos uma avaliação; usar média exata decrescente, quantidade de avaliações decrescente e nome/slug para desempate estável. Recalcular ao consultar o catálogo, sem vínculo com o plano Essencial/Pro.

- Disponível para consumidores de todos os planos, incluindo conta gratuita, em `/agendamentos` no histórico.
- O servidor exige autoria da reserva, status confirmado ou concluído e 24 horas completas após `session.startsAt` (instante agendado; não meia-noite do dia seguinte).
- Reservas pendentes, canceladas, recusadas, expiradas e faltas não são elegíveis.
- Uma avaliação por agendamento, com duas notas obrigatórias: estabelecimento e profissional que consta na sessão. Não há comentário ou campo de texto. A avaliação enviada não pode ser reenviada ou alterada nesta versão.
- Notas de 0 a 5, em passos de 0,5. Zero é uma escolha válida, diferente de não escolher uma nota.
- Notas são armazenadas como inteiros de 0 a 10 (meias estrelas), com restrições no PostgreSQL. A reserva é bloqueada na transação e possui uma única avaliação por chave primária, evitando duplicatas concorrentes.
- A média pública é `soma(nota_estabelecimento + nota_profissional) / (2 × quantidade_de_avaliações)`, considerando as notas originais de 0 a 5. Cada reserva e cada uma das duas notas têm o mesmo peso. Profissionais inativos continuam vinculados ao histórico; avaliações não dependem de assinatura ativa do avaliador.
- Agendamentos que mudarem para um status inelegível deixam de contribuir para a média pública. A avaliação fica preservada no histórico do consumidor.
- Cards da home, pesquisa e cabeçalhos dos quatro templates exibem média e quantidade de avaliações. Sem avaliações, mostrar “Sem avaliações”, sem inventar uma nota zero.
- Média calculada sem arredondamento no banco; número exibido com uma casa decimal. Representação visual em estrelas arredondada à meia estrela mais próxima.
- O histórico mostra as duas notas enviadas. Um aviso direciona aos atendimentos pendentes de avaliação, sem notificações externas.

## Seed local

- 47 avaliações fictícias em oito estabelecimentos, com diferentes quantidades e médias, incluindo notas zero e meias estrelas.
- Cada avaliação pertence a uma conta fictícia do seed e a um agendamento histórico concluído, com profissional e serviço reais do catálogo local. A criação da avaliação passa pela mesma validação da aplicação.
- Datas históricas fixas em janeiro de 2026 e contas com identificador exclusivo por estabelecimento/avaliação tornam a operação idempotente. Não alterar reservas ou avaliações existentes de usuários.
- O seed principal continua restrito ao banco Docker local; nenhuma nota fictícia é criada em produção.
