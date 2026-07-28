# Backlog 05 — Épico Pedido

**GA-410, GA-411 e GA-413.** Finalizar pedido, acompanhamento pelo cliente e painel da operação.

---

## GA-410 — Finalizar e confirmar pedido

| | |
|---|---|
| **Épico** | Pedido |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 8 pontos |

### Contexto de negócio

É o instante em que a intenção vira compromisso. Estoque sai, dinheiro entra, a operação é acionada e a promessa de entrega passa a existir.

Também é o instante mais frágil do sistema. Tudo que dá errado aqui dá errado com dinheiro envolvido: pedido duplicado, estoque negativo, cliente que paga e não aparece pedido nenhum.

**Hoje esse momento é a Bia anotando na planilha.** Ela é o controle de concorrência, a idempotência e a conciliação — tudo na cabeça de uma pessoa.

### História

> Como cliente,
> quero concluir minha compra e receber a confirmação,
> para ter certeza de que o pedido foi registrado.

### Regras de negócio

**RN-410.1** Toda tentativa de finalizar exige chave de idempotência gerada pelo cliente, válida por 24 horas.
**RN-410.2** A mesma chave enviada de novo retorna **o mesmo pedido**, sem criar um segundo.
**RN-410.3** O total é recalculado no servidor no momento do fechamento. O valor enviado pelo cliente é ignorado.
**RN-410.4** Divergência entre o total exibido e o recalculado **interrompe** a conclusão e mostra o novo valor para aceite.
**RN-410.5** A disponibilidade de estoque é verificada dentro da mesma transação que cria o pedido.
**RN-410.6** O estoque é baixado **apenas** na confirmação do pagamento, nunca antes.
**RN-410.7** Para Pix, o pedido nasce em `AGUARDANDO_PAGAMENTO`. Para cartão aprovado, nasce em `PAGO`.
**RN-410.8** O número do pedido segue o padrão `GA` + ano + sequencial de 5 dígitos, e é definitivo.
**RN-410.9** Pedido criado dispara: e-mail de confirmação ao cliente e aparição imediata no painel da Bia.
**RN-410.10** Falha depois da cobrança e antes da criação do pedido **nunca** resulta em cobrança sem pedido. O pedido é criado em conferência e a operação é alertada.
**RN-410.11** O endereço, o frete, o prazo e os preços são congelados no pedido. Mudança posterior de tabela não afeta pedidos já criados.

### Critérios de aceite

**CA-1 — Conclusão bem-sucedida com cartão**
> **Dado** que preenchi tudo e o cartão foi aprovado
> **Quando** finalizo
> **Então** o pedido é criado com status `PAGO` e número `GA202600431`
> **E** o estoque é baixado
> **E** vejo a tela de confirmação com número, itens, prazo e valor
> **E** recebo o e-mail de confirmação
> **E** o pedido aparece no painel da Bia

**CA-2 — Duplo clique**
> **Dado** que estou na tela de checkout
> **Quando** clico em finalizar duas vezes em menos de um segundo
> **Então** **um único pedido** é criado
> **E** o segundo envio retorna o mesmo número de pedido
> **E** o estoque é baixado uma vez só
> **E** a cobrança acontece uma vez só

**CA-3 — Concorrência no último saldo**
> **Dado** que restam 250g do Geisha do Vale
> **E** dois clientes finalizam ao mesmo tempo pedindo 250g
> **Quando** ambos os fechamentos são processados
> **Então** exatamente um pedido é criado com sucesso
> **E** o outro vê "Esse café acabou agora" **antes de qualquer cobrança**
> **E** o saldo final é zero, nunca negativo

**CA-4 — Divergência de total**
> **Dado** que o resumo mostrava R$ 112,00
> **E** o preço de um item mudou desde o congelamento
> **Quando** finalizo
> **Então** a conclusão é interrompida
> **E** vejo "O valor do pedido mudou para R$ 116,00" com o detalhe do que mudou
> **E** preciso aceitar antes de concluir
> **E** nenhuma cobrança acontece antes do aceite

**CA-5 — Pedido com Pix**
> **Dado** que escolhi Pix
> **Quando** finalizo
> **Então** o pedido é criado em `AGUARDANDO_PAGAMENTO`
> **E** o estoque **não** é baixado ainda
> **E** vejo a tela do QR com o prazo de 30 minutos

