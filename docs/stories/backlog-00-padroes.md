# Backlog do MVP — Padrões e Definições Globais

**Documento 00 de 5.** Leia antes dos demais.
**Cenário:** Grão Alto — e-commerce de café especial, Recife.

---

## 1. Como cada história está escrita

Toda história do backlog segue esta estrutura:

| Seção | O que traz |
|---|---|
| **Cabeçalho** | ID, épico, tipo, prioridade, estimativa |
| **Contexto de negócio** | Por que isso existe. O custo de não ter |
| **História** | Como quem, quero o quê, para quê |
| **Regras de negócio** | Numeradas, com valores exatos |
| **Critérios de aceite** | Dado / Quando / Então, com exemplo concreto |
| **Cenários de erro** | O que acontece quando dá errado |
| **Fora de escopo** | O que essa história não faz |
| **DoD específico** | Além do DoD global |
| **Notas para QA** | Risco, borda, dado de teste |

**Por que "Contexto de negócio" vem primeiro:** história sem o porquê vira especificação. Especificação a gente cumpre ao pé da letra e entrega a coisa errada com precisão.

---

## 2. Definition of Ready

Nenhum card entra em desenvolvimento sem todos os itens marcados.

- [ ] Problema do cliente descrito, não a solução
- [ ] Critérios de aceite com exemplo numérico concreto
- [ ] Cenários de erro mapeados
- [ ] Protótipo aprovado, quando tem tela
- [ ] Contrato de API definido, quando tem integração
- [ ] Massa de teste identificada
- [ ] Risco classificado
- [ ] **Regra confirmada com Bia ou Sr. Antônio**

O último item é específico da Grão Alto. O conhecimento da operação mora nas pessoas, não no documento. Enquanto não estiver escrito, precisa ser confirmado na fonte.

---

## 3. Definition of Done — global

Vale para **todas** as histórias. Não se repete nos cards.

**Código**
- [ ] Revisado por outra pessoa e mergeado na main
- [ ] Sem `TODO` ou código morto introduzido
- [ ] Log estruturado nos pontos de decisão relevantes

**Teste**
- [ ] Teste unitário nas regras de cálculo e validação
- [ ] Teste de integração quando cruza contexto ou serviço externo
- [ ] Todos os critérios de aceite validados
- [ ] Teste exploratório executado, com carta de teste registrada
- [ ] Regressão da área afetada rodada
- [ ] Pipeline verde

**Produto**
- [ ] Texto de tela revisado por Marina
- [ ] Estado de carregamento, vazio e erro implementados
- [ ] Navegável por teclado, com foco visível
- [ ] Contraste mínimo 4.5:1 em texto
- [ ] Funciona em Android 8 e iOS 14
- [ ] Funciona em 4G instável

**Entrega**
- [ ] Feature flag configurada, quando aplicável
- [ ] Métrica ou log que permita observar a funcionalidade em produção
- [ ] Plano de rollback conhecido
- [ ] Validado em produção após o deploy

**Operação**
- [ ] Bia informada da mudança, e treinada quando o painel muda
- [ ] Documentação da regra atualizada neste backlog

> **Nota de método:** este DoD tem 24 itens e parece exagerado para um time de dois devs. Não é. Ele existe porque o time não tinha nenhum. A regra é revisar o DoD a cada 3 sprints e **remover** o que virou burocracia. DoD que só cresce é DoD que ninguém lê.

---

## 4. Escala de severidade

| Sev. | Definição | Exemplo na Grão Alto | SLA |
|---|---|---|---|
| **S1** | Perda financeira, checkout fora do ar, pedido impossível de entregar | Frete grátis para bairro sem rota | Imediato |
| **S2** | Função principal quebrada, sem contorno | Não dá para escolher moagem | 24h |
| **S3** | Falha com contorno viável | Busca não acha com acento | Próxima sprint |
| **S4** | Cosmético, texto, alinhamento | Botão desalinhado no mobile | Backlog |

---

## 5. Convenções

| Item | Convenção |
|---|---|
| Moeda | Real, duas casas. Arredondamento comercial na exibição, cálculo em centavos inteiros |
| Data e hora | Fuso `America/Recife` (UTC−3, sem horário de verão) |
| CEP | 8 dígitos, sem máscara no banco |
| CPF | 11 dígitos, sem máscara no banco. Validado por dígito verificador |
| Peso | Gramas, inteiro |
| Identificador de pedido | `GA` + ano + sequencial de 5 dígitos. Ex.: `GA202600431` |
| Idempotência | UUID v4 gerado no cliente, válido por 24h |
| Mensagem de erro | Português claro, sem código técnico, com o que fazer em seguida |

---

## 6. Prioridade

| Nível | Significado |
|---|---|
| **Alta** | Sem isso não existe MVP |
| **Média** | Reduz atendimento manual, mas dá para lançar sem |
| **Baixa** | Entra se sobrar espaço |

---

## 7. Índice do backlog

| Documento | Épico | Histórias |
|---|---|---|
| 01 | Conta | GA-101 a GA-105 |
| 02 | Catálogo | GA-201 a GA-206 |
| 03 | Carrinho | GA-301 a GA-303 |
| 04 | Checkout | GA-401 a GA-409, GA-412 |
| 05 | Pedido | GA-410, GA-411, GA-413 |

**26 histórias.** Estimativa do time: 5 a 6 sprints.

---

## 8. Referência cruzada com as regras de negócio

As regras numeradas `RN-xx` estão no documento `cenario-e-negocio-grao-alto.md`, seção 20. Quando uma história cita `RN-06`, é a regra de entrega própria por faixa de bairro.

Quando uma história **contradiz** uma RN, a RN vence — e a contradição vira item de refinamento, não decisão do dev.
