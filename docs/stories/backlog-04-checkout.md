# Backlog 04 — Épico Checkout

**GA-401 a GA-409 e GA-412.** Página de checkout, endereço, cupom, frete, retirada, pagamento, rollout e o bug demonstrativo do curso.

> **Nota:** o antigo GA-404 foi absorvido pelo GA-401. A numeração foi mantida para não invalidar referências dos módulos já escritos.

---

## GA-401 — Página de checkout

| | |
|---|---|
| **Épico** | Checkout |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 8 pontos |

### Contexto de negócio

É a tela que decide se o projeto deu certo. Todo o resto existe para trazer o cliente até aqui.

Hoje esse momento é uma conversa: a Bia soma, informa o frete, manda o Pix, espera o comprovante. Leva de 6 a 10 minutos, e depende dela estar disponível.

**Meta:** o cliente conclui sozinho, em menos de 2 minutos, sem falar com ninguém.

### História

> Como cliente com o carrinho pronto,
> quero informar entrega e pagamento numa página só,
> para concluir a compra rápido e sem me perder.

### Regras de negócio

**RN-401.1** Página única, com quatro blocos: identificação, entrega, pagamento e resumo.
**RN-401.2** O resumo fica sempre visível: subtotal, desconto, frete e total.
**RN-401.3** CPF é obrigatório aqui, para a nota fiscal (RN-13).
**RN-401.4** Login obrigatório para concluir. Visitante pode preencher e é solicitado a entrar no final.
**RN-401.5** Conta não confirmada não conclui o pedido (RN-102.5).
**RN-401.6** O botão de finalizar só habilita com todos os blocos válidos.
**RN-401.7** Nenhum valor pode mudar entre a exibição do resumo e a confirmação sem aviso explícito.
**RN-401.8** Preço congelado por 30 minutos. Expirado, revalida e avisa antes de qualquer cobrança.
**RN-401.9** Disponibilidade de estoque é reverificada ao carregar o checkout e novamente ao finalizar.
**RN-401.10** Endereço da conta vem pré-preenchido, editável.

### Critérios de aceite

**CA-1 — Checkout completo**
> **Dado** que tenho 2 itens no carrinho, estou logado e com o endereço cadastrado
> **Quando** abro o checkout
> **Então** vejo meus dados, o endereço preenchido, o frete já calculado e o resumo com subtotal, frete e total
> **E** só preciso escolher a forma de pagamento

**CA-2 — Resumo consistente**
> **Dado** que o subtotal é R$ 104,00, o desconto R$ 0,00 e o frete R$ 8,00
> **Quando** olho o resumo
> **Então** o total exibido é R$ 112,00
> **E** o mesmo valor aparece no botão de finalizar

**CA-3 — CPF obrigatório**
> **Dado** que minha conta não tem CPF
> **Quando** abro o checkout
> **Então** o campo CPF aparece em branco e obrigatório
> **E** o botão de finalizar fica desabilitado até o CPF ser válido
> **E** CPF inválido mostra "Confira o CPF digitado."

**CA-4 — Visitante no checkout**
> **Dado** que não estou logado
> **Quando** preencho o checkout e clico em finalizar
> **Então** vejo a tela de login ou cadastro
> **E** após entrar, volto ao checkout com tudo preenchido (ver GA-303, CA-6)

**CA-5 — Preço expirado**
> **Dado** que meu carrinho tem 35 minutos
> **Quando** abro o checkout
> **Então** os preços são revalidados
> **E** havendo mudança, vejo "O preço de Serra Azul mudou de R$ 48,00 para R$ 52,00"
> **E** preciso aceitar antes de continuar

**CA-6 — Item esgotado no checkout**
> **Dado** que um item do carrinho esgotou
> **Quando** abro o checkout
> **Então** vejo o item marcado como indisponível
> **E** o botão de finalizar fica bloqueado até eu removê-lo

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Falha ao calcular frete | Resumo mostra "Não foi possível calcular o frete" e bloqueia a conclusão. **Nunca assume frete zero** |
| Sessão expira no checkout | Login, retorno ao checkout com os dados preservados |
| Falha ao carregar a página | Erro com opção de tentar de novo, sem perder o carrinho |
| Cliente com CPF já usado por outra conta | Permitido. CPF não é chave única de conta |

### Fora de escopo

- Checkout em etapas
- Compra sem cadastro
- Endereços salvos múltiplos
- Embalagem para presente

### DoD específico

- [ ] Fluxo inteiro navegável por teclado, com foco visível
- [ ] Cada erro de campo associado ao campo por `aria-describedby`
- [ ] Total recalculado apenas no servidor. **O cliente nunca envia o valor a pagar**
- [ ] Nenhum caminho permite finalizar com frete não calculado
- [ ] Tempo até o primeiro conteúdo abaixo de 2s no p95 em 4G

### Notas para QA

**Riscos:** total divergente entre resumo e cobrança, frete assumido como zero em falha, conclusão sem estoque, valor manipulado pelo cliente.

**Bordas:** carrinho com 29 e 31 minutos; sessão expirando entre o clique e a resposta; item esgotando entre o carregamento e o clique; CPF com dígito verificador inválido; alterar o carrinho em outra aba durante o checkout.

**Teste de segurança mínimo:** alterar o valor total na requisição e confirmar que o servidor recalcula e recusa. **Isso não é paranoia — é o teste que separa checkout de formulário.**

