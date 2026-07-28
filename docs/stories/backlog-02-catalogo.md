# Backlog 02 — Épico Catálogo

**GA-201 a GA-206.** Modelagem de produto, listagem, busca, página do café, seleção de peso e moagem, produto esgotado.

---

## GA-201 — Modelagem de produto, peso e moagem

| | |
|---|---|
| **Épico** | Catálogo |
| **Tipo** | Spike |
| **Prioridade** | Alta |
| **Estimativa** | 3 dias, tempo fechado |

### Contexto de negócio

Um café da Grão Alto não é um produto. É um rótulo que se transforma em até 18 produtos vendáveis: 3 pesos × 6 moagens.

Se a modelagem errar aqui, tudo depois erra: preço, estoque, carrinho, nota fiscal e expedição. E corrigir modelagem depois de ter pedido em produção é a correção mais cara que existe.

**Pergunta a responder:** o estoque é controlado por rótulo, em gramas, ou por combinação peso × moagem, em unidades?

### Objetivo do spike

Decidir e documentar o modelo de dados de produto, com prova de conceito rodando.

### Perguntas a responder

1. Estoque em gramas do rótulo, ou em unidades por SKU?
2. Preço é por rótulo com multiplicador de peso, ou preço próprio por combinação?
3. Moagem gera SKU distinto no estoque, ou é atributo da expedição?
4. Como a nota fiscal descreve o item?
5. O que a Bia precisa ver no painel para separar o pedido?

### Recomendação a validar

**Estoque em gramas por rótulo.** A moagem acontece no momento da separação, não antes. A Grão Alto não estoca café moído — moe na hora, para preservar a janela sensorial.

Consequências desse modelo:
- Um pedido de 500g moído debita 510g do rótulo (RN-02, 2% de perda na moagem)
- Moagem é atributo do item do pedido, não do estoque
- O preço tem base por peso, e a moagem não altera o valor
- Não existem 162 SKUs de estoque. Existem 9 rótulos com saldo em gramas

### Entregáveis

- [ ] Diagrama do modelo de dados
- [ ] Prova de conceito da baixa de estoque com conversão de peso
- [ ] Decisão registrada, com a alternativa recusada e o motivo
- [ ] Impacto em nota fiscal validado com o contador
- [ ] Modelo validado com Sr. Antônio em linguagem de operação, não de banco

### Critério de encerramento

O spike termina quando Ana consegue explicar o modelo ao Sr. Antônio e ele responder "é isso mesmo que a gente faz".

### Notas para QA

**Léo participa do spike.** Não como observador.

**Perguntas que o QA leva:** como testo a perda de 2% sem 30 pedidos manuais? Dá para simular saldo baixo? O que acontece com um pedido de 1kg quando o saldo é 1,005kg? A conversão arredonda para cima ou para baixo?

**Esta é a aula do M10.** Spike não é férias do QA. É o momento mais barato de influenciar a testabilidade — porque nada foi construído ainda.

---

## GA-202 — Listagem de produtos

| | |
|---|---|
| **Épico** | Catálogo |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 5 pontos |

### Contexto de negócio

Hoje o cliente pergunta "o que vocês têm?" e a Bia manda de 3 a 6 fotos com descrição, uma a uma. São 4 minutos por conversa, várias vezes ao dia.

A listagem é a resposta automática dessa pergunta.

### História

> Como cliente,
> quero ver todos os cafés disponíveis numa página,
> para escolher sem precisar perguntar.

### Regras de negócio

**RN-202.1** A lista mostra apenas rótulos com `ativo = true`.
**RN-202.2** Ordenação padrão: fixos primeiro, depois rotativos, cada grupo por pontuação SCA decrescente.
**RN-202.3** Cada card mostra: nome, região, processo, pontuação SCA, até 3 notas sensoriais, preço a partir de (250g) e foto.
**RN-202.4** Rótulo sem estoque aparece com selo "Esgotado", sem botão de compra (detalhe em GA-206).
**RN-202.5** Rótulos rotativos exibem o selo "Lote limitado".
**RN-202.6** Preço exibido é sempre o de 250g, prefixado por "a partir de".
**RN-202.7** Sem paginação no MVP. Nove rótulos cabem numa página.

### Critérios de aceite

**CA-1 — Listagem completa**
> **Dado** que existem 9 rótulos ativos, sendo 3 fixos e 6 rotativos
> **Quando** abro a lista de cafés
> **Então** vejo os 9 cards
> **E** os 3 fixos aparecem antes dos rotativos
> **E** dentro de cada grupo a ordem é por pontuação SCA decrescente

