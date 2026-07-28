# Grão Alto — Escopo do MVP

**Versão:** 1.0
**Relação com os outros documentos:** refina a Parte I do `cenario-e-negocio-grao-alto.md`. O documento de negócio continua valendo como contexto; este define o que vai ser construído.

---

## 1. O princípio

MVP não é versão capenga. É **o menor caminho completo** entre o cliente querer café e o café sair do galpão.

Se um passo do caminho falta, não tem produto. Se um passo tem enfeite, tem desperdício.

**Critério de corte usado:** o cliente do WhatsApp consegue fazer sozinho o que hoje a Bia faz por ele? Se sim, está dentro. Se não muda essa resposta, está fora.

---

## 2. Os 8 fluxos do MVP

```
1. Cadastro ──► 2. Login ──► 3. Buscar / escolher produto
                                        │
                                        ▼
                              4. Carrinho e quantidade
                                        │
                                        ▼
                                 5. Checkout
                                   │  │  │
                    6. Frete ◄─────┘  │  └─────► 7. Pagamento
                                      │
                                      ▼
                              8. Finalizar pedido
```

Nada além disso entra na versão 1.

---

## 3. Dentro e fora do escopo

| Dentro | Fora (fase 2 ou nunca) |
|---|---|
| Cadastro com e-mail e senha | Login social, login por telefone |
| Login e recuperação de senha | Autenticação em dois fatores |
| Lista de produtos com busca simples | Filtro por processo, região, pontuação |
| Página do produto com moagem e peso | Comparador, avaliação, comentário |
| Carrinho com quantidade | Lista de desejos, salvar carrinho |
| Um endereço por pedido | Múltiplos endereços salvos |
| Frete por bairro + Correios | Rastreio em tempo real, roteirização |
| Pix e cartão | Boleto, dinheiro, carteira digital |
| Confirmação por e-mail | App, push, chat no site |
| Estoque simples por SKU | Estoque por lote de torra |
| Cupom | Clube de assinatura, programa de pontos |
| Painel de pedidos para a Bia | ERP, BI, relatório gerencial |

**Simplificação mais pesada:** estoque por lote sai do MVP. O sistema controla quantidade por SKU. A rastreabilidade de lote continua na planilha do Sr. Antônio.

**Isso é dívida consciente, não esquecimento.** Está registrada, tem dono e tem gatilho de revisão: quando passar de 200 pedidos por semana.

> **Aula do M03:** o QA precisa saber o que está fora. Testar o que não existe é a forma mais silenciosa de desperdiçar sprint.

---

## 4. Detalhamento por fluxo

### Fluxo 1 — Cadastro

**Objetivo:** cliente cria conta em menos de 1 minuto.

**Telas:** formulário de cadastro, confirmação de e-mail.

**Campos:** nome, e-mail, senha, telefone, CPF (opcional no cadastro, obrigatório no checkout).

**Regras:**
- E-mail único. Duplicado retorna mensagem clara, com link para login.
- Senha mínima de 8 caracteres.
- Confirmação por e-mail, com link válido por 24h.
- Cliente que já compra por WhatsApp recebe convite com pré-cadastro.

**Riscos:** e-mail de confirmação não chega. Cliente cadastra duas contas. LGPD no aceite.

**O QA testa:** validação de campo, duplicidade, expiração do link, e-mail que não chega, acessibilidade do formulário.

---

### Fluxo 2 — Login

**Objetivo:** entrar e voltar de onde parou.

**Telas:** login, esqueci minha senha, nova senha.

**Regras:**
- Sessão de 30 dias com "continuar conectado".
- 5 tentativas erradas bloqueiam por 15 min.
- Link de redefinição vale 1h e é de uso único.
- Carrinho de visitante se funde ao carrinho da conta no login.

**Riscos:** carrinho perdido no login. Link reutilizado. Bloqueio injusto.

**O QA testa:** fusão de carrinho, expiração de sessão, reuso de link, bloqueio e desbloqueio, logout em outro dispositivo.

---

### Fluxo 3 — Buscar e escolher produto

**Objetivo:** achar o café e entender o que está comprando.

