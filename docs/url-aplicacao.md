# URL pública do Flow

- Configure `NEXT_PUBLIC_APP_URL` no arquivo de ambiente. No desenvolvimento local: `http://localhost:3000`. Em produção, use o domínio definitivo com HTTPS.
- `src/lib/app-url.ts` centraliza a URL base, sua apresentação sem protocolo e os links públicos dos estabelecimentos. Remove barras finais para evitar caminhos duplicados.
- Campos de slug, preview do cadastro, card de compartilhamento e URLs de retorno da assinatura usam a configuração. Links internos relativos continuam funcionando no host atual.
- A variável é pública e utilizada também por componentes do navegador. Ao alterá-la, reinicie o servidor de desenvolvimento; em produção, gere uma nova build com a configuração desejada.
- `.env.example` documenta a variável. `.env.local` permanece fora do Git.
