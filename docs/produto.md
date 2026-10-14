# Produto e decisões

## Visão

Flow é um SaaS da MAGUI.studio para microempresas e profissionais que atendem por agendamento: beleza, barbearia, saúde, aulas e outros serviços. Uma conta pode ser consumidora e responsável por estabelecimentos simultaneamente.

## Endereços e experiência

- `flow.magui.studio`: landing page e diretório público.
- `flow.magui.studio/[slug]`: mini página padronizada de cada estabelecimento.
- `/agendamentos`: histórico e compromissos do consumidor.
- `/painel`: gestão exclusiva pelo responsável; profissionais não têm login.
- Fluxo: serviço → profissional → data/horário → identificação Google → revisão/solicitação. Quando há um único profissional, a seleção pode ser automática.
- Personalização: logo, capa, descrição, contatos, endereço e links. Layout e identidade do Flow permanecem padronizados.
- Busca por nome/categoria, cidade e modalidade. Apenas estabelecimentos ativos aparecem.

## Identidade

- Primária: `#635BFF`; hover: `#5046E5`.
- Fundo claro: `#F5F4FF`; texto: `#18181B`; fundo escuro: `#101014`.
- Logos fornecidos pelo usuário movidos de `logos/` para `public/brand/`; favicon em `src/app/favicon.ico`.

## Identidade do usuário

- Clerk exclusivamente com Google; conta obrigatória para concluir reservas.
- Nome e avatar Google com fallback. Telefone não é obtido automaticamente pelo Google.
- Serviços online exigem WhatsApp na reserva; finalidade explicada antes do envio e acesso restrito ao consumidor e responsável.
- Configurar Google como único provedor no Clerk; esconder opções na interface não é controle suficiente.
- Aplicação Clerk indicada pelo usuário: `app_3KgjBcfD1JlBEOCHQ8UHZWFt3MA`.

## Serviços

- Modalidade presencial ou online por serviço.
- Preço fixo em centavos de BRL ou gratuito (zero). Registrar preço e duração na reserva para preservar condições históricas.
- Flow não recebe pagamentos pelos serviços nem sinal; somente cobra sua assinatura SaaS.
- Aviso na revisão: “O Flow gerencia apenas o agendamento e não recebe pagamentos pelos serviços. Não recomendamos pagamentos antecipados solicitados fora da plataforma.”
- Sem notificações de agendamentos por e-mail/WhatsApp no MVP. Autenticação e cobrança têm fluxos separados.

## Pendências comerciais

- Valores mensais dos dois planos ainda não definidos.
- Limite proposto: dez profissionais por estabelecimento em ambos os planos. Usuário aprovou dez profissionais; aplicação por estabelecimento foi explicitada no planejamento.
- Sem limite comercial inicial de serviços é proposta de implementação, não promessa de capacidade infinita.
- Categorias, políticas de privacidade/termos e retenção após exclusão precisam ser finalizados antes de operação pública.
