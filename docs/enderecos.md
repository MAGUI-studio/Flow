# Endereços dos estabelecimentos

- O cadastro oferece CEP, logradouro, número, complemento, bairro, cidade e UF com React Hook Form e Zod. CEP recebe máscara `00000-000` e UF fica em maiúsculas.
- A consulta ViaCEP ocorre após oito dígitos, com debounce e cancelamento de requisições anteriores. Não consulta a cada tecla incompleta. Dados são editáveis; número e complemento pertencem ao responsável.
- O mapa sempre é exibido. Sem CEP, número e os demais campos obrigatórios do endereço, fica acinzentado, sem interação por mouse, toque ou teclado, e explica como habilitá-lo. A geocodificação só é consultada após completar esses campos. Limpar o número desabilita o mapa, cancela a consulta anterior e remove coordenadas antigas. Locais sem número podem usar S/N.
- A legenda do formulário explica o asterisco vermelho. Complemento é opcional; os demais campos de endereço são obrigatórios quando um endereço presencial é informado. Contato e bio continuam opcionais.
- CEP inexistente ou indisponibilidade do serviço apresentam uma mensagem e permitem preenchimento manual. CEPs genéricos podem exigir rua e bairro manuais.
- Endereço é opcional para atendimento online. Quando informado, exige CEP válido no formato, logradouro, número (ou S/N), bairro, cidade e UF brasileira. A consulta não garante a existência do número informado.
- `establishments.address_details` preserva os campos estruturados em JSONB. `address` e `city` continuam preenchidos pelo servidor para compatibilidade com catálogo e busca. Registros antigos continuam válidos.
- Após completar o endereço, o formulário consulta `/api/geocode` com debounce de 1,2s. A rota exige assinatura ativa, limita consultas por usuário e utiliza Photon com cache de 24h. `PHOTON_URL` permite trocar a instância. O serviço público é destinado a uso moderado e não tem garantia de disponibilidade; dimensionar ou contratar uma instância conforme o tráfego crescer.
- As sugestões são aproximações. O responsável confere o mapa Leaflet/OpenStreetMap, visualiza o melhor resultado, arrasta o marcador ou clica no mapa para ajustar o ponto. A sugestão ou o ajuste atual fica no formulário e é salvo em `address_details.location` ao criar o estabelecimento, sem confirmação extra. Alterações no endereço invalidam a posição anterior e iniciam uma nova busca. Ajustes manuais não são sobrescritos por buscas em andamento. Nunca representar o centro do CEP como se fosse a porta do estabelecimento.
- A página pública exibe o mapa somente quando há coordenadas salvas. Registros anteriores mantêm o endereço textual. `NEXT_PUBLIC_MAP_TILES_URL` permite configurar outro serviço de tiles. O mapa mantém atribuição e não faz pré-carregamento offline ou download em massa. Não há integração com Nominatim público.

Referência: https://viacep.com.br/

Mapa e geocodificação: https://photon.komoot.io/ · https://operations.osmfoundation.org/policies/tiles/
