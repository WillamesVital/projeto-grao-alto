# Grão Alto — E-commerce de Cafés Especiais

Implementação do MVP descrito em `docs/escopo-mvp-grao-alto.md`, com o design
system de `docs/stitch_specialty_coffee_e_commerce/artesanal_moderno/DESIGN.md`.

**Projeto de curso — todo o pagamento (Pix e cartão) é simulado. Não há
integração real com nenhum gateway e nenhuma cobrança é feita.**

## Stack

- Next.js 16 (App Router) + TypeScript + React 19
- Tailwind CSS v4 (tokens de cor/tipografia/espaçamento do design system)
- Prisma + SQLite
- Autenticação própria por sessão (cookie httpOnly + JWT), sem serviço externo
- E-mails (confirmação de cadastro, redefinição de senha, confirmação de
  pedido) só são "enviados" via log no console — não há SMTP configurado
- Pagamento (Pix/Cartão) simulado em `src/lib/payment-gateway.ts`

## Rodando localmente

```bash
npm install
cp .env.example .env      # ajuste se quiser
npm run db:migrate        # cria/atualiza o banco SQLite local
npm run db:seed           # popula produtos, faixas de frete, usuários de teste
npm run dev
```

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
