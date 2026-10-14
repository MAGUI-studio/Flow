# Controles e identidade visual

Todos os controles do projeto usam a identidade do Flow: bordas suaves, fundo branco, roxo de seleção/foco, estados de erro e desabilitado. Não usar menus visuais nativos de select, data ou hora nas novas telas.

- `FlowSelect`: opções com menu próprio, Radix para teclado, Escape, navegação por texto, seleção e foco. Preserva `name`, valor e `required` para formulários. Opções JSX são declarativas; não renderizam um menu nativo visível.
- `DateRail`: escolha da data no agendamento por cartões de dias lado a lado, navegação por sete datas e atalhos de mês. Somente datas abertas pelo profissional; sem seleção automática. No celular, permite deslizar horizontalmente. Preferir escolhas visuais a selects quando houver espaço e a tarefa se beneficiar disso; selects apenas quando necessários.
- Trocar o dia mantém a grade e sua altura durante a atualização. Horários anteriores ficam desabilitados até a resposta correspondente à data atual; respostas antigas são canceladas e não podem liberar seleção. Reservas futuras do consumidor no estabelecimento aparecem acima do fluxo e marcam o dia como “Agendado”, mesmo se não restarem vagas naquele dia. Confirmadas e pendentes válidas apenas, usando o fuso do estabelecimento; dados sempre filtrados pelo usuário autenticado.
- `FlowDate`: calendário em popover e digitação `dd/mm/aaaa`, conversão para ISO no formulário, validação da data, navegação por mês e setas/Home/End. Preserva ano futuro sem limite de 90 dias.
- `FlowTime`: hora e minuto separados, ambos com menu Flow; todos os minutos de 00 a 59, sem restringir horários de abertura à cadência do serviço.
- Inputs, textos longos, números e checkboxes: estilos compartilhados em `src/app/globals.css`. Controles numéricos mantêm semântica e teclado, com remoção dos spinners nativos.
- Clerk recebe tipografia, texto, bordas e roxo Flow pelo provider.

Não remover semântica de formulário, labels, foco de teclado ou validações ao estilizar. Respeitar redução de movimento. Campos devem resetar após salvar e ao mudar de estabelecimento.
