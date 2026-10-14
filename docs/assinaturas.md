# Assinaturas e permissões

- Stripe para assinaturas SaaS, exclusivamente mensais.
- Clerk Billing foi avaliado em 14/10/2026. A documentação oficial informa indisponibilidade no Brasil; manter Clerk para autenticação e Stripe direto para cobrança. Referência: https://clerk.com/docs/guides/billing/overview. Reavaliar caso a disponibilidade mude.
- Conta sem assinatura pode reservar gratuitamente, sem criar/gerenciar estabelecimentos.
- Essencial: 1 estabelecimento, até 10 profissionais por estabelecimento e 2 templates (Flow e Essência). Pro: até 3 estabelecimentos, 20 profissionais por estabelecimento, 4 templates (incluindo Editorial e Noturno exclusivos), relatórios avançados e exportação CSV. Cobrança mensal; valores pendentes.
- Somente o responsável gerencia a equipe. O código interno do Pro permanece `multi` para preservar assinaturas existentes.
- Cancelar renovação mantém acesso até fim do período pago. Ao término efetivo, congelar todas as empresas e bloquear painel empresarial; conta continua consumidora.
- Dados preservados para reativação. Slugs permanecem reservados durante congelamento.
- Página congelada informa indisponibilidade e não aceita reservas; sai do diretório.
- Proposta operacional: reservas confirmadas continuam visíveis ao consumidor, sem cancelamento silencioso; pendentes são canceladas no congelamento. Validar essa política antes do lançamento.
- Downgrade de três para um exige escolher dois estabelecimentos para excluir. Não interpretar exclusão como simples congelamento. Mostrar reservas futuras afetadas e exigir confirmação explícita; estratégia de retenção histórica ainda precisa de definição antes de implementar exclusão definitiva.
- Proposta: downgrade ao fim do período pago, preservando uso já contratado.

## Stripe

- Checkout criado no servidor para usuário autenticado, com Price ID permitido e vinculado ao usuário.
- Redirect de sucesso não libera acesso. Webhooks com assinatura verificada atualizam permissões.
- Webhooks idempotentes, tolerantes a duplicação e ordem diferente; consultar estado vigente quando necessário.
- Não conceder assinatura a partir de metadata/estado enviados pelo navegador.
- Tratar `past_due`, pagamentos falhos, reativação e término do período em política explícita. Prazo de tolerância é pendência, não presumir acesso pago.
- Portal de cobrança não pode contornar escolha obrigatória de exclusões no downgrade.

## Templates e relatórios

- A escolha do template é persistida em cada estabelecimento e validada no servidor. Ao perder o Pro, um template exclusivo fica salvo, mas a página usa Flow; ao reativar o Pro, volta ao template escolhido.
- Relatórios e CSV exigem assinatura Pro ativa no servidor e só consultam estabelecimentos do responsável. Intervalos: últimos 7, 30 ou 90 dias, considerando início do atendimento até o momento da consulta.
- Relatórios agrupam agendamentos por serviço, profissional e status. O valor de serviços concluídos não representa receita recebida: o Flow não processa pagamentos de serviços.
- Exportação CSV em UTF-8, sem contatos de consumidores, com neutralização de fórmulas. Mesmo filtro e intervalo do relatório.
- Redução de plano no ambiente de testes é bloqueada quando há mais de um estabelecimento ou mais de 10 profissionais ativos. Não excluir membros da equipe automaticamente.