**Telas:** lista de produtos, resultado de busca, página do produto.

**Regras:**
- Busca por nome do rótulo e por nota sensorial. Sem acento e sem diferenciar maiúscula.
- Produto sem estoque aparece, marcado como esgotado, sem botão de compra.
- Página mostra: notas, processo, região, pontuação SCA, **data da última torra**.
- Escolha de peso (250g, 500g, 1kg) e moagem (grão, espresso, coado, prensa) muda preço e SKU.
- Padrão sugerido: 250g, em grão.

**Riscos:** busca sem resultado sem saída. Preço não atualiza ao trocar peso. Cliente não entende moagem.

**O QA testa:** combinação peso × moagem, busca vazia, acento e maiúscula, produto esgotado, preço dinâmico, texto explicativo da moagem.

---

### Fluxo 4 — Carrinho e quantidade

**Objetivo:** ajustar o pedido sem sustos.

**Telas:** carrinho, mini-carrinho no topo.

**Regras:**
- Quantidade de 1 a 10 por item. Acima disso, orienta contato com a loja.
- Alterar quantidade recalcula subtotal na hora.
- Mesmo rótulo com moagem diferente são itens separados.
- Carrinho de visitante dura 7 dias; de logado, 30 dias.
- Preço congela por 30 min no checkout.
- Item que esgotou enquanto estava no carrinho é sinalizado, não removido em silêncio.

**Riscos:** subtotal errado. Quantidade acima do estoque. Item fantasma.

**O QA testa:** cálculo de subtotal, limite de quantidade, estoque que muda, persistência do carrinho, remoção e desfazer.

---

### Fluxo 5 — Checkout

**Objetivo:** uma página, sem etapa escondida.

**Telas:** checkout único com blocos de identificação, entrega, pagamento e resumo.

**Regras:**
- CPF obrigatório aqui, para a nota fiscal.
- Endereço por CEP com preenchimento automático; número e complemento manuais.
- Resumo sempre visível: subtotal, desconto, frete, total.
- Nenhum valor muda depois da confirmação sem avisar.
- Cupom aplicado nesta tela.

**Riscos:** valor final diferente do exibido. Campo obrigatório sem indicação. Abandono por confusão.

**O QA testa:** consistência do resumo, CEP inválido, CPF inválido, cupom, recálculo ao trocar endereço, navegação por teclado.

---

### Fluxo 6 — Cálculo do frete

**Objetivo:** dizer o preço e a data certos.

**Regras — entrega própria:**

| Faixa | Bairros | Frete | Grátis acima de |
|---|---|---|---|
| A | Boa Viagem, Pina, Imbiribeira, Setúbal | R$ 8 | R$ 90 |
| B | Casa Forte, Espinheiro, Graças, Torre, Madalena | R$ 12 | R$ 120 |
| C | Olinda, Jaboatão centro, Camaragibe | R$ 18 | R$ 160 |

- Rota roda terça, quinta e sábado, 14h–19h.
- Pedido pago até 11h entra na rota do mesmo dia.
- **Frete grátis só existe dentro das faixas A, B e C.**

**Regras — fora da área:**
- Cotação por CEP e peso via Correios.
- Sem frete grátis, em nenhum valor.
- Prazo do transportador + 1 dia útil de preparo.

**Regra — retirada na loja:**
- Sem frete. Pronto em 4h úteis. Guardado por 5 dias.

> **Aqui nasce o GA-412.** O frete grátis foi implementado só por valor do pedido. Bairro fora de cobertura recebe frete zero e entra numa rota que não existe.

**Riscos:** frete grátis indevido. Prazo impossível. CEP sem cobertura.

**O QA testa:** tabela de decisão bairro × valor × tipo de entrega, borda exata do valor mínimo, CEP fora da área, pedido às 10h59 e às 11h01, feriado em dia de rota.

---

### Fluxo 7 — Forma de pagamento

**Objetivo:** pagar sem medo.