---

## GA-402 — Endereço por CEP

| | |
|---|---|
| **Épico** | Checkout |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 5 pontos |

### Contexto de negócio

O CEP determina **tudo** que vem depois: se tem entrega própria, qual faixa, quanto custa o frete e quando chega.

E é o campo que a Tereza erra. Digitar errado aqui não gera erro de sistema — gera entrega no endereço errado, prejuízo e um cliente sem café.

### História

> Como cliente,
> quero informar meu CEP e ter o endereço preenchido,
> para não digitar tudo e não errar.

### Regras de negócio

**RN-402.1** CEP com 8 dígitos dispara a busca automaticamente.
**RN-402.2** Retorno preenche logradouro, bairro, cidade e estado, em campos bloqueados para edição.
**RN-402.3** Número e complemento são sempre manuais.
**RN-402.4** Número é obrigatório. "Sem número" é uma opção explícita.
**RN-402.5** O bairro retornado determina a faixa de entrega (RN-06). **É o bairro que manda, não o CEP.**
**RN-402.6** Bairro fora das faixas A, B e C recai na cotação de envio externo (GA-405).
**RN-402.7** Alterar o CEP limpa o frete calculado e força novo cálculo.
**RN-402.8** O endereço é salvo na conta ao concluir o pedido, substituindo o anterior.
**RN-402.9** Ponto de referência é campo opcional e vai para a expedição. Entrega própria em Recife depende disso na prática.

### Critérios de aceite

**CA-1 — CEP válido de faixa A**
> **Dado** que informo o CEP 51020-000
> **Quando** os 8 dígitos são completados
> **Então** o endereço é preenchido com Boa Viagem, Recife, PE
> **E** o foco vai automaticamente para o campo Número
> **E** o frete é calculado como faixa A

**CA-2 — CEP não encontrado**
> **Dado** que informo um CEP inexistente
> **Quando** a busca não retorna
> **Então** vejo "Não encontramos esse CEP. Confira ou preencha o endereço manualmente."
> **E** os campos ficam liberados para digitação

**CA-3 — CEP fora da área de entrega própria**
> **Dado** que informo um CEP de Petrolina
> **Quando** o endereço é preenchido
> **Então** vejo "Entregamos aí pelos Correios"
> **E** o frete é cotado por peso e distância
> **E** **não** aparece nenhuma menção a frete grátis

**CA-4 — Número obrigatório**
> **Dado** que preenchi o CEP e deixei o número em branco
> **Quando** tento avançar
> **Então** vejo "Informe o número ou marque 'sem número'."

**CA-5 — Troca de CEP**
> **Dado** que já calculei o frete para Boa Viagem
> **Quando** troco o CEP para um de Olinda
> **Então** o frete anterior é descartado
> **E** o novo frete é calculado como faixa C
> **E** o resumo é atualizado antes de eu poder finalizar

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Serviço de CEP indisponível | Campos liberados para preenchimento manual, com aviso. Bairro digitado passa a definir a faixa |
| CEP com formato inválido | Máscara impede. Colar texto sujo é sanitizado |
| Bairro com grafia divergente do cadastro | Normalização sem acento e sem caixa. Não reconhecido cai em envio externo, e o caso é logado para revisão |

### Fora de escopo

- Autocompletar por endereço digitado
- Mapa para escolher o ponto
- Validação de existência do número

### DoD específico

- [ ] Normalização de bairro coberta por teste unitário, com as variações reais das três faixas
- [ ] Caso de serviço de CEP fora do ar testado
- [ ] Campos preenchidos automaticamente anunciados para leitor de tela
- [ ] Nenhum bairro não reconhecido resulta em frete grátis

### Notas para QA

**Riscos:** bairro não reconhecido caindo na faixa errada, frete calculado para o CEP antigo, endereço incompleto chegando à expedição.

**Bordas:** "Boa viagem", "BOA VIAGEM" e "Boa Viágem"; CEP de Jaboatão que não é o centro; CEP genérico de cidade; trocar o CEP três vezes seguidas; colar o CEP com hífen e com espaço.

**A RN-402.5 é a raiz do GA-412.** A faixa vem do bairro, e o bairro vem de um serviço externo com grafia inconsistente. **Onde há normalização de texto, há bug de regra de negócio.**

---

## GA-403 — Aplicação de cupom

| | |
|---|---|
| **Épico** | Checkout |
| **Tipo** | Story |
| **Prioridade** | Baixa |
| **Estimativa** | 5 pontos |

### Contexto de negócio

A Grão Alto usa cupom em três situações: divulgação com parceiros, recuperação de cliente parado e compensação por erro da loja.

Hoje o desconto é dado à mão pela Bia, sem controle de uso. Já aconteceu de um cupom circular em grupo de WhatsApp e ser usado 40 vezes.

### História

> Como cliente com um cupom,
> quero aplicá-lo antes de pagar,
> para ver o desconto refletido no total.

### Regras de negócio

