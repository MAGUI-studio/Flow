# Páginas internas

O painel usa navegação lateral com rotas reais, sem abas. O menu vira uma gaveta em telas pequenas. Cada área tem listagem e, quando aplicável, uma página exclusiva para cadastro.

| Rota                       | Conteúdo                                                             |
| -------------------------- | -------------------------------------------------------------------- |
| `/agendamentos`            | Reservas e histórico do consumidor, filtros e cancelamento           |
| `/painel`                  | Resumo do estabelecimento, próximos encontros e preparação da agenda |
| `/painel/agenda`           | Reservas recebidas, aprovação, recusa, cancelamento e conclusão      |
| `/painel/estabelecimentos` | Negócios da conta e uso do limite do plano                           |
| `/painel/profissionais`    | Equipe e serviços vinculados                                         |
| `/painel/servicos`         | Atendimentos, modalidade, duração, valor e equipe                    |
| `/painel/disponibilidade`  | Períodos abertos e bloqueios                                         |
| `/painel/sessoes`          | Turmas e capacidade disponível                                       |
| `/painel/assinatura`       | Plano, período e limites                                             |

Cadastros ficam em `/novo`, exceto sessões, que usam `/nova`. Não existem formulários escondidos em abas. Os formulários possuem seções, instruções próximas dos campos, indicação de obrigatoriedade, seleção visual para alternativas curtas e controles Flow para calendário, hora e seleções maiores. Salvar volta para a listagem; erros preservam os campos.

## Estado na URL

Usar Nuqs para estado de interface que pertence à URL. `NuqsAdapter` está no layout raiz; parsers, loaders e serializer compartilhados ficam em `src/lib/url-state.ts`.

- `estabelecimento`: contexto selecionado, preservado em links e retorno de cadastro.
- `busca`, `status`, `profissional`, `periodo`: filtros das listas.
- Filtros usam `shallow: false` para consultar novamente o servidor, `scroll: false` para preservar a posição e `history: replace` para não acumular uma entrada a cada alteração. Busca tem debounce de 300 ms.
- Valores padrão são omitidos. Recarregar ou compartilhar uma URL restaura seus filtros.
- URL nunca autoriza acesso: o servidor valida assinatura e propriedade; IDs de outros estabelecimentos não retornam dados.

## Dados e ações

Contadores e listas usam PostgreSQL. Não são criados agendamentos, receita ou clientes fictícios para preencher a interface. Estados vazios orientam o próximo cadastro. Pendentes expiradas aparecem com status efetivo. Datas respeitam o fuso do estabelecimento.

Ações destrutivas de reserva têm confirmação acessível com Radix AlertDialog. Cancelamento do consumidor continua sujeito ao prazo, e conclusão só aparece após o início do atendimento. A API mantém a validação final.

Edição/exclusão dos cadastros e recorrência semanal continuam fora desta entrega; os cadastros existentes e a abertura por data permanecem funcionais.
