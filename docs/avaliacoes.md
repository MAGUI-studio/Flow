# Avaliações

- O responsável marca o atendimento como concluído na agenda. A avaliação fica disponível imediatamente no histórico do cliente em `/agendamentos`, sem espera de 24 horas.
- Caso o responsável não finalize, reservas confirmadas são concluídas automaticamente 24 horas exatas após `session.startsAt`. O servidor Node verifica atrasados ao iniciar e a cada minuto, sem depender de uma página aberta; o histórico, o painel e o envio da avaliação também sincronizam os registros pertinentes. Em ambientes que suspendem o processo entre requisições, a sincronização acontece ao retomá-lo ou acessar essas páginas.
- A conclusão automática preserva reservas futuras, pendentes, canceladas, recusadas, expiradas, faltas e conclusões manuais. A atualização é atômica, concorrente e idempotente, com evento `booking.auto_completed` por reserva. O atraso é contado em 24 horas reais, sem arredondar para meia-noite.
- Apenas o cliente da reserva pode avaliar. O servidor exige status `completed`, horário de início já alcançado e consumidor diferente do proprietário. Reservas apenas confirmadas, futuras, pendentes, canceladas, recusadas, expiradas e faltas não são elegíveis.
- Uma avaliação por agendamento, com duas notas obrigatórias: serviço recebido e estabelecimento. Serviço e profissional são identificados pela sessão da reserva. Não há comentário ou edição após enviar.
- Notas de 0 a 5 em passos de 0,5. Zero é válido; não selecionar uma nota gera erro no campo. As notas são armazenadas como inteiros de 0 a 10, com restrições no PostgreSQL.
- A reserva é bloqueada na transação e a avaliação tem chave primária pelo agendamento, impedindo duplicação mesmo com envios concorrentes. O cliente não precisa de assinatura ativa para avaliar.
- `serviceScore` reutiliza a coluna histórica `professional_score` pelo mapeamento do Prisma, preservando compatibilidade sem migração destrutiva.
- A média pública é `soma(nota_estabelecimento + nota_serviço) / (2 × quantidade_de_avaliações)`, usando as notas originais de 0 a 5. Cada nota e reserva têm o mesmo peso. Exemplo: estabelecimento 5 e serviço 4 resultam em média 4,5.
- Apenas reservas concluídas entram na média. Contas de demonstração com prefixo `flow_seed_` e avaliações do próprio proprietário são excluídas. Mudar para status inelegível retira a contribuição, preservando o registro.
- Home, explorar, mapa e os quatro templates compartilham a média real e a contagem. Sem avaliações reais, exibem “Sem avaliações”; não há nota fictícia ou zero padrão.
- A média não é arredondada no cálculo. A apresentação usa uma casa decimal e estrelas arredondadas à meia estrela mais próxima.
- O selo `flow_king.svg` destaca os cinco estabelecimentos públicos mais bem avaliados, exigindo ao menos uma avaliação real. Desempate por média exata, quantidade, nome e slug; não depende do plano.
- O histórico mostra as duas notas enviadas. O aviso de avaliações pendentes abre os atendimentos concluídos ainda não avaliados. O envio invalida home, explorar, perfis e histórico.

## Demonstração local

O seed padrão não gera avaliações. `npm run db:seed -- --with-demo-reviews` cria fixtures locais opcionais; elas continuam excluídas de toda nota pública. As 47 avaliações de demonstração legadas são preservadas no banco e ignoradas nos agregados, sem apagar dados ou reservas.