**CA-2 — Informação do card**
> **Dado** que estou na lista
> **Quando** olho o card do Casa Grande
> **Então** vejo "Casa Grande", "Sul de Minas, MG", "Cereja descascado", "86 pontos", as notas "chocolate, castanha, caramelo" e "a partir de R$ 56,00"

**CA-3 — Lista vazia**
> **Dado** que nenhum rótulo está ativo
> **Quando** abro a lista
> **Então** vejo "Estamos torrando. Volte em breve ou fale com a gente pelo WhatsApp."
> **E** vejo o botão que abre a conversa com a loja

**CA-4 — Carregamento**
> **Dado** que estou em 4G instável
> **Quando** abro a lista
> **Então** vejo esqueletos de card enquanto carrega
> **E** o layout não salta quando as imagens chegam

**CA-5 — Falha ao carregar**
> **Dado** que a API não responde
> **Quando** abro a lista
> **Então** vejo "Não conseguimos carregar os cafés agora."
> **E** vejo o botão "Tentar de novo"

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Foto do rótulo ausente | Exibe imagem padrão da Grão Alto, nunca área quebrada |
| Rótulo sem pontuação SCA | Oculta o selo de pontuação, mantém o resto do card |
| Nota sensorial vazia | Card se ajusta sem espaço em branco |

### Fora de escopo

- Filtro por região, processo ou pontuação
- Ordenação escolhida pelo cliente
- Paginação e rolagem infinita

### DoD específico

- [ ] Imagens otimizadas e com carregamento adiado
- [ ] Cada card é um link navegável por teclado
- [ ] Texto alternativo descreve o rótulo, não "imagem de café"
- [ ] Lista renderiza em até 1,2s no p95 em 4G

### Notas para QA

**Riscos:** rótulo inativo aparecendo, ordenação errada, preço desatualizado, layout saltando.

**Bordas:** um único rótulo ativo; todos esgotados; dois rótulos com a mesma pontuação; nome muito longo quebrando o card; foto em 3G lento.

---

## GA-203 — Busca por nome e nota sensorial

| | |
|---|---|
| **Épico** | Catálogo |
| **Tipo** | Story |
| **Prioridade** | Média |
| **Estimativa** | 3 pontos |

### Contexto de negócio

O cliente recorrente não navega. Ele sabe o que quer: "tem aquele do chocolate?". A busca atende esse comportamento, que é a maioria dos pedidos por WhatsApp hoje.

### História

> Como cliente que já sabe o que quer,
> quero buscar pelo nome ou pelo sabor,
> para chegar direto no café certo.

### Regras de negócio

**RN-203.1** A busca cobre: nome do rótulo, região, processo e notas sensoriais.
**RN-203.2** Ignora acento e diferença entre maiúscula e minúscula. "cafe", "café" e "CAFÉ" são equivalentes.
**RN-203.3** Busca parcial. "choco" encontra "chocolate".
**RN-203.4** Mínimo de 2 caracteres para disparar.
**RN-203.5** Resultado herda a ordenação da RN-202.2.
**RN-203.6** Rótulos esgotados aparecem no resultado, marcados.
**RN-203.7** Sem resultado, a página sugere os 3 rótulos fixos.

### Critérios de aceite

**CA-1 — Busca por nome**
> **Dado** que existe o rótulo "Serra Azul"
> **Quando** busco "serra"
> **Então** vejo o Serra Azul no resultado

**CA-2 — Busca com acento invertido**
> **Dado** que a região cadastrada é "Chapada Diamantina, BA"
> **Quando** busco "chapada"
> **Então** encontro o rótulo
> **E** encontro o mesmo resultado buscando "CHÁPÁDA"

**CA-3 — Busca por nota sensorial**
> **Dado** que o Casa Grande tem a nota "chocolate"
> **Quando** busco "choco"
> **Então** o Casa Grande aparece no resultado

**CA-4 — Sem resultado**
> **Dado** que busco "geisha do peru"
> **Quando** não há correspondência
> **Então** vejo "Não achamos nenhum café com 'geisha do peru'."
> **E** vejo "Que tal esses?" com os 3 rótulos fixos
> **E** vejo o botão que abre o WhatsApp da loja

**CA-5 — Termo curto**
> **Dado** que digito "ca"
> **Quando** o campo tem 2 caracteres
> **Então** a busca dispara normalmente
> **E** com 1 caractere a busca não é executada

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Só espaços em branco | Trata como busca vazia, volta para a lista completa |
| Caracteres especiais | Sanitizados, sem erro e sem injeção |
| Termo com 200 caracteres | Truncado, sem quebrar a interface |
| Serviço de busca fora | Mensagem de erro com opção de ver a lista completa |

