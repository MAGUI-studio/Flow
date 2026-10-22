# Administração do Flow

Área privada em `/admin`. O papel SUPERADMIN é calculado no servidor a partir da identidade atual no Clerk: somente o e-mail **principal e verificado** `guibus.dev@gmail.com` é aceito. Contas bloqueadas ou travadas não recebem acesso. Não utiliza parâmetros de URL, localStorage ou metadados editáveis como autorização. Não depende de assinatura nem altera os limites dos negócios do administrador.

O link “Administração Flow” aparece no menu da conta depois da consulta autenticada a `/api/account/access`. Todas as páginas e a Server Action verificam a autorização novamente. Usuários não autorizados recebem 404 nas telas; alterações não autorizadas são recusadas. Falhas de Clerk não liberam acesso. As páginas são dinâmicas, não indexáveis e não estão no sitemap.

## Consultas

- Visão geral com contagens de usuários, contas, negócios, reservas e assinaturas.
- Usuários do Clerk, mesmo sem registro local, com busca e paginação.
- Contas locais, inclusive contas de demonstração e identidades excluídas ou de outra instância.
- Ficha com contatos, datas, provedores de login, MFA, estado de acesso, assinatura e IDs Stripe.
- Rotas próprias paginadas com negócios, equipe, horários, serviços, sessões, reservas como cliente ou dono, avaliações, favoritos, notificações, anotações operacionais, lista de espera, recorrências, reagendamentos, bloqueios, imagens e auditoria da conta.
- Visão global de estabelecimentos, assinaturas, agendamentos e auditoria.

As telas reutilizam a sidebar, o cabeçalho, as tabelas, os seletores e os diálogos do painel do Flow. As listas possuem busca, ordenação, tamanho de página e filtros específicos de situação, plano, acesso, publicação, provedor ou evento. Filtros de período usam o fuso de São Paulo e incluem o último dia informado. A filtragem ocorre antes da paginação, inclusive nos filtros combinados de usuários do Clerk e assinaturas locais. Os parâmetros ficam na URL para preservar a consulta ao navegar.

Situações, eventos e campos estruturados são apresentados em português; a busca na auditoria também aceita descrições traduzidas. Textos livres escritos por usuários e identificadores de referência são preservados. Históricos possuem tabelas com detalhes expansíveis.

Não exibe senhas, hashes de presença, tokens OAuth, segredos de upload ou dados completos de cartão. Consultas SQL administrativas possuem definições fixas e parâmetros para IDs e paginação. Não é um editor SQL.

## Alterações

Bloquear/desbloquear login usa a API oficial Clerk. O bloqueio revoga as sessões segundo o comportamento do provedor, mas não cancela a assinatura Stripe nem retira automaticamente negócios do ar. A conta administradora não pode bloquear a si própria.

Retirar/publicar estabelecimento altera sua publicação. Publicar exige assinatura válida e o mesmo cadastro completo exigido no fluxo do proprietário. Não concede plano grátis nem ignora requisitos comerciais.

Os formulários exigem motivo e confirmação, com validação Zod tanto no cliente quanto no servidor. Ações são registradas em `audit_events` com autor, alvo e motivo. Operações Clerk têm registro de intenção antes da chamada externa e conclusão após sucesso; não existe transação distribuída entre Clerk e Postgres. Uma intenção sem conclusão exige conferir o estado atual no Clerk antes de repetir. Falhas devolvem referência de suporte sem expor os dados enviados em logs.

Consultas às fichas e seus históricos também geram registros de acesso. Nenhuma alteração administrativa é executada ao visitar essas fichas; apenas o registro de auditoria é gravado.

## Produção

Entre na instância Clerk de produção com o mesmo e-mail principal verificado. Não é necessário seed de privilégio ou comando para promover a conta. A troca de instância continua exigindo planejamento dos vínculos dos usuários; esta funcionalidade não migra identidades.

Use as permissões Clerk necessárias para listar e consultar usuários e para bloquear/desbloquear contas. Mantenha as chaves somente no servidor. Configure a conta administradora com MFA no provedor disponível.

Verificações: `npm run test:admin` (inclui PostgreSQL local), `npm test`, `npm run typecheck`, `npm run build`. Os testes de política exercitam e-mail não verificado, e-mail secundário, usuários comuns, contas bloqueadas, sessão ausente, identidade divergente, indisponibilidade do provedor e validação de ações. Os entrypoints reais de todas as telas e da Server Action são testados com adapters isolados para garantir que a recusa ocorra antes de ler dados ou alterar contas. Sessões de acesso são consultadas no Clerk sem expor credenciais ou tokens.
