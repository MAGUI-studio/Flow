# Controles e identidade visual

## Padrões de implementação

- Modais de login disparadas na contratação e no agendamento compartilham `auth-modal-appearance.ts`: logo Flow, ícone decorativo suave, superfícies sólidas, tipografia e bordas lilás, botão Google e foco visível. Personalização pela API `appearance` do Clerk com classes Tailwind, preservando autenticação e retorno ao fluxo original.

- O selo Flow King fica à direita do nome, com `justify-between`, nunca sobre a capa. Tooltip roxo explica o reconhecimento no hover/foco e no toque; renderizar em portal para não cortar no card. Abrir o tooltip não navega para o estabelecimento; card e controle do selo são elementos interativos separados.

- Sidebar empresarial usa `pro_plan.svg` ou `essential_plan.svg` ao lado de “Seu plano”, conforme a assinatura. Cards dos cinco líderes globais em avaliações exibem `flow_king.svg` ao lado do nome, com `justify-between`, com identificação acessível. O selo não é comercial e não depende do plano.

- No cartão de autenticação, o cursor deve se mover até o centro real do dia antes do clique; só depois mudar a seleção. Usar sinal de clique junto ao cursor, nunca pulsar o bloco inteiro do dia. Confirmar após a seleção final e manter o resultado visível antes de reiniciar.

- Login e cadastro possuem textos próprios na apresentação à esquerda. O cartão `AuthCalendar` anima a seleção de dias e a confirmação, preservando a inclinação e a etiqueta sobreposta. Respeitar movimento reduzido e suspender fora da tela/aba ativa. Usuários já conectados veem um acesso aos agendamentos; subrotas OAuth continuam sob controle do Clerk.

- Autenticação: `/entrar` e `/criar-conta` compartilham o layout `AuthPage`, com apresentação do Flow à esquerda e componente nativo Clerk à direita. Google continua sendo o único provedor. `/sign-in` e `/sign-up` são aliases que preservam subrotas e parâmetros do Clerk ao redirecionar. Não impor um destino fixo que descarte o retorno ao agendamento. Reservar o slug `criar-conta`.

- Na capa dos cards, preservar o monograma original em Georgia, asterisco sobrescrito e círculos finos. Não substituir essa identidade por um ícone grande de categoria; manter o restante do card refinado e sem deslocamento no hover.

- Cards públicos de estabelecimentos usam `BusinessListingCard` na home e na pesquisa. Capa e logo reais quando cadastrados, monograma e ícone decorativo da categoria como alternativa, localização/modalidade e até dois serviços do banco. Card não sobe nem se desloca no hover: usar borda, sombra discreta, cor do título e animação da seta. Sem gradientes.

- Todos os textos da interface devem estar prontos para produção, inclusive no ambiente local. Não exibir avisos de desenvolvimento, testes, dados ilustrativos, implementação futura ou ativação sem cobrança. Controles internos de ambiente não alteram essa regra editorial.

- A demonstração do portal na home não tem fundo roxo externo e ocupa a largura da seção: títulos e descrição sincronizados acima, janela grande abaixo. Percorre visão geral, profissionais, serviços e agenda, com cliques na navegação e aprovação em memória. Não criar tabs funcionais no produto para essa demonstração; o portal segue com páginas separadas. Ações da agenda usam altura consistente e alinhamento central no portal e na prévia.

- A tabela segue o comparativo SaaS do Forever: recursos agrupados por categoria, dados e cabeçalhos dos planos centralizados, divisórias leves e espaçamento amplo. O Pro usa destaque discreto, sem cabeçalho roxo sólido. Capacidade: 1/3 estabelecimentos, 10/20 profissionais por estabelecimento (10/60 no total), 2/4 templates. Relatórios avançados e CSV são exclusivos Pro.

