# Fotos dos profissionais

- Upload opcional no cadastro e na página de edição do profissional. Os avatares da lista são somente para consulta. Sem foto, aparecem as iniciais.
- No cadastro, selecionar e recortar a foto mantém apenas um arquivo e uma prévia locais no navegador. O upload só acontece ao enviar “Adicionar profissional”, depois da validação do formulário. Abandonar o formulário antes do envio não cria arquivos no UploadThing.
- No envio com foto, o servidor associa a foto e cria o profissional na mesma transação do banco. Se essa transação falhar, solicita a exclusão do arquivo no UploadThing. A foto local é preservada para uma nova tentativa.
- PNG ou WEBP, até 1 MB por arquivo. O limite é aplicado antes do recorte no navegador e novamente no servidor.
- Recorte quadrado 1:1, com arraste e zoom. A imagem final é normalizada para 640 × 640 em WEBP, sem metadados.
- A modal usa Nuqs com `?foto=<id-do-profissional>` na edição e `?foto=novo` no cadastro. A abertura adiciona uma entrada no histórico; voltar fecha a modal. Fechar ou confirmar o recorte remove o parâmetro, preservando os outros parâmetros da URL.
- A URL pode reabrir a modal, mas arquivos locais não são serializados nem persistidos nela. Depois de recarregar a página, o usuário seleciona novamente a imagem.
- O servidor decodifica a imagem para validar seu conteúdo; extensão ou MIME declarados não bastam. Imagens animadas e arquivos inválidos são recusados.
- UploadThing é utilizado pela UTApi no servidor. Configure `UPLOADTHING_TOKEN` no ambiente, nunca com prefixo `NEXT_PUBLIC_`. Não é necessário um webhook público para este fluxo.
- Cada upload é registrado em `professional_photos`, com proprietário, estabelecimento, URL e chave do UploadThing. A associação ao profissional exige assinatura ativa e propriedade do estabelecimento. URLs arbitrárias não são aceitas pelo formulário.
- A foto aparece na lista interna e na escolha do profissional durante o agendamento público.
- Há limite de 30 uploads por conta por hora. Na edição, confirmar o recorte também mantém apenas uma prévia local; o envio só ocorre em “Salvar alterações”. Se a persistência falhar, o servidor solicita a remoção do arquivo enviado.
