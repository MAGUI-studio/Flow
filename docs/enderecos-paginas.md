# Endereço público da página

- No cadastro, o slug é gerado pelo nome, sem acentos, em minúsculas e com hífens. Nomes curtos ou reservados recebem o sufixo `-espaco`; o limite é 70 caracteres.
- O campo permanece somente leitura enquanto o endereço automático estiver disponível. Mudar o nome reinicia o endereço automático e bloqueia novamente a edição até verificar a colisão.
- Quando o endereço automático já pertence a um estabelecimento, a edição é liberada. O endereço escolhido é verificado com debounce, cancelamento de respostas antigas e mensagens de disponibilidade.
- `/api/establishment-slug` requer autenticação e retorna apenas disponibilidade, sem dados do proprietário. Registros congelados ou inativos também reservam o slug.
- O formulário verifica antes de salvar. `/api/manage` só permite uma alternativa ao slug automático quando este já está ocupado; a restrição única do banco evita duplicações em concorrência.
- Seeds usam a função de domínio diretamente para preservar seus endereços históricos.
