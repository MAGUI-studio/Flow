# Status e exclusão de profissionais

- **Ativo:** aceita novas reservas conforme serviços, disponibilidade, bloqueios e capacidade.
- **Inativo:** não aceita novas reservas e não aparece na escolha pública de profissionais. Continua na equipe, pode ser editado e reativado. As reservas existentes não são canceladas automaticamente.
- **Férias:** período com início e término inclusivos, no fuso do estabelecimento. Impede reservas cujo intervalo de ocupação, incluindo os intervalos de preparação, se sobreponha ao período. Fora dele, a disponibilidade continua funcionando, inclusive após o último dia, sem uma tarefa agendada para reativação.
- Os cards da lista são somente para consulta e possuem um link “Editar profissional”, que abre `/painel/profissionais/[id]/editar`, preservando o estabelecimento selecionado. Nome, foto, status e férias são alterados nessa página. A exclusão com confirmação também fica na página de edição.
- Um profissional pode ter um período de férias configurado por vez. Salvar com status Ativo ou Inativo remove esse período. Mudanças no formulário só entram em vigor ao salvar; nome, status e foto são persistidos na mesma transação do banco.
- Férias com reservas futuras confirmadas ou pendentes válidas no período são recusadas. O responsável deve resolver essas reservas na agenda primeiro. Pendências expiradas e reservas canceladas não impedem a alteração.
- **Excluir:** exige confirmação e impede restauração pelo portal. Profissionais com reservas futuras confirmadas ou pendentes válidas não podem ser excluídos. A exclusão remove o profissional das listas e libera sua vaga no plano; o registro permanece marcado como excluído para preservar referências de reservas e avaliações.
- Inativos e profissionais de férias continuam contando no limite do plano. Excluídos não contam. Não é possível reativar ou editar um excluído pelas APIs.
- Alterações exigem assinatura ativa e propriedade do estabelecimento. O bloqueio de férias é aplicado tanto na disponibilidade individual e coletiva quanto na função PostgreSQL que confirma a reserva. Os bloqueios transacionais evitam concorrência entre alterações de status e reservas.
- Férias são configuradas nos campos da página de edição. A confirmação de exclusão usa Nuqs (`excluir-profissional`) e retorna à lista após sucesso.
