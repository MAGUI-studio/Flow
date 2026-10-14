# Controles e identidade visual

## Padrões de implementação

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