**RN-403.1** Um cupom por pedido. **Não existe acúmulo no MVP.**
**RN-403.2** Tipos: percentual sobre o subtotal, valor fixo, ou frete grátis.
**RN-403.3** Percentual incide **apenas sobre o subtotal de produtos**. Nunca sobre o frete.
**RN-403.4** O cupom precisa estar ativo, dentro da vigência e dentro dos limites de uso total e por cliente.
**RN-403.5** Cupom com valor mínimo de pedido só se aplica se o subtotal alcançar o mínimo.
**RN-403.6** O desconto do cupom **é aplicado antes** da verificação de frete grátis progressivo (RN-05 do documento de negócio). O valor considerado para o frete grátis é o subtotal já com desconto.
**RN-403.7** Cupom do tipo frete grátis **só vale onde existe entrega própria**. Fora das faixas A, B e C, é recusado com mensagem clara.
**RN-403.8** Remover itens que derrubem o subtotal abaixo do mínimo remove o cupom automaticamente, com aviso.
**RN-403.9** O uso é contabilizado apenas no pedido **pago**, nunca na aplicação.
**RN-403.10** Código de cupom não diferencia maiúscula de minúscula.

### Critérios de aceite

**CA-1 — Cupom percentual**
> **Dado** que o subtotal é R$ 200,00 e o frete R$ 12,00
> **Quando** aplico o cupom CAFE10, de 10%
> **Então** o desconto é R$ 20,00
> **E** o frete continua R$ 12,00
> **E** o total é R$ 192,00

**CA-2 — Cupom derruba o frete grátis**
> **Dado** que estou na faixa B, cujo mínimo para frete grátis é R$ 120,00
> **E** meu subtotal é R$ 130,00
> **Quando** aplico um cupom de 20%
> **Então** o subtotal com desconto passa a R$ 104,00
> **E** **o frete de R$ 12,00 volta a ser cobrado**
> **E** vejo "Com o desconto, o pedido ficou abaixo de R$ 120,00 e o frete voltou a ser cobrado."

**CA-3 — Cupom de frete grátis fora da área**
> **Dado** que meu CEP é de Petrolina
> **Quando** aplico um cupom de frete grátis
> **Então** vejo "Esse cupom vale só para entregas em Recife e região."
> **E** o cupom não é aplicado
> **E** o frete permanece o cotado

**CA-4 — Cupom expirado**
> **Dado** que o cupom venceu ontem
> **Quando** tento aplicar
> **Então** vejo "Esse cupom não está mais válido."

**CA-5 — Cupom já usado pelo cliente**
> **Dado** que o cupom PRIMEIRA vale uma vez por cliente
> **E** já usei em um pedido pago
> **Quando** tento usar de novo
> **Então** vejo "Você já usou esse cupom."

**CA-6 — Remoção automática**
> **Dado** que apliquei um cupom com mínimo de R$ 150,00
> **Quando** removo um item e o subtotal cai para R$ 120,00
> **Então** o cupom é removido
> **E** vejo "Removemos o cupom: o pedido ficou abaixo de R$ 150,00."
> **E** o total é recalculado sem o desconto

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Cupom inexistente | "Cupom não encontrado. Confira o código." |
| Limite total esgotado | "Esse cupom já atingiu o limite de usos." |
| Cupom aplicado e pedido não pago | Uso **não** é contabilizado. Cupom continua disponível |
| Dois pedidos simultâneos com o último uso do cupom | Só um contabiliza. O outro recebe erro no fechamento, antes da cobrança |

### Fora de escopo

- Cupom acumulativo
- Cupom por categoria ou por rótulo
- Cupom automático por primeira compra sem código
- Cashback

### DoD específico

- [ ] Ordem de cálculo (desconto → frete grátis) coberta por teste unitário
- [ ] CA-2 explicitamente testado. É contraintuitivo e será questionado
- [ ] Contagem de uso testada sob concorrência
- [ ] Mensagens de recusa revisadas por Marina

### Notas para QA

**Riscos:** desconto incidindo sobre o frete, cupom de frete grátis fora da área, cupom contado sem pagamento, acúmulo indevido.

**Bordas:** subtotal exatamente no mínimo do cupom; desconto que deixa o subtotal em R$ 0,01; cupom de valor fixo maior que o subtotal — **o total nunca pode ficar negativo**; cupom aplicado e CEP trocado em seguida; caixa alta e baixa no código.

**A RN-403.6 é a regra mais perigosa do épico.** A ordem entre aplicar desconto e verificar frete grátis muda o valor final. Implementada ao contrário, gera frete grátis indevido — que é exatamente a família do GA-412.

---

## GA-405 — Cálculo de frete por bairro

| | |
|---|---|
| **Épico** | Checkout |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 8 pontos |

### Contexto de negócio

Metade das mensagens que a Bia responde é sobre frete. É a história que mais reduz atendimento manual.

Também é a de **maior risco financeiro do MVP**. A Grão Alto tem 42% de margem no café e o frete próprio custa entre R$ 8 e R$ 18. Um frete zerado indevidamente come quase metade do lucro do pedido. Uma entrega prometida onde não há rota custa mais que o pedido inteiro.

### História

> Como cliente,
> quero saber quanto custa e quando chega a entrega no meu endereço,
> para decidir antes de pagar.

### Regras de negócio

**RN-405.1** Três faixas de entrega própria:

| Faixa | Bairros | Frete | Grátis a partir de |
|---|---|---|---|
| A | Boa Viagem, Pina, Imbiribeira, Setúbal | R$ 8,00 | R$ 90,00 |
| B | Casa Forte, Espinheiro, Graças, Torre, Madalena | R$ 12,00 | R$ 120,00 |
| C | Olinda, Jaboatão centro, Camaragibe | R$ 18,00 | R$ 160,00 |