### Fora de escopo

- Sugestão automática enquanto digita
- Correção de erro de digitação
- Histórico de buscas
- Busca por faixa de preço

### DoD específico

- [ ] Campo com `role="search"` e rótulo acessível
- [ ] Resultado anunciado para leitor de tela
- [ ] Quantidade de resultados exibida

### Notas para QA

**Riscos:** busca sem saída, injeção via campo, resultado inconsistente com a lista.

**Bordas:** 1 e 2 caracteres; termo só com espaço; acento invertido nos dois sentidos; termo que casa com todos os rótulos; busca com o catálogo vazio; aspas e apóstrofo.

---

## GA-204 — Página do produto

| | |
|---|---|
| **Épico** | Catálogo |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 5 pontos |

### Contexto de negócio

Café especial se vende pela história: quem plantou, onde, como processou, que gosto tem. Metade do tempo de atendimento da Bia é contar essa história.

Esta página é a Bia escrita. Se ela não convence, o cliente volta para o WhatsApp — e o projeto não reduz atendimento nenhum.

### História

> Como cliente,
> quero conhecer o café antes de comprar,
> para escolher com confiança e não me arrepender.

### Regras de negócio

**RN-204.1** A página exibe: nome, foto, produtor, região, altitude, variedade, processo, safra, pontuação SCA, notas sensoriais, descrição em texto corrido e **data da última torra**.
**RN-204.2** A data de torra aparece como "Torrado em 22/07/2026 · 6 dias atrás".
**RN-204.3** Café com mais de 45 dias de torra exibe aviso: "Este lote está no fim da janela. Recomendamos levar em grão." (RN-04).
**RN-204.4** A página contém o seletor de peso e moagem (GA-205).
**RN-204.5** Rótulo esgotado troca o botão de compra pelo aviso de indisponibilidade (GA-206).
**RN-204.6** Cada moagem tem uma explicação curta, visível sem precisar de clique em quem não sabe o que é moagem.
**RN-204.7** Rótulo inativo retorna 404, sem página órfã.

### Critérios de aceite

**CA-1 — Conteúdo completo**
> **Dado** que abro a página do Casa Grande
> **Quando** a página carrega
> **Então** vejo produtor, região, altitude, variedade, processo, safra, pontuação e notas
> **E** vejo "Torrado em 22/07/2026 · 6 dias atrás"

**CA-2 — Aviso de janela sensorial**
> **Dado** que o lote foi torrado há 47 dias
> **Quando** abro a página
> **Então** vejo o aviso de fim de janela com a recomendação de levar em grão
> **E** o café continua comprável

**CA-3 — Rótulo inativo**
> **Dado** que o Bourbon Amarelo foi desativado
> **Quando** acesso a URL antiga
> **Então** recebo 404
> **E** a página de erro oferece a lista de cafés disponíveis

**CA-4 — Explicação da moagem**
> **Dado** que sou cliente que não sabe o que é moagem
> **Quando** olho o seletor
> **Então** vejo a explicação de cada opção sem precisar clicar
> **E** o padrão sugerido "Em grão" já vem selecionado

**CA-5 — Compartilhamento**
> **Dado** que a Bia manda o link da página no WhatsApp
> **Quando** o cliente recebe
> **Então** a prévia mostra nome, foto e preço a partir de

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Campo opcional vazio (altitude, safra) | Seção é omitida, sem rótulo solto |
| Data de torra ausente | Não exibe o bloco de frescor. Alerta interno para a operação |
| Foto ausente | Imagem padrão |

### Fora de escopo

- Avaliação e comentário de cliente
- Sugestão de cafés relacionados
- Vídeo do produtor

### DoD específico

- [ ] Metadados de compartilhamento (Open Graph) configurados
- [ ] Hierarquia de títulos correta para leitor de tela
- [ ] Texto alternativo descritivo na foto
- [ ] Data de torra vinda do sistema, nunca digitada manualmente na página

### Notas para QA

**Riscos:** data de torra errada ou desatualizada, página órfã de rótulo desativado, informação faltando quebrando o layout.

**Bordas:** torra de exatamente 45 e 46 dias; rótulo sem safra; nota sensorial única; nome muito longo; página aberta enquanto o rótulo é desativado.