- Os planos ficam na home em `/#planos`, em tabela comparativa Essencial/Pro. O Pro inclui mais unidades e profissionais, relatórios e exportação. Valores continuam pendentes de definição. `/planos` redireciona para a seção, e todos os links novos apontam diretamente para ela. A seção para negócios possui uma agenda animada com os serviços públicos usados no hero, sem criar reservas.

- As páginas públicas de estabelecimento (`/[slug]`) usam o mesmo limite centralizado de 1.200 px da home, incluindo o header e o fluxo de agendamento. Páginas internas seguem preenchendo toda a largura disponível.

- A demonstração do hero escolhe um estabelecimento com aprovação automática e prioriza múltiplos serviços/profissionais. Mostra até três opções reais em cada seleção, esconde os horários até selecionar o dia, mantém o botão no fluxo abaixo do conteúdo e termina em uma tela de sucesso. A tela de sucesso permanece por 2,3 segundos antes de reiniciar.

- O hero demonstra o fluxo real em quatro passos: serviço, profissional, data/horário e revisão. Usa dados públicos e disponibilidade do banco, os mesmos estilos de seleção e o componente DateRail. A confirmação é exclusivamente visual, sem gravar reservas. Sem controles de reprodução; respeitar movimento reduzido. Manter card inclinado, etiqueta superior direita e símbolo sobreposto inferior esquerdo. Posicionar o cursor pelas coordenadas locais dos elementos clicados; parar a animação fora da tela e em abas ocultas.

- `/explorar` exibe oito estabelecimentos por página, com paginação compartilhada no estilo do Flow. A página atual usa `pagina` na URL via Nuqs; mudar qualquer filtro volta à primeira página. Páginas fora do intervalo exibem a página válida mais próxima. Os controles incluem anterior/próxima, página ativa roxa e reticências para listas longas.

- Usar **Tailwind CSS** em todos os componentes e alterações de interface. Evitar CSS puro; os arquivos legados permanecem em `@layer components` para permitir substituição gradual por utilidades.
- Usar fundos sólidos. Única exceção aprovada: brilho radial atrás do calendário à direita do hero, com círculos também à direita. Evitar sparkles na etiqueta do hero. O hero é seguido diretamente pela busca de estabelecimentos, sem faixa intermediária de categorias.
- Layout raiz: `max-w-440 mx-auto` (1.760 px), incluindo o painel. Sidebar fixa acompanha a margem do layout em telas largas.
- A home `/` possui limite próprio de 1.200 px centralizado, como no visual original. Páginas internas continuam usando toda a largura disponível dentro do layout raiz.
- Home mostra até oito estabelecimentos após os filtros. `/explorar` é a pesquisa completa, com o mesmo limite visual de 1.200 px; a busca e “Explorar todos os espaços” preservam os filtros via Nuqs (`busca`, `cidade`, `categoria`, `modalidade`). A categoria ativa é roxa, e o botão Buscar usa o estilo do hero com seta horizontal animada.
- `Container` centraliza o padding horizontal: 16 px no celular, 24 px a partir de `sm` e 36 px a partir de `lg`. Conteúdo interno ocupa toda a largura disponível, sem um segundo limite de largura.
- Sidebar usa o `ScrollArea` Radix enviado pelo usuário, com classes Tailwind. Preservar teclado, foco e rolagem independente.
- Categorias são cards selecionáveis, sem select. Ícones decorativos e números de seção aparecem ao fundo, com baixo contraste e `aria-hidden`, sem substituir rótulos.
- Footer público reutilizável em `src/components/footer.tsx`: fundo escuro, navegação do produto/conta, links do studio e redes oficiais verificadas em `magui.studio` (Instagram `_magui.studio`, LinkedIn `magui-studio`, X `magui_studio`). Links externos abrem em nova aba com `noopener noreferrer`; não criar links para páginas legais inexistentes.
- Formulários próprios usam **React Hook Form + Zod**: schemas em `form-schemas.ts`, controles customizados integrados por `useController`, erros junto aos campos e foco no primeiro inválido. O servidor mantém validações de autorização, assinatura e disponibilidade.
- WhatsApp brasileiro tem máscara de DDD + telefone, aceita 10 ou 11 dígitos; valor monetário usa `1.234,56`, convertido para centavos inteiros; datas já possuem máscara `dd/mm/aaaa`. Não aplicar máscara a campos de texto livre como cidade ou endereço.