**CA-6 — Falha após a cobrança**
> **Dado** que o cartão foi autorizado
> **E** a criação do pedido falha por erro de banco
> **Quando** o erro ocorre
> **Então** o pedido é registrado em `EM_CONFERENCIA` com o identificador da transação
> **E** um alerta é gerado para a operação
> **E** o cliente vê "Seu pagamento foi recebido. Estamos confirmando seu pedido e avisamos em minutos."
> **E** **em nenhuma hipótese** o cliente vê apenas uma mensagem de erro genérica

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Chave de idempotência repetida com carrinho diferente | Retorna 409. Não cria pedido novo nem sobrescreve o anterior |
| Sessão expira entre o clique e a resposta | O pedido é criado normalmente. O cliente reencontra em "Meus pedidos" após entrar |
| E-mail de confirmação falha | O pedido existe. E-mail vai para a fila de reenvio. **Falha de e-mail nunca reverte pedido** |
| Painel da Bia indisponível | O pedido é criado. Sincroniza quando o painel voltar |

### Fora de escopo

- Edição do pedido após a criação
- Cancelamento pelo cliente na tela (é pelo WhatsApp no MVP)
- Nota fiscal automática (emitida pela Bia no MVP)

### DoD específico

- [ ] Idempotência coberta por teste com dois envios simultâneos da mesma chave
- [ ] Concorrência no estoque coberta por teste com requisições paralelas reais
- [ ] Recalculo do total no servidor coberto por teste, incluindo tentativa de manipulação do valor
- [ ] Nenhum caminho de código baixa estoque antes da confirmação de pagamento
- [ ] Log de correlação ligando transação de pagamento, pedido e baixa de estoque
- [ ] Cenário CA-6 ensaiado em ambiente de teste, com falha injetada

### Notas para QA

**Riscos:** pedido duplicado, estoque negativo, cobrança sem pedido, total manipulado pelo cliente.

**Bordas:** duplo, triplo e quádruplo clique; dois dispositivos finalizando o mesmo carrinho; último saldo com três clientes simultâneos; chave de idempotência reenviada em 23h59 e 24h01; falha de rede exatamente entre a autorização e a criação.

**Esta é a história mais crítica do MVP.** Três dos quatro riscos catastróficos do mapa de risco moram aqui.

**Sobre o CA-3:** teste de concorrência não se faz clicando rápido em duas abas. Precisa de requisições paralelas de verdade. **Se o ambiente de teste não permite isso, esse é um impedimento para levantar no refinamento — não uma limitação para aceitar em silêncio.**

---

## GA-411 — Meus pedidos e status

| | |
|---|---|
| **Épico** | Pedido |
| **Tipo** | Story |
| **Prioridade** | Média |
| **Estimativa** | 5 pontos |

### Contexto de negócio

"Meu pedido saiu?" é a segunda pergunta mais frequente no WhatsApp da Grão Alto, atrás só do frete.

Cada uma custa de 1 a 3 minutos da Bia, que precisa abrir a planilha, conferir com o galpão e responder. Uma tela de status elimina essa classe inteira de mensagem — e resolve o cliente que pergunta às 22h.

### História

> Como cliente,
> quero acompanhar o status do meu pedido,
> para saber quando meu café chega sem precisar perguntar.

### Regras de negócio

**RN-411.1** A lista mostra os pedidos do cliente, do mais recente para o mais antigo.
**RN-411.2** Cada linha mostra número, data, valor total, quantidade de itens e status atual.
**RN-411.3** O detalhe mostra itens com peso e moagem, endereço ou retirada, frete, forma de pagamento e histórico de status com data e hora.
**RN-411.4** Status visíveis ao cliente, em linguagem de gente:

| Status interno | Como o cliente vê |
|---|---|
| `AGUARDANDO_PAGAMENTO` | Aguardando pagamento |
| `PAGO` | Pagamento confirmado |
| `EM_PREPARO` | Moendo e embalando |
| `PRONTO_P_ENTREGA` | Pronto |
| `EM_ROTA` | Saiu para entrega |
| `ENVIADO` | Enviado pelos Correios |
| `ENTREGUE` | Entregue |
| `CANCELADO` | Cancelado |
| `EM_CONFERENCIA` | Confirmando seu pedido |