**Regras:**
- **Pix:** QR e copia e cola, expira em 30 min. Confirmação automática por webhook.
- **Cartão:** à vista ou até 3× sem juros. Mínimo de R$ 40 por parcela.
- Cartão tokenizado. Dado nunca passa pelo servidor da Grão Alto (PCI-DSS).
- Autoriza no fechamento, captura na aprovação.
- Recusa mostra motivo em linguagem de gente, com opção de tentar outra forma.

**Riscos:** cobrança duplicada. Pix pago e não reconhecido. Pedido pago sem estoque.

**O QA testa:** idempotência, webhook duplicado, webhook atrasado, expiração do Pix, recusa de cartão, timeout do gateway com cobrança efetivada.

---

### Fluxo 8 — Finalizar pedido

**Objetivo:** confirmar e não deixar dúvida.

**Telas:** confirmação, meus pedidos, detalhe do pedido.

**Regras:**
- Chave de idempotência obrigatória. **Duplo clique não gera dois pedidos.**
- Baixa de estoque no pagamento confirmado, nunca antes.
- E-mail de confirmação com resumo, prazo e forma de contato.
- Pedido aparece no painel da Bia na hora.
- Status visível: aguardando pagamento, em preparo, pronto, a caminho, entregue.

**Riscos:** pedido duplicado. Estoque negativo. Pedido criado sem aparecer para a operação.

**O QA testa:** duplo clique, concorrência no último item, falha entre pagamento e criação do pedido, e-mail que não sai, sincronia com o painel.

---

## 5. Backlog do MVP

| ID | Épico | Tipo | Título | Prioridade |
|---|---|---|---|---|
| GA-101 | Conta | Story | Cadastro com e-mail e senha | Alta |
| GA-102 | Conta | Story | Confirmação de e-mail | Alta |
| GA-103 | Conta | Story | Login e sessão | Alta |
| GA-104 | Conta | Story | Recuperação de senha | Média |
| GA-105 | Conta | Story | Convite para base do WhatsApp | Média |
| GA-201 | Catálogo | Spike | Modelagem de produto, peso e moagem | Alta |
| GA-202 | Catálogo | Story | Listagem de produtos | Alta |
| GA-203 | Catálogo | Story | Busca por nome e nota sensorial | Média |
| GA-204 | Catálogo | Story | Página do produto | Alta |
| GA-205 | Catálogo | Story | Seleção de peso e moagem | Alta |
| GA-206 | Catálogo | Story | Produto esgotado | Média |
| GA-301 | Carrinho | Story | Adicionar ao carrinho | Alta |
| GA-302 | Carrinho | Story | Alterar quantidade e remover | Alta |
| GA-303 | Carrinho | Story | Persistência e fusão no login | Média |
| GA-401 | Checkout | Story | Página de checkout | Alta |
| GA-402 | Checkout | Story | Endereço por CEP | Alta |
| GA-403 | Checkout | Story | Aplicação de cupom | Baixa |
| GA-405 | Checkout | Story | Cálculo de frete por bairro | Alta |
| GA-406 | Checkout | Story | Retirada na loja | Média |
| GA-407 | Checkout | Story | Pagamento com Pix | Alta |
| GA-408 | Checkout | Story | Pagamento com cartão | Alta |
| GA-409 | Checkout | Tech | Feature flag e rollout por bairro | Média |
| GA-410 | Pedido | Story | Finalizar e confirmar pedido | Alta |
| GA-411 | Pedido | Story | Meus pedidos e status | Média |
| GA-413 | Pedido | Story | Painel de pedidos da Bia | Alta |
| **GA-412** | **Checkout** | **Bug** | **Frete grátis fora da área de entrega** | **S1** |

**26 itens.** Estimativa do time: 5 a 6 sprints.

---

## 6. Mapa de telas

