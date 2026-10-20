# Estado da implementação

Atualizado em 20/10/2026 para a integração Stripe.

## Funcionando com PostgreSQL

- Catálogo e mini páginas consultam exclusivamente o banco via Prisma; nenhum array de estabelecimentos é importado pela aplicação.
- Seed local cria oito estabelecimentos, 19 profissionais e 30 serviços usando as mesmas funções de cadastro dos formulários.
- Fluxo serviço → profissional vinculado → data → horário → revisão → reserva persistente. Resumo inicialmente vazio, com limpeza das escolhas posteriores ao voltar ou trocar.
- Horários individuais calculados no servidor com janelas, duração, cadência, buffers, pausas e reservas ativas; sessão individual criada atomicamente na reserva.
- Coletivos com capacidade e vagas restantes. WhatsApp obrigatório online. Preço e duração preservados na reserva.
- Google obrigatório para confirmar; seleção recuperada no retorno do login e revalidada no servidor.
- Histórico do consumidor e cancelamento dentro do prazo; aprovação/recusa/conclusão/cancelamento pelo responsável.
- Painel restrito à assinatura ativa e ao proprietário, com cadastro de estabelecimento, equipe, serviços, janelas por data, bloqueios e sessões coletivas.
- Páginas internas com navegação lateral e rotas próprias para listas e cadastros, sem abas. Agendamentos do consumidor redesenhados, filtros persistidos com Nuqs, contadores reais e confirmações de ações. Ver `paginas-internas.md`.
- Controles de formulário padronizados: menus Select próprios, calendário, seleção de hora/minuto, inputs, textos longos e checkboxes com visual Flow. Componentes reutilizáveis em `src/components/ui`.
- Tailwind CSS configurado como padrão; ScrollArea Radix na sidebar, limite global de 1.760 px e Container com padding compartilhado. Categorias em cards, ícones/números decorativos ao fundo e campo de URL alinhado.
- Formulários próprios de cadastro, busca e reserva usam React Hook Form + Zod. WhatsApp e valores recebem máscaras durante a digitação; mensagens por campo preservam os dados e impedem envio inválido.

## Ativação temporária de planos

Solicitada pelo usuário: o clique autenticado ativa assinatura sem cobrança. Exige `NODE_ENV=development` e `DEV_SUBSCRIPTIONS_ENABLED=true`. Produção retorna 404 mesmo com a flag ligada. Contas deslogadas entram com Google; assinantes veem plano ativo e acesso ao painel.

Campos de assinatura: plano, status, período inicial/final, cancelamento ao fim do período, provedor e IDs Stripe. Atalho usa provedor `development`; seed usa `seed`. Assinaturas com ID Stripe não são alteradas pelo atalho.

## Ainda pendente

- Publicação e configuração de credenciais/webhook de produção. Stripe de teste já implementado: Checkout com trial, portal, upgrade/downgrade com prévia e validação dos limites, cobrança proporcional, webhooks, inadimplência e reativação. Testes com Stripe real de teste, PostgreSQL isolado e Test Clocks cobrem renovação, cancelamento e eventos atrasados. Ver [Integração Stripe](stripe.md).
- Downgrade com escolha/exclusão; atualmente bloqueado quando há mais de um estabelecimento ao escolher Essencial.
- Edição/exclusão de cadastros, uploads e editor de recorrência semanal. Abertura por datas funciona sem limite de 90 dias.
- Reagendamento transacional e código de presença.
- Tarefa periódica de expiração. Consultas já desconsideram pendentes expiradas, reserva realiza limpeza transacional e interfaces mostram prazo efetivo.
- Revisão final de privacidade, rate limiting, operação e produção.

## Verificação

Testes unitários e PostgreSQL com schema temporário cobrem concorrência, sobreposição, expiração, idempotência, Prisma e limites. Navegação verifica resumo vazio, profissionais por serviço e horários reais. Login Google e ativação com a conta do usuário precisam ser conferidos na sua sessão; não existe login simulado.