**RN-405.2** **Frete grátis existe apenas dentro das faixas A, B e C.** Fora delas, nunca, em nenhum valor.
**RN-405.3** O valor comparado com o mínimo é o **subtotal de produtos após o desconto do cupom** (RN-403.6). Nunca o total com frete.
**RN-405.4** A rota própria roda terça, quinta e sábado, das 14h às 19h.
**RN-405.5** Pedido pago até as 11h de um dia de rota entra na rota do mesmo dia. Depois disso, vai para a próxima.
**RN-405.6** Feriado em dia de rota cancela a rota. A entrega vai para o próximo dia útil de rota.
**RN-405.7** Fora das faixas, cotação via Correios por peso e CEP, sem frete grátis (GA-405b, coberto aqui).
**RN-405.8** O prazo exibido para envio externo é o do transportador mais 1 dia útil de preparo.
**RN-405.9** Falha no cálculo **bloqueia** a conclusão. Nunca assume zero.
**RN-405.10** O peso do pedido é a soma dos pesos dos itens mais 80g de embalagem por pedido.

### Critérios de aceite

**CA-1 — Faixa A, abaixo do mínimo**
> **Dado** que meu bairro é Boa Viagem e o subtotal é R$ 85,00
> **Quando** o frete é calculado
> **Então** o frete é R$ 8,00
> **E** vejo "Faltam R$ 5,00 para o frete grátis"

**CA-2 — Faixa A, no mínimo exato**
> **Dado** que meu bairro é Boa Viagem e o subtotal é exatamente R$ 90,00
> **Quando** o frete é calculado
> **Então** o frete é R$ 0,00
> **E** vejo "Frete grátis"

**CA-3 — Faixa B, acima do mínimo da faixa A**
> **Dado** que meu bairro é Casa Forte e o subtotal é R$ 100,00
> **Quando** o frete é calculado
> **Então** o frete é R$ 12,00
> **E** vejo "Faltam R$ 20,00 para o frete grátis"
> **E** o mínimo da faixa A **não** se aplica

**CA-4 — Fora da área, valor alto**
> **Dado** que meu bairro é em Petrolina e o subtotal é R$ 400,00
> **Quando** o frete é calculado
> **Então** o frete é o cotado pelos Correios
> **E** **não** há frete grátis
> **E** não aparece nenhuma mensagem sobre valor mínimo

**CA-5 — Corte das 11h**
> **Dado** que hoje é terça e são 10h58
> **Quando** o pedido é pago
> **Então** vejo "Chega hoje, entre 14h e 19h"
> **E** o mesmo pedido pago às 11h01 mostra "Chega quinta, entre 14h e 19h"

**CA-6 — Feriado em dia de rota**
> **Dado** que a próxima terça é feriado
> **Quando** o frete é calculado numa segunda
> **Então** a previsão pula para quinta

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Correios fora do ar | Usa tabela fixa em cache, marcada como estimativa |
| Cache de tabela vencido e Correios fora | Bloqueia a conclusão com "Não conseguimos calcular o frete agora" |
| Bairro não reconhecido | Cai em envio externo. **Nunca em faixa nenhuma com frete grátis** |
| Peso acima do limite do transportador | Divide em mais de um volume, ou orienta contato com a loja |

### Fora de escopo

- Escolha entre modalidades de envio
- Entrega expressa
- Rastreio em tempo real
- Agendamento de janela pelo cliente

### DoD específico

- [ ] Tabela de decisão bairro × subtotal × tipo de entrega coberta por teste unitário, incluindo as bordas exatas
- [ ] Nenhum caminho de código aplica frete grátis fora das faixas A, B e C
- [ ] Cálculo de corte de horário testado com relógio controlável
- [ ] Calendário de feriados de Recife carregado e testado
- [ ] Falha de cotação bloqueia a conclusão, verificado em teste de integração

### Notas para QA

**Riscos:** frete grátis fora da área, mínimo da faixa errada aplicado, corte de horário errado, frete zero assumido em falha.

**Bordas:** subtotal de R$ 89,99, R$ 90,00 e R$ 90,01 em cada faixa; 10h59, 11h00 e 11h01; véspera de feriado; bairro com grafia divergente; pedido com desconto que cruza o mínimo para baixo.

**Tabela de decisão mínima:** 3 faixas × 3 posições em relação ao mínimo (abaixo, igual, acima) × 2 situações de cupom = **18 casos**, mais 3 casos fora da área. **Este é o exemplo trabalhado ao vivo no M08.**

---

## GA-406 — Retirada na loja

| | |
|---|---|
| **Épico** | Checkout |
| **Tipo** | Story |
| **Prioridade** | Média |
| **Estimativa** | 5 pontos |

### Contexto de negócio

8% dos pedidos são retirados na loja. É a opção mais lucrativa: custo de entrega zero, e o cliente que entra na loja costuma consumir na cafeteria.

Também resolve o cliente fora da área de entrega própria que trabalha perto do centro.

### História

> Como cliente que passa perto da loja,
> quero retirar meu pedido pessoalmente,
> para não pagar frete e pegar no mesmo dia.

### Regras de negócio

