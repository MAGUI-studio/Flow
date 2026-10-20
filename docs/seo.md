# SEO do Flow

As páginas públicas são indexáveis sem variável de ativação. O domínio canônico vem de `NEXT_PUBLIC_APP_URL`; na Vercel deve ser `https://flow.magui.studio`.

Cada página tem título e descrição próprios. `pageMetadata` centraliza título, descrição, canonical, Open Graph e Twitter Cards. O nome da marca aparece uma única vez no título. Os perfis públicos usam nome, cidade ou modalidade online, bio e banner do estabelecimento. A consulta do perfil é compartilhada entre conteúdo e metadados com React `cache`.

Painel, conta do cliente, favoritos, login, cadastro e etapas de assinatura têm `noindex, nofollow`, sem canonical público herdado. Os nomes das rotas existentes foram preservados para manter links e integrações: `/explorar`, `/agendamentos`, `/favoritos`, `/painel/...` e os slugs dos estabelecimentos.

`/robots.txt` declara `/sitemap.xml` e restringe APIs. As rotas privadas não são bloqueadas em robots para que crawlers consigam observar `noindex`; autenticação continua obrigatória. O sitemap é dinâmico e contém somente início, exploração e estabelecimentos ativos de assinantes com acesso vigente. Não usa datas de atualização inventadas nem inclui URLs com filtros, checkout ou sessões de pagamento.

`/opengraph-image` produz uma imagem PNG 1200×630 da marca. Perfis com banner definem também sua imagem específica nos metadados. A home informa o tipo `WebSite` em JSON-LD; perfis identificam `LocalBusiness` ou `Organization`, com nome, apresentação, URL, imagem e localização quando disponíveis. Não são publicadas avaliações inventadas ou valores de notas sem avaliação real. Conteúdo fornecido pelos usuários é escapado antes de inserir JSON-LD no HTML.

Validação local:

```powershell
npm run typecheck
npx tsx --test tests/seo.test.ts
npx tsx scripts/verify-seo.ts
```

O teste HTTP usa o servidor local e confere títulos, descrições, canonical, tags sociais, indexação, sitemap, robots e a imagem de compartilhamento. A URL alternativa pode ser informada por `SEO_VERIFY_URL` ao executar o teste; essa variável só configura o script de verificação, não a indexação do app.

Após publicar, cadastrar a propriedade no Google Search Console e enviar `https://flow.magui.studio/sitemap.xml`. Isso exige acesso à propriedade do domínio e não é realizado automaticamente pelo código. Metadados corretos não garantem posição nem prazo de indexação; o buscador pode reescrever o título ou a descrição dos resultados.

Referências: [metadados e SEO no Google](https://developers.google.com/search/docs/fundamentals/get-started-developers), [canonical e JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