**Aula do M06:** a RN-204.3 diz "recomendamos levar em grão". Recomendar não é impedir. Foi decisão de negócio, não esquecimento — e o QA precisa saber a diferença antes de abrir bug.

---

## GA-205 — Seleção de peso e moagem

| | |
|---|---|
| **Épico** | Catálogo |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 5 pontos |

### Contexto de negócio

É aqui que a Tereza desiste.

Ela quer presentear o filho. Não sabe o que é moagem, não sabe qual método ele usa, e a tela pede que ela escolha. Se não houver padrão sugerido e explicação, ela fecha a aba ou liga para a loja.

E é aqui que a Grão Alto perde dinheiro: **moagem errada é troca, e o custo da troca é da loja** (RN-05).

### História

> Como cliente,
> quero escolher a quantidade e o tipo de moagem,
> para receber o café do jeito que preparo em casa.

### Regras de negócio

**RN-205.1** Pesos disponíveis: 250g, 500g e 1kg.
**RN-205.2** Moagens: em grão, espresso, coado, prensa francesa.
**RN-205.3** Padrão pré-selecionado: 250g, em grão.
**RN-205.4** A moagem **não** altera o preço. O peso, sim.
**RN-205.5** Preço por peso é definido por rótulo, não calculado por multiplicação. 1kg costuma ter desconto proporcional.
**RN-205.6** O preço na tela atualiza imediatamente ao trocar o peso, sem recarregar.
**RN-205.7** Cada moagem tem uma linha de explicação com o método correspondente.
**RN-205.8** Seleção obrigatória. Como há padrão, nunca fica vazia.
**RN-205.9** Depois que o pedido entra em preparo, a moagem não pode mais ser alterada (RN da máquina de estados do pedido). O aviso aparece na confirmação, não aqui.

### Critérios de aceite

**CA-1 — Padrão inicial**
> **Dado** que abro a página do Serra Azul
> **Quando** a página carrega
> **Então** 250g e "Em grão" já estão selecionados
> **E** o preço exibido é R$ 48,00

**CA-2 — Troca de peso atualiza o preço**
> **Dado** que 250g custa R$ 48,00 e 1kg custa R$ 168,00
> **Quando** seleciono 1kg
> **Então** o preço passa a R$ 168,00 imediatamente
> **E** a página não recarrega

**CA-3 — Moagem não altera o preço**
> **Dado** que 500g em grão custa R$ 92,00
> **Quando** troco para "Espresso"
> **Então** o preço continua R$ 92,00

**CA-4 — Explicação visível**
> **Dado** que estou no seletor de moagem
> **Quando** olho as opções
> **Então** vejo "Em grão — você mói em casa", "Espresso — máquina com pressão", "Coado — filtro de papel ou pano", "Prensa francesa — moagem grossa"
> **E** a explicação está visível sem clique ou passagem do mouse

**CA-5 — Seleção mantida no carrinho**
> **Dado** que escolhi 500g e "Coado"
> **Quando** adiciono ao carrinho
> **Então** o item aparece como "Serra Azul · 500g · Coado"

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Peso sem preço cadastrado | Opção não é exibida. Alerta interno |
| Estoque insuficiente para 1kg | Opção aparece desabilitada, com "Sem estoque para 1kg" |
| Preço muda durante a navegação | O preço congela ao adicionar ao carrinho (RN-11) |

### Fora de escopo

- Moagem para aeropress, moka e prensa italiana
- Peso personalizado
- Recomendação automática de moagem por perfil

### DoD específico

- [ ] Seletores implementados como grupo de rádio acessível
- [ ] Troca de opção anunciada para leitor de tela
- [ ] Mudança de preço perceptível também sem depender de cor
- [ ] Área de toque mínima de 44×44 px no mobile

### Notas para QA

**Riscos:** preço que não atualiza, seleção perdida ao voltar, moagem errada chegando ao pedido, cliente leigo travando.

**Bordas:** trocar peso 10 vezes seguidas; adicionar ao carrinho no exato instante da troca; 1kg sem estoque com 250g disponível; voltar do carrinho e conferir a seleção; teclado apenas.

**Combinação:** 3 pesos × 4 moagens × 9 rótulos = 108 combinações. **Ninguém testa 108 manualmente.** Esta história é o exemplo usado no M11 para técnica de teste combinatório.

**Risco fora do código:** a Tereza travar na tela. Não se resolve com automação. Resolve-se com teste de usabilidade — 3 clientes reais, acompanhados pela Bia.

---

## GA-206 — Produto esgotado

