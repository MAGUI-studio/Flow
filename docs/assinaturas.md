# Assinaturas e permissões

- Stripe para assinaturas SaaS, exclusivamente mensais.
- Clerk Billing foi avaliado em 14/10/2026. A documentação oficial informa indisponibilidade no Brasil; manter Clerk para autenticação e Stripe direto para cobrança. Referência: https://clerk.com/docs/guides/billing/overview. Reavaliar caso a disponibilidade mude.
- Conta sem assinatura pode reservar gratuitamente, sem criar/gerenciar estabelecimentos.
- Essencial: um estabelecimento. Expandir: até três. Nomes provisórios; preços pendentes.
- Dez profissionais por estabelecimento. Somente responsável gerencia os dados.
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
