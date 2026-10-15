# Busca por mapa

- `/explorar` combina lista paginada de oito cards e mapa Leaflet/OpenStreetMap abaixo da lista. A landing mantém seus cards sem mapa.
- O catálogo público fornece coordenadas validadas, sem dados privados. Estabelecimentos exclusivamente online ou sem coordenadas permanecem na lista, mas não recebem pins inventados.
- Pins usam todos os estabelecimentos compatíveis com os filtros textuais, categoria e modalidade, independentemente da página de cards. A proximidade visual em pixels agrupa pins; o zoom recalcula os grupos. Grupos clicáveis aproximam o mapa e mostram os estabelecimentos; pins individuais mostram nome, categoria, cidade, nota e link para agendar.
- Hover ou foco em um card destaca seu pin ou grupo. Hover em um pin destaca o card correspondente, quando ele está na página atual. O selo dos melhores continua usando o ranking global.
- Mover o mapa não muda imediatamente os resultados. “Buscar nesta área” aplica os limites visíveis à lista, reinicia a paginação e salva `area=south,west,north,east` via Nuqs. Os filtros continuam aplicados. A lista por área inclui somente locais com coordenadas na região; a ação “Ver todas as regiões” remove a restrição.
- Limites inválidos na URL são ignorados. Links compartilhados e navegação do histórico restauram a região. Trocar a cidade ou selecionar modalidade online remove a restrição geográfica anterior.
- Pins individuais reutilizam `BusinessMonogram` com sigla e asterisco, ou o logo cadastrado, sobre a cor do estabelecimento. Agrupamentos continuam mostrando a quantidade de locais.
- O mapa ocupa toda a largura abaixo da lista e da paginação, em todas as telas. Mantém atribuição OSM e usa o mesmo provedor de tiles configurável dos outros mapas.