**RN-411.5** Pedido aguardando Pix mostra o tempo restante e o botão para retomar o pagamento.
**RN-411.6** Pedido enviado pelos Correios mostra o código de rastreio quando existir.
**RN-411.7** Pedido histórico importado do WhatsApp aparece marcado como "Pedido feito pelo WhatsApp".
**RN-411.8** Toda tela oferece o atalho "Falar com a loja", com o número do pedido já na mensagem.
**RN-411.9** Cada mudança de status dispara e-mail, exceto as transições internas sem valor para o cliente.

### Critérios de aceite

**CA-1 — Lista de pedidos**
> **Dado** que tenho 4 pedidos, sendo 2 importados do WhatsApp
> **Quando** abro "Meus pedidos"
> **Então** vejo os 4, do mais recente para o mais antigo
> **E** os 2 importados aparecem marcados como feitos pelo WhatsApp

**CA-2 — Detalhe do pedido**
> **Dado** que abro o pedido GA202600431
> **Quando** a página carrega
> **Então** vejo "Serra Azul · 250g · Coado · 2 unidades"
> **E** vejo o endereço, o frete, a forma de pagamento e o histórico de status com data e hora

**CA-3 — Pix pendente**
> **Dado** que tenho um pedido aguardando Pix há 12 minutos
> **Quando** abro o detalhe
> **Então** vejo "Aguardando pagamento — faltam 18 minutos"
> **E** vejo o botão "Ver código Pix"

**CA-4 — Atualização de status**
> **Dado** que meu pedido estava em "Moendo e embalando"
> **Quando** a Bia marca como pronto no painel
> **Então** ao recarregar vejo "Pronto"
> **E** recebo o e-mail correspondente

**CA-5 — Sem pedidos**
> **Dado** que nunca comprei
> **Quando** abro "Meus pedidos"
> **Então** vejo "Você ainda não tem pedidos" com o botão "Ver cafés"

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Pedido de outro cliente acessado pela URL | Retorna 404, nunca 403 com detalhe. Não confirma existência |
| Rastreio indisponível | Oculta o bloco de rastreio, mantém o status |
| Falha ao carregar | Erro com opção de tentar de novo |

### Fora de escopo

- Cancelamento pelo cliente
- Solicitação de troca pela tela
- Nota fiscal para download
- Repetir pedido a partir daqui (existe apenas no histórico importado, GA-105)

### DoD específico

- [ ] Autorização testada: nenhum cliente acessa pedido de outro, nem por URL direta
- [ ] Histórico de status registrado com data, hora e origem da mudança
- [ ] Traduções de status revisadas por Marina
- [ ] Lista acessível por teclado, com títulos hierárquicos corretos

### Notas para QA

**Riscos:** vazamento de pedido entre contas, status desatualizado, cliente sem entender o que "em conferência" significa.

**Bordas:** pedido do minuto anterior; pedido de 2 anos importado; pedido cancelado; pedido em conferência; acessar o pedido de outro cliente pela URL; Pix com 1 minuto restante.

**Teste de autorização é obrigatório aqui.** Trocar o identificador na URL e ver o pedido de outra pessoa é a falha mais comum e mais grave desta tela — e não aparece em nenhum teste funcional.

---

## GA-413 — Painel de pedidos da operação

| | |
|---|---|
| **Épico** | Pedido |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 8 pontos |

### Contexto de negócio

**Sem esta história, o MVP não existe.** O cliente conclui o pedido no site e ele cai no vazio — ninguém separa, ninguém mói, ninguém entrega.

Hoje a Bia trabalha com planilha e grupo de WhatsApp. O painel substitui os dois. E é o único lugar do MVP onde o usuário não é o cliente, e sim a operação.

**Risco subestimado:** se o painel for pior que a planilha, a Bia volta para a planilha. E o pedido do site vira trabalho a mais em vez de trabalho a menos.

### História

> Como Bia, responsável pela operação,
> quero ver e movimentar todos os pedidos numa tela,
> para separar, moer e despachar sem depender da planilha.

### Regras de negócio

