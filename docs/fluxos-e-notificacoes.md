# Fluxos, publicação e notificações internas

A área pessoal (`/agendamentos` e `/favoritos`) e a área de negócio (`/painel`) têm navegação explícita para assinantes, inclusive no menu móvel. O cadastro de um estabelecimento novo gera um rascunho: ele não aparece no catálogo, mapa, favoritos ou sitemap e não aceita reservas enquanto não for publicado.

`/painel/configuracao` mostra as etapas reais do estabelecimento selecionado: apresentação/endereço, equipe, serviços vinculados e horários. A publicação é autorizada no servidor e verifica novamente os requisitos dentro da transação. Os estabelecimentos existentes permanecem publicados na migração. É possível retirar a página do ar sem excluir seus dados.

A confirmação da assinatura usa exclusivamente o status local verificado pelo webhook Stripe. Uma confirmação válida mostra o próximo passo; após 30 segundos sem confirmação, a tela permite consultar novamente, sem criar outra cobrança. Sessão expirada pede novo login.

O sino aparece na topbar para contas autenticadas. O drawer é alinhado à borda direita do container de 1760px, tem animações de entrada e saída e respeita `prefers-reduced-motion`. O ScrollArea contém a lista; cada aviso abre o contexto relacionado e pode ser marcado como lido. O contador e as leituras são persistidos por conta. A API retorna os 50 avisos mais recentes e o total de não lidos, com consultas limitadas e sem cache público.

As notificações de reserva são gravadas por trigger na mesma transação da criação ou mudança de status: pendente, confirmada, cancelada, recusada, expirada, concluída e ausência. Chaves únicas impedem duplicações. A conclusão libera o convite para avaliar. Lembretes de atendimentos confirmados nas próximas 24 horas são idempotentes, gerados pelo worker/cron ou ao consultar notificações. Nenhum e-mail é enviado.

No ambiente local, o worker executa a cada minuto. Na Vercel Hobby, o cron permanece diário; a abertura do drawer faz o catch-up da própria conta. Portanto, o lembrete interno não depende de uma tarefa executada em um minuto exato, e aparece quando o usuário consulta sua conta. Solicitações sem aprovação são expiradas automaticamente; a interface informa o prazo exato. A conclusão manual e a automática após 24h são diferenciadas no histórico do cliente e na agenda do negócio.

Formulários exibem a primeira pendência perto do submit, além do resumo no `?`. Campos editados mantêm o indicador roxo. Navegação por links com alterações não salvas pede confirmação em modal; fechamento/recarregamento da aba usa a proteção nativa do navegador. Cancelar a navegação preserva os valores; restaurar os valores originais ou salvar remove a pendência.

Falhas inesperadas da API retornam um UUID de referência também registrado no log do servidor, com operação, tipo, código e frames. Mensagens de erro e payloads enviados pelo cliente não são gravados nesse log. Erros de página possuem estado recuperável com referência do Next.js quando disponível.

## Verificação

- `npm run typecheck`
- `npm test`: regras e regressões, incluindo referências de suporte sem dados do formulário.
- `npm run test:db`: concorrência, autorização e integridade em schemas PostgreSQL isolados.
- `npm run test:journey`: assinatura local ativa → rascunho → equipe → serviço → publicação → disponibilidade → reserva → aprovação → lembrete → conclusão → avaliação, além de isolamento das notificações e idempotência.
- `npm run test:e2e`: desktop e celular. Fluxo público de seleção, altura fixa, ausência de overflow, confirmação de assinatura, APIs privadas, drawer alinhado/animado, leitura persistida e confirmação de saída. Os testes do drawer usam componentes reais com adapters de identidade/navegação e respostas HTTP isoladas; não criam sessões de usuários. A confirmação Stripe é simulada apenas no teste de interface; não há compra real.

Instalar o Chromium de testes com `npx playwright install chromium`. Os testes usam o servidor em localhost:3000 ou iniciam `npm run dev:app`. Artefatos do Playwright são ignorados pelo Git. A migração Prisma deve ser aplicada antes de iniciar a versão nova; `vercel-build` já executa `prisma migrate deploy`.
