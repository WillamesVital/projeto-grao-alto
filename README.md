# Grão Alto — E-commerce de Cafés Especiais

Implementação do MVP descrito em `docs/escopo-mvp-grao-alto.md`, com o design
system de `docs/stitch_specialty_coffee_e_commerce/artesanal_moderno/DESIGN.md`.

**Projeto de curso — todo o pagamento (Pix e cartão) é simulado. Não há
integração real com nenhum gateway e nenhuma cobrança é feita.**

## Stack

- Next.js 16 (App Router) + TypeScript + React 19
- Tailwind CSS v4 (tokens de cor/tipografia/espaçamento do design system)
- Prisma + Postgres
- Autenticação própria por sessão (cookie httpOnly + JWT), sem serviço externo
- E-mails (confirmação de cadastro, redefinição de senha, confirmação de
  pedido) só são "enviados" via log no console — não há SMTP configurado
- Pagamento (Pix/Cartão) simulado em `src/lib/payment-gateway.ts`

## Rodando localmente

Requer um Postgres rodando localmente (ou qualquer connection string de um
Postgres gerenciado).

```bash
npm install
cp .env.example .env      # aponte DATABASE_URL para o seu Postgres
npm run db:push           # cria/atualiza as tabelas
npm run db:seed           # popula produtos, faixas de frete, usuários de teste
npm run dev
```

## Deploy na Vercel

1. Importe o repositório na Vercel (framework Next.js é detectado automaticamente).
2. Na aba **Storage** do projeto, crie um banco **Postgres** — a Vercel injeta
   `DATABASE_URL` automaticamente nas variáveis de ambiente.
3. Configure `AUTH_SECRET` (valor aleatório forte, ex: `openssl rand -hex 32`)
   e `APP_URL` (a URL pública do deploy) nas variáveis de ambiente do projeto.
4. O build (`npm run build`) já roda `prisma db push` automaticamente antes do
   `next build`, então as tabelas são criadas no primeiro deploy sem precisar
   de nenhum passo manual de migração.
5. Rode `npm run db:seed` uma vez apontando `DATABASE_URL` para o banco de
   produção (localmente, ou via `vercel env pull` + `npm run db:seed`) para
   criar os produtos e usuários de teste.

**Nota de engenharia:** este projeto usa `prisma db push` em vez de migrations
versionadas, para simplificar o deploy de um projeto de curso — não há
histórico de alterações de schema nem proteção extra contra perda de dados em
mudanças destrutivas de coluna. Para um projeto real, o caminho recomendado é
`prisma migrate deploy` com migrations commitadas.

Abra [http://localhost:3000](http://localhost:3000).

Usuários de teste criados pelo seed (senha `Cafe@1234` para os dois):

- `cliente@exemplo.com` — cliente comum
- `bia@graoalto.com.br` — acessa o Painel da Bia em `/admin`

## Testes

```bash
npm test          # unitários (Vitest) — regras de frete, idempotência, concorrência de estoque
npm run test:e2e  # os 5 caminhos E2E da seção 8 do escopo do MVP (Playwright)
```

## Estrutura

- `docs/` — documentos de negócio e design fornecidos como fonte de verdade
- `prisma/schema.prisma` — modelo de dados (produtos, variantes, carrinho, pedidos, pagamentos)
- `src/lib/` — regras de negócio (frete, carrinho, pedidos, autenticação, gateway simulado)
- `src/actions/` — Server Actions (mutações: cadastro, login, carrinho, checkout, admin)
- `src/app/(shop)` — telas do cliente (catálogo, produto, carrinho, checkout, pedidos)
- `src/app/(auth)` — cadastro, login, recuperação de senha
- `src/app/admin` — Painel da Bia
- `tests/` — testes unitários
- `e2e/` — testes end-to-end