**RN-406.1** Retirada tem frete R$ 0,00, sempre.
**RN-406.2** Escolher retirada dispensa o endereço de entrega. O CPF continua obrigatório.
**RN-406.3** Pedido pago fica pronto em até 4 horas úteis.
**RN-406.4** Horário da loja: segunda a sexta, 8h às 19h. Sábado, 8h às 14h. Domingo fechado.
**RN-406.5** Pedido pago após o expediente conta as 4 horas a partir da abertura seguinte.
**RN-406.6** O pedido fica guardado por 5 dias corridos após ficar pronto.
**RN-406.7** Não retirado no 5º dia, o pedido é cancelado e estornado integralmente.
**RN-406.8** Avisos de retirada: quando fica pronto, no 3º dia e no 5º dia.
**RN-406.9** Retirada exige o número do pedido e um documento com foto.
**RN-406.10** Cupom de frete grátis não faz sentido aqui. Aplicado com retirada, é recusado com mensagem.

### Critérios de aceite

**CA-1 — Escolher retirada**
> **Dado** que estou no checkout
> **Quando** seleciono "Retirar na loja"
> **Então** os campos de endereço somem
> **E** o frete passa a R$ 0,00
> **E** vejo o endereço da loja e o horário de funcionamento

**CA-2 — Prazo em horário comercial**
> **Dado** que pago o pedido numa quarta às 10h
> **Quando** o pedido é confirmado
> **Então** vejo "Pronto para retirada hoje a partir das 14h"

**CA-3 — Prazo fora do expediente**
> **Dado** que pago o pedido num sábado às 16h
> **Quando** o pedido é confirmado
> **Então** vejo "Pronto para retirada na segunda a partir das 12h"

**CA-4 — Cancelamento por não retirada**
> **Dado** que meu pedido ficou pronto há 5 dias e não retirei
> **Quando** o prazo vence
> **Então** o pedido é cancelado
> **E** o valor é estornado integralmente
> **E** recebo o e-mail explicando o cancelamento

**CA-5 — Cupom de frete grátis com retirada**
> **Dado** que escolhi retirada
> **Quando** aplico um cupom de frete grátis
> **Então** vejo "Na retirada o frete já é grátis. Esse cupom não se aplica."

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Cliente aparece antes de ficar pronto | Painel da Bia mostra o status real. O pedido não é entregue incompleto |
| Cliente retira no 6º dia, antes do cancelamento processar | Painel permite entregar e registrar. Não estorna |
| Feriado no meio do prazo | Não conta como dia útil para as 4 horas. Conta para os 5 dias de guarda |

### Fora de escopo

- Agendamento de horário de retirada
- Retirada por terceiro autorizado
- Armário de retirada

### DoD específico

- [ ] Cálculo de horas úteis testado com abertura, fechamento, sábado, domingo e feriado
- [ ] Job de cancelamento por não retirada testado com relógio controlável
- [ ] Estorno automático validado em ambiente de teste do gateway
- [ ] Bia treinada no fluxo de entrega no balcão

### Notas para QA

**Riscos:** prazo errado, pedido cancelado antes da hora, estorno não executado, cliente sem aviso.

**Bordas:** pagamento às 18h59 e 19h01 numa sexta; sábado às 13h59; domingo; feriado na segunda; retirada exatamente no 5º dia; cancelamento e retirada no mesmo minuto.

**Teste temporal:** três regras de prazo diferentes convivem aqui — 4 horas úteis, 5 dias corridos e o calendário da loja. **Sem controle de relógio no ambiente, esta história não é testável.** Levantar no refinamento.

---

## GA-407 — Pagamento com Pix

| | |
|---|---|
| **Épico** | Checkout |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 8 pontos |

### Contexto de negócio

60% dos pedidos da Grão Alto devem sair no Pix. É o meio que a base já usa — hoje a Bia manda a chave e espera o comprovante por foto.

O Pix automatizado elimina a parte mais frágil do processo atual: **a conferência manual de comprovante**. Já houve comprovante falso.

### História

> Como cliente,
> quero pagar com Pix e ter a confirmação automática,
> para não precisar mandar comprovante para ninguém.

### Regras de negócio

**RN-407.1** Pix dinâmico gerado pelo gateway, com QR e código copia e cola.
**RN-407.2** O código expira em 30 minutos.
**RN-407.3** A confirmação chega por webhook do gateway. **Comprovante enviado pelo cliente não confirma nada.**
**RN-407.4** Enquanto não confirmado, o pedido fica em `AGUARDANDO_PAGAMENTO`.
**RN-407.5** Expirado sem pagamento, o pedido vai para `EXPIRADO` e o estoque é liberado.
**RN-407.6** Webhook duplicado **não** processa duas vezes. Idempotência por identificador da transação.
**RN-407.7** Webhook atrasado, após a expiração, com pagamento efetivado: o pedido é reativado e a operação é alertada. **Dinheiro recebido nunca é ignorado.**
**RN-407.8** Valor pago divergente do valor do pedido não confirma automaticamente. Vai para conferência da Bia.
**RN-407.9** A tela de espera consulta o status a cada 3 segundos e reage à confirmação sem o cliente precisar atualizar.
**RN-407.10** Estoque é baixado apenas na confirmação do pagamento (ver GA-410).

### Critérios de aceite