```
                         ┌──────────┐
                         │   Home   │
                         └────┬─────┘
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌──────────────┐ ┌────────────┐ ┌────────────┐
      │   Cadastro   │ │   Lista    │ │   Busca    │
      └──────┬───────┘ └─────┬──────┘ └─────┬──────┘
             ▼               └───────┬───────┘
      ┌──────────────┐               ▼
      │    Login     │      ┌─────────────────┐
      └──────┬───────┘      │ Página produto  │
             │              │ peso + moagem   │
             │              └────────┬────────┘
             │                       ▼
             │              ┌─────────────────┐
             └─────────────►│    Carrinho     │
                            └────────┬────────┘
                                     ▼
                            ┌─────────────────┐
                            │    Checkout     │
                            │ CPF · endereço  │
                            │ frete · pgto    │
                            └────────┬────────┘
                                     ▼
                            ┌─────────────────┐
                            │  Confirmação    │
                            └────────┬────────┘
                                     ▼
                            ┌─────────────────┐
                            │  Meus pedidos   │
                            └─────────────────┘

Fora do fluxo do cliente:  Painel da Bia
```

**11 telas.** Número que cabe num plano de teste de uma página.

---

## 7. Critérios de aceite do MVP

O MVP só vai ao ar quando **todos** estiverem verdes:

- [ ] Um cliente novo compra do zero, sem ajuda
- [ ] Um cliente do WhatsApp compra sem perguntar nada à Bia
- [ ] Pedido para faixa A, B, C e fora da área calcula frete correto
- [ ] Retirada na loja funciona ponta a ponta
- [ ] Pix e cartão confirmam e aparecem no painel
- [ ] Duplo clique não gera pedido duplicado
- [ ] Último item do estoque não vende duas vezes
- [ ] Fluxo completo navegável por teclado e leitor de tela
- [ ] Fluxo completo funciona em Android 8 com 4G ruim
- [ ] Rollback ensaiado pelo menos uma vez
- [ ] Bia treinada no painel

---

## 8. Estratégia de teste do MVP em uma página

| Camada | O que cobre | Quem escreve |
|---|---|---|
| Unitário | Cálculo de frete, preço, quantidade, validação | Ana e Caio |
| Contrato | Gateway, Correios, e-mail | Ana + Léo |
| Integração | Pedido ponta a ponta na API | Ana + Léo |
| E2E automatizado | 5 caminhos críticos, só isso | Léo |
| Exploratório | Toda entrega, com carta de teste | Léo |
| Usabilidade | Tela de moagem e checkout, com 3 clientes reais | Rafa + Léo |
| Carga | 40 pedidos/hora. Uma vez, antes do lançamento | Paulo |

**Os 5 caminhos E2E automatizados:**

1. Cadastro → compra com Pix → entrega faixa A
2. Login → compra com cartão → fora da área
3. Compra com retirada na loja
4. Carrinho com múltiplos itens e moagens diferentes
5. Tentativa de compra de item esgotado

**Por que só 5:** automação custa manutenção. Num time de dois devs, suíte inchada morre na terceira sprint. **Menos testes vivos vale mais que muitos testes ignorados.**

---

## 9. Riscos do MVP

| Risco | Nível | Mitigação |
|---|---|---|
| Frete grátis indevido | Crítico | Tabela de decisão + teste unitário + E2E |
| Cobrança duplicada | Crítico | Idempotência + teste de concorrência |
| Venda sem estoque | Crítico | Baixa transacional + teste de concorrência |
| Cliente do WhatsApp não migrar | Alto | Convite, teste de usabilidade, Bia acompanhando |
| Tereza não entender moagem | Alto | Texto explicativo, padrão sugerido, teste com usuário |
| Prazo antes da alta de julho | Alto | Escopo travado, nada entra sem tirar algo |
| Time sem experiência com QA | Médio | Léo mostrando valor cedo, no discovery |

---

## 10. Mapeamento aula por aula

| Módulos | Fluxo do MVP usado |
|---|---|
| M01–M03 | Visão do MVP inteiro, board, papéis |
| M04–M06 | Discovery dos fluxos 3 e 4. Ambiguidade na moagem |
| M07–M09 | Refinamento do GA-405, tabela de decisão do frete |
| M10–M13 | Contrato do GA-407, PR do frete, integração com gateway |
| M14–M17 | Estratégia da seção 8 construída ao vivo |
| M18–M21 | Pipeline enxuto, rollout por bairro, incidente GA-412 |
| M22–M25 | Comparação com contextos maiores, métricas, atuação |
