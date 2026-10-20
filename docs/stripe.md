# Assinaturas Stripe

Skills oficiais instaladas em `.agents/skills`: `stripe-best-practices` e `stripe-docs`. Atualize com `npx skills update -y`. A CLI é uma dependência de desenvolvimento; use `npx stripe docs /billing/subscriptions/webhooks` para consultar a documentação.

## Ambiente local

1. Configure a chave **de teste** em `STRIPE_SECRET_KEY` de `.env.local` (nunca versionar). Prefira uma chave restrita com permissões para os recursos usados.
2. Execute `npm run stripe:setup`: cria/reutiliza produtos separados para Essencial (BRL 49,90/mês) e PRO (BRL 89,90/mês), preços e portal. Salva somente os IDs em `.env.local`.
3. Configure `FLOW_BILLING_ENABLED=true` e execute `npm run dev`. O comando conecta o webhook Stripe de teste, salva seu segredo sem imprimi-lo e só então inicia o Next.js. Um único terminal mantém ambos em execução. Sem cobrança de teste configurada, inicia apenas o Next.js. Para controle manual, use `npm run stripe:listen` e `npm run dev:app` em terminais separados.
4. Entre no Flow, escolha um plano e conclua o Checkout com um cartão de teste Stripe. Cada cliente recebe 7 dias de teste na primeira assinatura, com cartão coletado e cobrança automática ao terminar. Novas contratações do mesmo cliente não repetem o benefício.

O listener encaminha para `${NEXT_PUBLIC_APP_URL}/api/billing/webhook`; não é um endpoint público persistente. Ao encerrar `npm run dev`, o encaminhamento é encerrado junto. Reinicie o comando em cada sessão de desenvolvimento.

Execute `npm run stripe:verify` para verificar preços e sessões temporárias de Checkout e portal. Execute `npm run test:billing` para o ciclo completo com Stripe de teste e schema PostgreSQL local descartável: trial, alteração dos dois planos, limites, ajuste proporcional, duplicação e atraso de eventos, cancelamento, nova contratação, primeira cobrança, renovação mensal, recusa do cartão e recuperação. O teste usa Stripe Test Clocks para avançar o tempo; recusa chaves live e banco remoto, e limpa os recursos descartáveis ao terminar. Nenhuma cobrança real é feita.

Checkout e portal usam páginas hospedadas: a chave pública não é necessária ao fluxo atual. Nenhum dado de cartão passa pelo Flow. A página de retorno aguarda o estado confirmado pelo webhook, sem liberar acesso pelo redirecionamento.

Ao escolher um plano sem sessão, o login e o cadastro retornam para `/assinatura/continuar?plano=basic|multi`. Essa rota autenticada preserva a escolha e abre o Checkout automaticamente. Uma assinatura já ativa segue para a gestão ou para a confirmação de troca, sem criar outra contratação. Falhas mostram uma tentativa explícita, mantendo o plano escolhido. Fechar a modal sem entrar não inicia a contratação.

## Eventos e acesso

- `customer.subscription.created`, `.updated`, `.deleted`: sincronizam plano, datas, cancelamento e acesso. O status Stripe `trialing` é normalizado para `active` no modelo atual do Flow, com acesso até o fim do teste.
- Cancelamento programado considera tanto `cancel_at_period_end` quanto `cancel_at` (usado pelo portal durante o trial); o acesso é limitado à data efetiva mais próxima. O teste inclui agendamento e reativação nos dois formatos.
- `invoice.paid` e `invoice.payment_failed`: recuperam o estado atual da assinatura, cobrindo renovação e inadimplência. Estados diferentes de `active`/`trialing` bloqueiam acesso, sem período adicional de tolerância.
- `charge.refunded`, `charge.dispute.created`, `radar.early_fraud_warning.created`: registram um evento de auditoria associado ao dono pelo Customer e emitem alerta nos logs para revisão financeira. Não cancelam automaticamente a assinatura; reembolso não implica cancelamento no Stripe. Em produção, direcione esses alertas para monitoramento operacional.

Eventos são assinados, processados com deduplicação em transação e sincronizados consultando o estado atual do Stripe após lock. Metadados identificam o dono somente ao criar o vínculo inicial; eventos seguintes usam o Customer persistido. Assinaturas antigas não substituem a nova em eventos atrasados.

O portal permite faturas, atualização dos dados de cobrança/cartão e cancelamento no fim do período. `/assinatura` funciona mesmo sem acesso ao painel e mostra preço, prazo e teste grátis. Na tabela inicial, o preço e a oferta ficam em cada coluna; a gestão aparece como link no comparativo e no plano atual.

O botão “Mudar plano” abre `/assinatura/alterar?plano=basic|multi`. O servidor calcula a prévia de cobrança no Stripe, assina uma confirmação válida por 15 minutos e exige a concordância em formulário React Hook Form + Zod. A mudança é imediata com ajuste proporcional; reduções geram crédito para próximas faturas quando aplicável. O trial original é preservado, sem conceder outro. O formulário mostra cobrança atual, crédito e preço recorrente antes da confirmação.

O downgrade valida novamente os limites e bloqueia se houver mais de um estabelecimento ou mais de dez profissionais não excluídos. Não exclui dados automaticamente. O mesmo lock da conta serializa as alterações com os cadastros. Trocas genéricas ficam desativadas no portal para impedir contornar essa validação. O upgrade usa `pending_if_incomplete`: se a cobrança exigir ação, o usuário conclui na fatura hospedada e os novos recursos só são liberados após confirmação efetiva. Quotes consumidas não podem ser reaplicadas depois de outras alterações.

## Antes da produção

- Configure credenciais de produção no gerenciador de segredos da hospedagem e IDs próprios de produtos/preços/portal; o script de setup recusa chaves de produção.
- Cadastre o endpoint HTTPS público `/api/billing/webhook`, na versão `2026-09-30.endive`, com exatamente os oito eventos acima. Use o segredo desse endpoint, diferente do segredo da CLI.
- Configure `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_MULTI`, `STRIPE_PORTAL_CONFIGURATION`, `STRIPE_WEBHOOK_SECRET`, `FLOW_BILLING_ENABLED=true` e `DEV_SUBSCRIPTIONS_ENABLED=false`.
- Execute os testes no ambiente de homologação e confirme a entrega do endpoint público no Workbench. A integração foi validada localmente com Stripe e PostgreSQL; credenciais e webhook de produção são próprios do ambiente publicado.
- Defina os requisitos fiscais com a contabilidade. Stripe Tax precisa de registros fiscais ativos antes de habilitar `automatic_tax`; ele não foi habilitado nesta integração.
- Prefira chaves restritas, rotacione chaves compartilhadas e configure alertas de falhas de webhook e risco financeiro.

O hook local `.githooks/pre-commit` verifica o conteúdo staged antes de permitir um commit e bloqueia padrões de chaves secretas/restritas e segredos de webhook Stripe, sem imprimir os valores. `npm run secrets:check` permite executá-lo manualmente. Este checkout usa `core.hooksPath=.githooks`; em novos clones, configure o mesmo caminho com `git config core.hooksPath .githooks`.