**CA-1 — Pagamento confirmado**
> **Dado** que gerei o Pix e paguei pelo banco
> **Quando** o webhook de confirmação chega
> **Então** o pedido passa para `PAGO`
> **E** a tela de espera muda sozinha para a confirmação
> **E** recebo o e-mail de confirmação
> **E** o pedido aparece no painel da Bia

**CA-2 — Expiração**
> **Dado** que gerei o Pix há 30 minutos e não paguei
> **Quando** o prazo vence
> **Então** o pedido vai para `EXPIRADO`
> **E** vejo "O prazo do Pix acabou" com o botão "Gerar novo Pix"
> **E** o carrinho é preservado

**CA-3 — Webhook duplicado**
> **Dado** que o mesmo webhook de confirmação chega duas vezes
> **Quando** o segundo é processado
> **Então** nada muda no pedido
> **E** nenhum e-mail é reenviado
> **E** o estoque não é baixado de novo

**CA-4 — Webhook atrasado após expiração**
> **Dado** que o pedido expirou às 14h30
> **E** o webhook de pagamento chega às 14h34
> **Quando** o webhook é processado
> **Então** o pedido é reativado como `PAGO`
> **E** um alerta é gerado para a Bia conferir o estoque
> **E** se o estoque não estiver mais disponível, o pedido entra em conferência manual, **nunca em cancelamento automático**

**CA-5 — Valor divergente**
> **Dado** que o pedido é de R$ 112,00 e foi pago R$ 100,00
> **Quando** o webhook chega
> **Então** o pedido **não** é confirmado automaticamente
> **E** entra em `EM_CONFERENCIA` no painel da Bia

**CA-6 — Copiar o código**
> **Dado** que estou na tela do Pix no celular
> **Quando** toco em "Copiar código"
> **Então** o código vai para a área de transferência
> **E** vejo a confirmação "Código copiado"

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Gateway não responde na geração | "Não foi possível gerar o Pix agora." Pedido não é criado. Carrinho preservado |
| Webhook nunca chega, mas o cliente pagou | Job de conciliação consulta o gateway a cada 5 min pelos pedidos aguardando |
| Cliente fecha a aba após pagar | A confirmação chega por e-mail. O pedido aparece em "Meus pedidos" |
| Webhook de origem não confiável | Assinatura validada. Requisição sem assinatura válida é descartada e logada |

### Fora de escopo

- Pix agendado
- Pix parcelado
- Devolução automática de Pix
- Chave estática da loja

### DoD específico

- [ ] Assinatura do webhook validada. Requisição forjada é rejeitada
- [ ] Idempotência do webhook coberta por teste de integração com envio duplicado
- [ ] Job de conciliação implementado e testado
- [ ] Nenhum caminho baixa estoque antes da confirmação
- [ ] Log de toda transição de estado do pagamento, com identificador de correlação

### Notas para QA

**Riscos:** pagamento confirmado duas vezes, dinheiro recebido e pedido perdido, estoque baixado sem pagamento, webhook forjado.

**Bordas:** pagamento no minuto 29:58 e 30:02; webhook duplicado em paralelo; webhook fora de ordem (confirmação antes da criação); valor a maior e a menor; gerar Pix duas vezes para o mesmo pedido.

**O CA-4 é o cenário que separa QA júnior de sênior.** O caminho fácil é cancelar o pedido expirado e seguir a vida. Mas o dinheiro já entrou. **Sistema de pagamento não pode ter caminho onde o cliente paga e não recebe nada** — e essa regra não estava escrita em lugar nenhum até alguém perguntar.

---

## GA-408 — Pagamento com cartão

| | |
|---|---|
| **Épico** | Checkout |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 8 pontos |

### Contexto de negócio

Cartão é o meio que permite parcelar. Para o Geisha do Vale a R$ 148,00 e para pedidos de 1kg, o parcelamento é o que viabiliza a compra.

### História

> Como cliente,
> quero pagar com cartão de crédito, à vista ou parcelado,
> para comprar sem comprometer o orçamento do mês.

### Regras de negócio

**RN-408.1** Cartão de crédito apenas. Débito fica fora do MVP.
**RN-408.2** Parcelamento em até 3× sem juros.
**RN-408.3** Valor mínimo de R$ 40,00 por parcela. Total de R$ 100,00 permite até 2×.
**RN-408.4** Dados do cartão são tokenizados pelo gateway no navegador. **Nenhum dado de cartão passa pelo servidor da Grão Alto** (PCI-DSS).
**RN-408.5** Autorização acontece no fechamento. Captura, na confirmação da autorização.
**RN-408.6** Recusa mostra o motivo em linguagem simples e permite tentar outro cartão ou trocar para Pix.
**RN-408.7** Três recusas seguidas no mesmo pedido sugerem o Pix.
**RN-408.8** Cartão não é salvo na conta no MVP.
**RN-408.9** Idempotência garante que retentativa de rede não gera segunda autorização.
**RN-408.10** Timeout do gateway sem resposta clara dispara consulta de status antes de qualquer nova tentativa.

### Critérios de aceite

**CA-1 — Pagamento à vista**
> **Dado** que informo um cartão válido para um pedido de R$ 112,00
> **Quando** escolho à vista e finalizo
> **Então** a autorização é aprovada
> **E** o pedido vai para `PAGO`
> **E** vejo a confirmação com o número do pedido

