# Notificações de interface

O Flow usa Sonner com o componente global `FlowToaster`, montado no layout principal para continuar visível após navegações internas.

O desenho segue o toast do projeto Forever: fundo branco, borda discreta, cantos arredondados, sombra leve, ícone grande e translúcido ao fundo e botão de fechar. Os tons foram adaptados à identidade do Flow e são definidos com Tailwind.

Use `notify.success`, `notify.error` e `notify.info` de `components/ui/flow-toaster` para retornos das ações. Há também `notify.loading` e `notify.dismiss` para operações que precisam atualizar uma notificação. Sucessos duram 4 segundos; erros, 6,5 segundos. O limite é de três notificações visíveis, no canto superior direito.

`useToastError` substitui os antigos estados de erro genérico das ações e reutiliza o ID por componente, evitando acumular o mesmo erro. Receber uma mensagem vazia fecha a notificação anterior.

Erros de validação continuam nos campos correspondentes, com React Hook Form e Zod. Mensagens persistentes que explicam o estado de um mapa, carregamentos, regras de disponibilidade e o comprovante final de um agendamento permanecem no contexto da tela.

Retornos de cadastros, edição de profissionais, exclusão, ações de agendamentos, avaliações, aparência e ativação de planos usam os toasts compartilhados.
