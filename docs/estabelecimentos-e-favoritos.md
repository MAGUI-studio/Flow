# Apresentação e favoritos

O cadastro e a edição em `/painel/estabelecimentos` permitem informar site, Instagram, WhatsApp e uma imagem de capa. O endereço público permanece estável ao editar o nome.

O banner é recortado em 8:3 e preparado como WEBP de 1600 × 600. Confirmar o recorte gera apenas um preview local, sem enviar arquivos nem alterar o banco. O upload pelo UploadThing e o vínculo ao estabelecimento acontecem somente ao salvar o formulário validado, tanto no cadastro quanto na edição. Recarregar ou sair sem salvar descarta o preview. O servidor valida a imagem, normaliza o arquivo e verifica a assinatura. Cada imagem pertence à conta que a enviou; outra conta não pode vinculá-la ao seu estabelecimento. A remoção também só é persistida ao salvar o formulário.

A mesma imagem aparece nos cards públicos e na página do estabelecimento, com enquadramento central adaptado a cada espaço. Site, Instagram e WhatsApp aparecem como links de contato na apresentação.

Usuários autenticados podem salvar e remover estabelecimentos pelo coração nos cards e na página pública. `/api/favorites` usa a identidade da sessão, com operações idempotentes e uma chave única por conta e estabelecimento. Salvar não exige assinatura. Estabelecimentos indisponíveis não podem ser adicionados nem aparecem na lista pública de favoritos, mas podem ser removidos da lista.

A página `/favoritos` exige login e está disponível na sidebar e no menu da conta. O menu também oferece atalhos para agendamentos, exploração e painel do negócio. Os novos ícones usam `@phosphor-icons/react`.

Aplicar alterações de banco com `npm run db:migrate` e gerar o cliente com `npm run db:generate`. `npm run test:db` inclui os testes de isolamento de contas, propriedade das imagens, limites do plano e persistência dos favoritos em um schema isolado.