**RN-413.1** Acesso restrito a contas com perfil de operação.
**RN-413.2** A visão padrão mostra os pedidos que exigem ação, agrupados por status.
**RN-413.3** Cada pedido exibe: número, cliente, telefone, itens com **peso e moagem em destaque**, tipo de entrega, bairro, faixa, janela prevista e forma de pagamento.
**RN-413.4** A moagem é a informação mais destacada da tela. É o que a expedição erra e o que a loja paga para corrigir (RN-05).
**RN-413.5** Pedidos de entrega própria do dia são agrupados por faixa, na ordem da rota.
**RN-413.6** Movimentação manual de status: pago → em preparo → pronto → em rota/enviado → entregue.
**RN-413.7** Toda movimentação registra quem fez e quando.
**RN-413.8** Pedidos em `EM_CONFERENCIA` aparecem no topo, com destaque visual.
**RN-413.9** A lista de separação do dia é imprimível ou exportável.
**RN-413.10** O painel mostra o saldo atual de cada rótulo, em gramas.
**RN-413.11** A Bia pode lançar manualmente um pedido recebido pelo WhatsApp, e ele passa a viver no mesmo fluxo.
**RN-413.12** Atualização automática a cada 30 segundos, sem recarregar a página.

### Critérios de aceite

**CA-1 — Pedido novo aparece**
> **Dado** que o painel está aberto
> **Quando** um cliente conclui um pedido no site
> **Então** ele aparece no painel em até 30 segundos
> **E** um indicador sonoro ou visual sinaliza a chegada

**CA-2 — Moagem em destaque**
> **Dado** que um pedido tem "Serra Azul · 500g · Espresso" e "Casa Grande · 250g · Em grão"
> **Quando** a Bia abre o pedido
> **Então** a moagem de cada item aparece em destaque tipográfico
> **E** é legível a um metro de distância da tela do galpão

**CA-3 — Rota do dia**
> **Dado** que hoje é terça, dia de rota
> **Quando** a Bia abre "Entregas de hoje"
> **Então** vê os pedidos agrupados por faixa A, B e C
> **E** cada pedido mostra bairro, endereço, ponto de referência e telefone
> **E** consegue exportar ou imprimir a lista

**CA-4 — Movimentar status**
> **Dado** que um pedido está em "Pago"
> **Quando** a Bia marca "Em preparo"
> **Então** o status muda
> **E** o cliente vê a atualização em "Meus pedidos"
> **E** o registro guarda que foi a Bia, com data e hora

**CA-5 — Pedido em conferência**
> **Dado** que um pedido caiu em `EM_CONFERENCIA` por valor divergente no Pix
> **Quando** a Bia abre o painel
> **Então** o pedido aparece no topo, destacado
> **E** ela vê o valor esperado, o valor pago e a diferença
> **E** pode confirmar manualmente ou cancelar com estorno

**CA-6 — Lançar pedido do WhatsApp**
> **Dado** que um cliente comprou pelo WhatsApp
> **Quando** a Bia lança o pedido no painel
> **Então** o pedido entra no mesmo fluxo dos pedidos do site
> **E** o estoque é baixado normalmente
> **E** o pedido aparece marcado como origem WhatsApp

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Duas pessoas movimentando o mesmo pedido | Última ação vence, com aviso de que houve alteração |
| Estoque insuficiente no lançamento manual | Bloqueia, com o saldo real exibido |
| Painel offline por queda de rede | Avisa que está desatualizado. **Não mostra dado antigo como se fosse atual** |
| Movimentação para status inválido | Só transições válidas aparecem como opção |

### Fora de escopo

- Roteirização automática da entrega
- Aplicativo para o motoboy
- Emissão de nota fiscal pelo painel
- Relatório gerencial e BI
- Gestão de lote de torra

### DoD específico

- [ ] Perfil de acesso testado: cliente comum não acessa o painel por URL direta
- [ ] Auditoria de movimentação gravada e consultável
- [ ] **Bia treinada e tendo operado um dia inteiro em ambiente de teste**
- [ ] Legibilidade validada na tela real do galpão, com a Bia presente
- [ ] Funciona em tablet, que é o dispositivo usado na separação
- [ ] Comportamento offline testado

### Notas para QA

**Riscos:** pedido não aparecendo no painel, moagem lida errada, status inconsistente entre painel e cliente, acesso indevido.

**Bordas:** pedido chegando enquanto a Bia move outro; dois operadores simultâneos; pedido cancelado durante a separação; lançamento manual do último saldo; queda de rede no meio da movimentação.

**Teste que não é de software:** a validação mais importante desta história é a Bia operar um dia inteiro no ambiente de teste, com pedidos reais copiados. **Se ela for mais rápida na planilha, a história falhou — mesmo com todos os critérios de aceite verdes.**

**Aula do M14:** critério de aceite verde não é o mesmo que necessidade atendida. **Esta história é o exemplo dessa diferença no curso inteiro.**