**CA-2 — Parcelamento disponível**
> **Dado** que o total é R$ 112,00
> **Quando** abro as opções de parcelamento
> **Então** vejo "1× de R$ 112,00" e "2× de R$ 56,00"
> **E** **não** vejo a opção de 3×, porque a parcela ficaria abaixo de R$ 40,00

**CA-3 — Parcelamento em 3×**
> **Dado** que o total é R$ 150,00
> **Quando** abro as opções
> **Então** vejo 1×, 2× e 3× de R$ 50,00
> **E** nenhuma opção exibe juros

**CA-4 — Cartão recusado**
> **Dado** que o cartão é recusado por saldo insuficiente
> **Quando** finalizo
> **Então** vejo "Seu banco recusou a compra. Tente outro cartão ou pague com Pix."
> **E** o pedido permanece não pago
> **E** o carrinho é preservado

**CA-5 — Timeout do gateway**
> **Dado** que o gateway não responde em 20 segundos
> **Quando** o tempo esgota
> **Então** o sistema consulta o status da transação antes de qualquer nova tentativa
> **E** havendo autorização confirmada, o pedido é concluído normalmente
> **E** **nunca ocorre uma segunda cobrança**

**CA-6 — Dado de cartão fora do servidor**
> **Dado** que preenchi os dados do cartão
> **Quando** inspeciono as requisições enviadas ao servidor da Grão Alto
> **Então** encontro apenas o token
> **E** nenhum número, CVV ou validade

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Duplo clique em finalizar | Idempotência impede segunda autorização |
| Cartão expirado | Validado antes do envio, com mensagem no campo |
| CVV inválido | Recusa do gateway, mensagem específica |
| Autorizada mas captura falha | Pedido em `EM_CONFERENCIA`, alerta para a operação. Autorização é cancelada em 24h se não capturar |

### Fora de escopo

- Débito, boleto e carteira digital
- Salvar cartão
- Parcelamento com juros
- Antifraude próprio, além do que o gateway já faz

### DoD específico

- [ ] Nenhum dado sensível de cartão no servidor, no log ou no navegador após a submissão
- [ ] Idempotência testada com envio simultâneo duplicado
- [ ] Consulta de status após timeout testada com o gateway em sandbox
- [ ] Todas as mensagens de recusa mapeadas para texto compreensível
- [ ] Comunicação exclusivamente por HTTPS, verificado

### Notas para QA

**Riscos:** cobrança duplicada, dado de cartão exposto, mensagem de recusa incompreensível, autorização sem captura.

**Bordas:** total de R$ 79,99, R$ 80,00 e R$ 120,00 para as faixas de parcelamento; cartão recusado três vezes; timeout com autorização efetivada; finalizar em duas abas ao mesmo tempo.

**A cobrança duplicada é o pior bug possível deste MVP.** Não porque é difícil de corrigir, mas porque destrói a confiança de um cliente que a Bia levou dois anos para conquistar. **Idempotência não é detalhe técnico. É proteção de relacionamento.**

---

## GA-409 — Feature flag e rollout por bairro

| | |
|---|---|
| **Épico** | Checkout |
| **Tipo** | Tech |
| **Prioridade** | Média |
| **Estimativa** | 5 pontos |

### Contexto de negócio

A Grão Alto não pode lançar para todo mundo de uma vez. Se o cálculo de frete estiver errado, o erro se multiplica por todos os pedidos antes de alguém perceber.

Liberar por faixa de bairro limita o estrago e permite conferir os números com volume real, mas pequeno.

### História

> Como time,
> queremos liberar o checkout gradualmente por faixa de entrega,
> para limitar o impacto de um erro e conferir os números antes de abrir para todos.

### Regras de negócio

**RN-409.1** A flag controla o acesso ao checkout novo por faixa: A, B, C e fora da área.
**RN-409.2** Alteração da flag entra em vigor em até 60 segundos, sem novo deploy.
**RN-409.3** Cliente fora da faixa liberada vê o site normalmente e é direcionado ao WhatsApp para concluir.
**RN-409.4** Pedido já iniciado com a flag ligada **conclui normalmente** mesmo se a flag for desligada no meio.
**RN-409.5** O estado da flag é registrado em cada pedido, para análise posterior.
**RN-409.6** Desligar tudo é o mecanismo de rollback imediato, sem depender de deploy.
**RN-409.7** A flag é temporária. Removida do código quando as quatro faixas estiverem estáveis por 2 semanas.

### Critérios de aceite

**CA-1 — Faixa liberada**
> **Dado** que só a faixa A está liberada
> **Quando** um cliente de Boa Viagem chega ao checkout
> **Então** ele conclui o pedido normalmente

**CA-2 — Faixa não liberada**
> **Dado** que só a faixa A está liberada
> **Quando** um cliente de Casa Forte tenta o checkout
> **Então** vê "Ainda não atendemos seu bairro pelo site. Fale com a gente pelo WhatsApp."
> **E** vê o botão que abre a conversa com o carrinho descrito na mensagem

**CA-3 — Desligamento durante a compra**
> **Dado** que iniciei o checkout com a faixa A liberada
> **E** a flag foi desligada enquanto eu preenchia
> **Quando** finalizo o pedido
> **Então** o pedido é concluído normalmente

**CA-4 — Rollback**
> **Dado** que todas as faixas estão liberadas e um erro grave é detectado
> **Quando** o time desliga a flag
> **Então** em até 60 segundos nenhum cliente novo entra no checkout
> **E** pedidos já pagos não são afetados