Todos os controles do projeto usam a identidade do Flow: bordas suaves, fundo branco, roxo de seleção/foco, estados de erro e desabilitado. Não usar menus visuais nativos de select, data ou hora nas novas telas.

- `FlowSelect`: opções com menu próprio, Radix para teclado, Escape, navegação por texto, seleção e foco. Preserva `name`, valor e `required` para formulários. Opções JSX são declarativas; não renderizam um menu nativo visível.
- `DateRail`: escolha da data no agendamento por cartões de dias lado a lado, navegação por sete datas e atalhos de mês. Somente datas abertas pelo profissional; sem seleção automática. No celular, permite deslizar horizontalmente. Preferir escolhas visuais a selects quando houver espaço e a tarefa se beneficiar disso; selects apenas quando necessários.
- Trocar o dia mantém a grade e sua altura durante a atualização. Horários anteriores ficam desabilitados até a resposta correspondente à data atual; respostas antigas são canceladas e não podem liberar seleção. Reservas futuras do consumidor no estabelecimento aparecem acima do fluxo e marcam o dia como “Agendado”, mesmo se não restarem vagas naquele dia. Confirmadas e pendentes válidas apenas, usando o fuso do estabelecimento; dados sempre filtrados pelo usuário autenticado.
- `FlowDate`: calendário em popover e digitação `dd/mm/aaaa`, conversão para ISO no formulário, validação da data, navegação por mês e setas/Home/End. Preserva ano futuro sem limite de 90 dias.
- `FlowTime`: hora e minuto separados, ambos com menu Flow; todos os minutos de 00 a 59, sem restringir horários de abertura à cadência do serviço.
- Inputs, textos longos, números e checkboxes: estilos compartilhados em `src/app/globals.css`. Controles numéricos mantêm semântica e teclado, com remoção dos spinners nativos.
- Clerk recebe tipografia, texto, bordas e roxo Flow pelo provider.

Não remover semântica de formulário, labels, foco de teclado ou validações ao estilizar. Respeitar redução de movimento. Campos devem resetar após salvar e ao mudar de estabelecimento.

Páginas internas seguem `paginas-internas.md`: layout próprio em `internal.css`, menu lateral, listas e cadastros em rotas separadas, alternativas curtas em cartões selecionáveis e Nuqs para estado de URL. Não introduzir abas para separar áreas do painel.

- Relatórios em `/painel/relatorios` com período via Nuqs e acesso validado no servidor.
- A animação para assinantes usa os mesmos componentes `OwnerAppointment` e `BookingActionControls` da agenda real. Demonstra aprovação em memória, sem acessar dados privados de clientes e sem enviar alterações à API de reservas.

# Pesquisa e filtros de equipe e serviços

As listas de profissionais e serviços permitem selecionar vários vínculos, buscar opções sem acentos e combinar todos os selecionados (interseção) ou qualquer um deles (união). As seleções ficam na URL via Nuqs, aparecem como etiquetas removíveis e são limpas ao trocar de estabelecimento. A pesquisa por nome aceita várias palavras, ignora acentos e espaços extras. A barra mostra a quantidade filtrada e o total do estabelecimento, preservando ordenação e filtros existentes.

A seleção de serviços na página pública do estabelecimento usa cartões em duas colunas a partir de `sm`, com uma coluna no celular, altura limitada e o ScrollArea compartilhado. A escolha atual possui indicador visual e `aria-pressed`; os preços ficam destacados em uma faixa própria. O resumo e o botão Continuar permanecem fora da área de rolagem.