| | |
|---|---|
| **Épico** | Catálogo |
| **Tipo** | Story |
| **Prioridade** | Média |
| **Estimativa** | 3 pontos |

### Contexto de negócio

Seis dos nove rótulos são rotativos. Eles acabam. Acabam sem aviso, porque dependem de lote e de safra.

Vender o que não existe é o pior erro possível para uma loja pequena: o cliente paga, alguém precisa ligar, pedir desculpa e estornar. A confiança custa mais que o pedido.

**Hoje isso acontece cerca de 8 vezes por mês** — é o erro de estoque que o projeto quer levar para menos de 1.

### História

> Como cliente,
> quero saber que o café acabou antes de tentar comprar,
> para não me frustrar depois de escolher.

### Regras de negócio

**RN-206.1** Rótulo com saldo abaixo do menor peso vendável (250g) é considerado esgotado.
**RN-206.2** Esgotado continua visível na lista e na busca, com o selo "Esgotado".
**RN-206.3** O botão de compra é substituído por "Avise-me quando chegar".
**RN-206.4** O aviso captura apenas o e-mail. Cliente logado já vem preenchido.
**RN-206.5** Saldo suficiente para 250g mas não para 1kg desabilita **somente** a opção de 1kg.
**RN-206.6** Rótulo que esgota com item já no carrinho é sinalizado no carrinho, não removido em silêncio (ver GA-302).
**RN-206.7** A verificação de disponibilidade é refeita no checkout. **A tela nunca é a fonte da verdade do estoque.**

### Critérios de aceite

**CA-1 — Card esgotado na lista**
> **Dado** que o Geisha do Vale está com saldo zerado
> **Quando** vejo a lista
> **Então** o card mostra o selo "Esgotado"
> **E** o card fica visualmente atenuado, mas continua legível e clicável

**CA-2 — Página do esgotado**
> **Dado** que abro a página do Geisha do Vale esgotado
> **Quando** a página carrega
> **Então** vejo "Esse lote acabou" no lugar do botão de compra
> **E** vejo o campo "Avise-me quando chegar"
> **E** todas as informações do café continuam visíveis

**CA-3 — Peso indisponível**
> **Dado** que restam 700g do Serra Azul
> **Quando** abro a página
> **Então** 250g e 500g estão disponíveis
> **E** 1kg aparece desabilitado com "Sem estoque para 1kg"

**CA-4 — Cadastro no aviso**
> **Dado** que informo meu e-mail no "Avise-me"
> **Quando** confirmo
> **Então** vejo "Pronto. Avisamos assim que o lote chegar."
> **E** informar o mesmo e-mail de novo não gera duplicidade

**CA-5 — Esgota durante a navegação**
> **Dado** que abri a página com estoque disponível
> **E** o último saldo foi vendido por outro cliente
> **Quando** clico em adicionar ao carrinho
> **Então** vejo "Esse café acabou agora. Sentimos muito."
> **E** o item não é adicionado
> **E** a página se atualiza para o estado esgotado

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Saldo negativo no banco | Trata como zero. Alerta operacional imediato |
| Estoque volta enquanto o cliente está na página | Só reflete ao recarregar. Aceitável no MVP |
| Falha ao gravar o "Avise-me" | Mensagem clara, com opção de tentar de novo |

### Fora de escopo

- Envio automático do aviso quando o lote chegar (fase 2)
- Previsão de reposição na tela
- Reserva antecipada

> **Atenção:** o "Avise-me" no MVP **apenas coleta e-mails**. Quem dispara o aviso é a Bia, manualmente. Isso está combinado e precisa estar claro na tela: "Avisamos assim que chegar" é promessa da loja, não automação.

### DoD específico

- [ ] Estado esgotado tem contraste suficiente e não depende só de cor
- [ ] Botão desabilitado é anunciado com o motivo pelo leitor de tela
- [ ] Lista de interessados exportável pela Bia
- [ ] Verificação de estoque no checkout coberta por teste de integração

### Notas para QA

**Riscos:** venda de item esgotado, saldo negativo, cliente frustrado no checkout, duplicidade no "Avise-me".

**Bordas:** saldo de exatamente 250g; saldo de 249g; dois clientes comprando o último saldo ao mesmo tempo; item esgotando entre o carrinho e o pagamento; "Avise-me" com o mesmo e-mail duas vezes.

**A RN-206.7 é a mais importante da história.** Tela nenhuma é fonte da verdade de estoque. **A verificação que vale é a que acontece no fechamento do pedido.** Este é o ponto que gera o cenário de concorrência do M15.