**CA-5 — Registro no pedido**
> **Dado** que um pedido foi concluído
> **Quando** consulto o pedido no painel
> **Então** vejo qual configuração de flag estava ativa naquele momento

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Serviço de flag indisponível | Assume o último estado conhecido em cache. Nunca abre o que estava fechado |
| Configuração inválida | Mantém o estado anterior e alerta a operação |

### Fora de escopo

- Rollout percentual por cliente
- Teste A/B
- Flag por cliente individual

### DoD específico

- [ ] Rollback ensaiado ao menos uma vez em produção, cronometrado
- [ ] Comportamento com o serviço de flag fora do ar testado
- [ ] Estado da flag visível no painel da Bia
- [ ] Data prevista de remoção da flag registrada no backlog

### Notas para QA

**Riscos:** flag falhando aberta, pedido interrompido no meio, comportamento inconsistente entre páginas.

**Bordas:** desligar a flag entre o carregamento do checkout e o clique em finalizar; cliente trocando o CEP de uma faixa liberada para uma bloqueada; serviço de flag caindo com cache vencido.

**Aula do M19:** feature flag é ferramenta de teste, não só de produto. **Ela transforma "deu ruim" em "desliga" — e isso muda completamente o quanto de risco o time pode aceitar em uma entrega.**

---

## GA-412 — Frete grátis aplicado fora da área de entrega própria

| | |
|---|---|
| **Épico** | Checkout |
| **Tipo** | **Bug** |
| **Severidade** | **S1** |
| **Encontrado por** | Léo, em teste exploratório |
| **Fase de origem** | Definição |
| **Fase de detecção** | Verificação |

### Descrição

Pedidos com endereço fora das faixas A, B e C recebem frete R$ 0,00 quando o subtotal ultrapassa R$ 160,00.

O sistema aceita o pedido, informa prazo de entrega própria e o pedido entra numa rota que não existe para aquele endereço.

### Passos para reproduzir

1. Adicionar ao carrinho 3 unidades de Casa Grande 250g (R$ 168,00)
2. Ir ao checkout
3. Informar o CEP 56300-000 (Petrolina, PE)
4. Observar o resumo

**Resultado obtido:** frete R$ 0,00, com a mensagem "Frete grátis" e previsão de entrega para o próximo dia de rota.

**Resultado esperado:** cotação dos Correios, sem frete grátis, com prazo do transportador mais 1 dia útil (RN-405.2 e RN-405.7).

### Evidência

- Vídeo da reprodução
- Requisição e resposta do endpoint de cálculo de frete
- Log da decisão de faixa, mostrando `faixa = null` e `freteGratis = true`

### Causa raiz

A verificação de frete grátis foi implementada comparando **apenas o subtotal com o maior valor mínimo cadastrado** (R$ 160,00, da faixa C). Quando o bairro não é reconhecido, a faixa retorna nula — e o código trata faixa nula como "sem restrição" em vez de "sem entrega própria".

```
// implementado
if (subtotal >= valorMinimoFreteGratis) { frete = 0 }

// esperado
if (faixa != null && subtotal >= faixa.valorMinimo) { frete = 0 }
```

### Impacto no negócio

| Item | Valor |
|---|---|
| Pedidos fora da área | 29% do total |
| Pedidos fora da área acima de R$ 160,00 | ~11% do total |
| Frete médio dos Correios | R$ 34,00 |
| Estimativa em 250 pedidos/semana | ~R$ 935,00 por semana de prejuízo |

Além do custo direto: prazo informado errado, cliente esperando entrega própria numa cidade sem rota, e atendimento manual da Bia para desfazer o mal-entendido.

### Onde poderia ter sido evitado

| Fase | O que teria evitado |
|---|---|
| **Discovery** | Perguntar explicitamente "e quem está fora da área?" ao definir o benefício |
| **Definição** | Escrever o critério de aceite CA-4 do GA-405 com o caso de fora da área. **Ele não existia** |
| **Construção** | O comentário no PR de Léo apontava exatamente isso e foi respondido com "boa, ajusto depois" |
| **Verificação** | Foi onde foi encontrado. Funcionou — mas foi o lugar mais caro dos quatro |

### Correção

Refatorar a decisão de frete grátis para depender da faixa, não do valor isolado. Faixa nula significa ausência de entrega própria, e ausência de entrega própria significa ausência de frete grátis.

### Teste de regressão adicionado

- Teste unitário com faixa nula e subtotal de R$ 1.000,00 → frete cotado, nunca zero
- Teste unitário para as bordas de cada faixa
- Caminho E2E: compra fora da área com valor alto
- Alerta em produção: pedido com frete R$ 0,00 e faixa nula gera notificação imediata

### Notas para QA

**Este bug atravessa o curso inteiro.** Ele aparece no M01 como exemplo do ciclo, no M08 como caso de tabela de decisão, no M12 como comentário de PR ignorado, no M15 como estratégia de teste e no M21 como incidente.

**A lição que ele carrega:** o bug foi encontrado por um bom teste. Mas foi **criado** por um critério de aceite incompleto e **confirmado** por um comentário de review que ninguém tratou.

Encontrar defeito é competência. Impedir que ele nasça é a mesma competência, aplicada mais cedo — e mais barato.
