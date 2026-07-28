# Backlog 03 — Épico Carrinho

**GA-301 a GA-303.** Adicionar item, alterar quantidade e remover, persistência e fusão no login.

---

## GA-301 — Adicionar ao carrinho

| | |
|---|---|
| **Épico** | Carrinho |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 3 pontos |

### Contexto de negócio

O carrinho é onde o cliente monta o pedido antes de se comprometer. Na Grão Alto, 1,9 item por pedido é a média — quase sempre dois cafés, ou o mesmo café em pesos diferentes.

Sem carrinho, cada café vira um pedido separado, com frete separado. Isso encarece para o cliente e triplica o trabalho na expedição.

### História

> Como cliente,
> quero juntar mais de um café antes de fechar,
> para pagar um frete só e receber tudo junto.

### Regras de negócio

**RN-301.1** O item do carrinho é a combinação rótulo + peso + moagem. O mesmo rótulo em moagens diferentes são **itens separados**.
**RN-301.2** Adicionar um item idêntico ao que já existe soma a quantidade, não cria linha nova.
**RN-301.3** Quantidade inicial ao adicionar: 1.
**RN-301.4** O preço é congelado no momento em que o item entra no carrinho, por 30 minutos (RN-11).
**RN-301.5** Adicionar não reserva estoque. A verificação de saldo acontece ao adicionar e novamente no fechamento.
**RN-301.6** Visitante não logado pode montar carrinho normalmente.
**RN-301.7** Após adicionar, o cliente permanece na página, com confirmação visível e atalho para o carrinho.
**RN-301.8** O contador no topo reflete a quantidade total de unidades, não de linhas.

### Critérios de aceite

**CA-1 — Adicionar item novo**
> **Dado** que estou na página do Serra Azul com 250g e "Coado" selecionados
> **Quando** clico em "Adicionar ao carrinho"
> **Então** o item entra como "Serra Azul · 250g · Coado", quantidade 1
> **E** o contador do topo vai para 1
> **E** vejo "Adicionado ao carrinho" com o link "Ver carrinho"
> **E** continuo na mesma página

**CA-2 — Item idêntico soma**
> **Dado** que já tenho "Serra Azul · 250g · Coado" com quantidade 1
> **Quando** adiciono exatamente a mesma combinação
> **Então** a quantidade passa para 2
> **E** o carrinho continua com uma linha só

**CA-3 — Mesma origem, moagem diferente**
> **Dado** que tenho "Serra Azul · 250g · Coado"
> **Quando** adiciono "Serra Azul · 250g · Espresso"
> **Então** o carrinho passa a ter **duas linhas**
> **E** o contador do topo mostra 2

**CA-4 — Item esgotado**
> **Dado** que o saldo do rótulo zerou depois que abri a página
> **Quando** clico em adicionar
> **Então** vejo "Esse café acabou agora. Sentimos muito."
> **E** nada é adicionado
> **E** o botão vira "Avise-me quando chegar"

**CA-5 — Visitante**
> **Dado** que não estou logado
> **Quando** adiciono um item
> **Então** o item é guardado no carrinho de visitante
> **E** o login só é exigido no checkout

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Duplo clique no botão | Adiciona **uma** unidade. Botão bloqueado durante a requisição |
| Falha de rede ao adicionar | Item não entra. Mensagem com "Tentar de novo". Contador não muda |
| Cookie desabilitado | Aviso de que o carrinho não pode ser mantido, com orientação |

### Fora de escopo

- Lista de desejos
- Comprar agora, sem passar pelo carrinho
- Sugestão de item complementar

### DoD específico

- [ ] Confirmação de adição anunciada para leitor de tela via região viva
- [ ] Botão desabilitado durante a requisição, com estado de carregamento
- [ ] Contador do topo atualiza sem recarregar a página

### Notas para QA

**Riscos:** item duplicado por duplo clique, quantidade somando errado, item entrando sem estoque.

**Bordas:** duplo e triplo clique; adicionar em duas abas simultâneas; adicionar o último saldo disponível; adicionar com a sessão expirando no mesmo instante; adicionar 4 variações do mesmo rótulo.

---

## GA-302 — Alterar quantidade e remover item

| | |
|---|---|
| **Épico** | Carrinho |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 5 pontos |

### Contexto de negócio

O carrinho é o último lugar barato para mudar de ideia. Depois dele, mudar custa atendimento, estorno ou logística reversa.

Também é onde mora um risco silencioso: **o total precisa estar sempre certo**. Um subtotal errado descoberto no checkout destrói a confiança na hora exata em que o cliente vai pagar.

### História

> Como cliente,
> quero ajustar quantidades e remover itens,
> para fechar o pedido do jeito que decidi.

### Regras de negócio

**RN-302.1** Quantidade permitida por item: de 1 a 10.
**RN-302.2** Tentativa acima de 10 exibe orientação para falar com a loja pelo WhatsApp — pode ser cliente B2B.
**RN-302.3** Reduzir a quantidade para 0 remove o item, com confirmação.
**RN-302.4** Toda alteração recalcula subtotal, frete e total imediatamente.
**RN-302.5** Remover exibe "Item removido" com a opção "Desfazer", válida por 10 segundos.
**RN-302.6** Quantidade limitada pelo saldo disponível. Saldo para 3 unidades impede a quarta, com mensagem.
**RN-302.7** Item que esgotou enquanto estava no carrinho é sinalizado, mantido na tela e **não computado no total**. O checkout fica bloqueado até o cliente removê-lo.
**RN-302.8** Carrinho vazio mostra estado próprio, com atalho para a lista de cafés.
**RN-302.9** Cada linha mostra preço unitário e subtotal da linha.

### Critérios de aceite

**CA-1 — Aumentar quantidade**
> **Dado** que tenho "Casa Grande · 250g · Em grão" a R$ 56,00, quantidade 1
> **Quando** altero para 3
> **Então** o subtotal da linha vai para R$ 168,00
> **E** o total do carrinho é recalculado na hora
> **E** o frete é recalculado, se já houver CEP informado

**CA-2 — Limite de quantidade**
> **Dado** que a quantidade do item está em 10
> **Quando** tento aumentar
> **Então** vejo "Para pedidos acima de 10 unidades, fale com a gente pelo WhatsApp."
> **E** vejo o botão que abre a conversa
> **E** a quantidade permanece 10

**CA-3 — Limite por estoque**
> **Dado** que restam 800g do Serra Azul e o item é de 250g
> **Quando** tento colocar quantidade 4 (1000g)
> **Então** vejo "Temos apenas 3 unidades desse café agora."
> **E** a quantidade é ajustada para 3

**CA-4 — Remover com desfazer**
> **Dado** que tenho dois itens no carrinho
> **Quando** removo o primeiro
> **Então** vejo "Item removido" com o botão "Desfazer"
> **E** clicando em "Desfazer" dentro de 10 segundos, o item volta com a mesma quantidade e moagem

**CA-5 — Item esgotado no carrinho**
> **Dado** que o Geisha do Vale esgotou depois de entrar no meu carrinho
> **Quando** abro o carrinho
> **Então** o item aparece marcado como "Indisponível"
> **E** o valor dele não entra no total
> **E** o botão de finalizar fica desabilitado com "Remova o item indisponível para continuar"

**CA-6 — Carrinho vazio**
> **Dado** que removi o último item
> **Quando** o carrinho fica vazio
> **Então** vejo "Seu carrinho está vazio"
> **E** vejo o botão "Ver cafés"

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Preço mudou desde a adição | Após 30 minutos, revalida. Preço maior exige aceite; menor aplica sozinho (RN-11) |
| Falha ao recalcular | Mantém os valores anteriores e mostra erro. **Nunca exibe total parcial ou errado** |
| Quantidade digitada como texto | Campo aceita apenas número inteiro positivo |
| Alteração em duas abas | Última gravação vence. A outra aba reflete ao ser atualizada |

### Fora de escopo

- Salvar carrinho para depois
- Compartilhar carrinho
- Cupom aplicado no carrinho (é no checkout, GA-403)

### DoD específico

- [ ] Recalculo do total coberto por teste unitário com valores exatos
- [ ] "Desfazer" anunciado para leitor de tela
- [ ] Cálculo feito em centavos inteiros, sem ponto flutuante
- [ ] Total exibido nunca fica dessincronizado das linhas

### Notas para QA

**Riscos:** total incorreto, item indisponível entrando no total, quantidade acima do estoque, arredondamento errado.

**Bordas:** quantidade 0, 1, 10 e 11; estoque para exatamente 3 unidades; remover e desfazer no segundo 9 e no 11; alterar em duas abas; item de R$ 0,01; carrinho com 10 linhas.

**Foco de teste:** a RN-302.7 é a mais fácil de implementar errado. Item indisponível que continua somando no total gera cobrança a mais — **é S1, não S3.**

---

## GA-303 — Persistência do carrinho e fusão no login

| | |
|---|---|
| **Épico** | Carrinho |
| **Tipo** | Story |
| **Prioridade** | Média |
| **Estimativa** | 5 pontos |

### Contexto de negócio

O cliente da Grão Alto monta o carrinho no celular, no ônibus, e finaliza em casa. Ou monta como visitante e só entra na hora de pagar.

Se o carrinho some nesse caminho, o pedido não acontece — e ninguém avisa a loja. **É a perda mais silenciosa do funil.**

### História

> Como cliente,
> quero encontrar meu carrinho como deixei,
> para não montar tudo de novo quando voltar.

### Regras de negócio

**RN-303.1** Carrinho de visitante persiste por 7 dias no navegador.
**RN-303.2** Carrinho de cliente logado persiste por 30 dias no servidor.
**RN-303.3** No login, o carrinho de visitante é **fundido** ao carrinho da conta. Nunca substituído.
**RN-303.4** Na fusão, itens idênticos somam quantidade, respeitando o teto de 10 e o saldo disponível.
**RN-303.5** Excedente na fusão é ajustado ao máximo permitido, com aviso explícito.
**RN-303.6** Preços são revalidados na fusão. Congelamento recomeça.
**RN-303.7** Item indisponível é mantido na fusão, marcado, para o cliente decidir.
**RN-303.8** Ao sair da conta, o carrinho da conta permanece no servidor. O dispositivo fica sem carrinho.
**RN-303.9** O carrinho é o mesmo em qualquer dispositivo em que o cliente esteja logado.

### Critérios de aceite

**CA-1 — Fusão simples**
> **Dado** que como visitante tenho "Serra Azul · 250g · Coado" quantidade 1
> **E** minha conta tem "Casa Grande · 500g · Em grão" quantidade 1
> **Quando** faço login
> **Então** o carrinho passa a ter os **dois** itens
> **E** vejo "Juntamos os itens do seu carrinho"

**CA-2 — Fusão com item idêntico**
> **Dado** que como visitante tenho "Serra Azul · 250g · Coado" quantidade 2
> **E** minha conta tem o mesmo item com quantidade 1
> **Quando** faço login
> **Então** o item fica com quantidade 3, numa linha só

**CA-3 — Fusão acima do limite**
> **Dado** que a soma resultaria em quantidade 12
> **Quando** faço login
> **Então** a quantidade é ajustada para 10
> **E** vejo "Ajustamos a quantidade de Serra Azul para o máximo de 10 por pedido."

**CA-4 — Persistência do visitante**
> **Dado** que montei o carrinho como visitante há 3 dias
> **Quando** volto ao site no mesmo navegador
> **Então** meu carrinho está lá, com os mesmos itens e moagens

**CA-5 — Persistência entre dispositivos**
> **Dado** que adicionei itens logado no celular
> **Quando** entro na mesma conta no computador
> **Então** vejo o mesmo carrinho

**CA-6 — Login no meio do checkout**
> **Dado** que estou no checkout como visitante, com CEP e endereço preenchidos
> **Quando** faço login para concluir
> **Então** volto ao checkout
> **E** carrinho, CEP e frete calculado continuam preenchidos

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Armazenamento local bloqueado | Carrinho vale só na sessão atual. Aviso discreto |
| Item do carrinho antigo saiu do catálogo | Item é removido na fusão, com aviso nominal |
| Carrinho de 30 dias com preços antigos | Revalidação de preço na abertura, com aviso de mudança |
| Conflito de gravação simultânea | Última gravação vence. Sem perda de item |

### Fora de escopo

- Recuperação de carrinho abandonado por e-mail
- Vários carrinhos salvos
- Carrinho compartilhado entre contas

### DoD específico

- [ ] Fusão coberta por teste de integração com os quatro casos: só visitante, só conta, ambos com itens distintos, ambos com item idêntico
- [ ] Nenhum caminho da fusão descarta item em silêncio
- [ ] Aviso de ajuste sempre visível quando algo muda
- [ ] CA-6 validado manualmente antes de cada release

### Notas para QA

**Riscos:** carrinho substituído em vez de fundido, item perdido sem aviso, quantidade estourando o limite, carrinho perdido no login durante o checkout.

**Bordas:** visitante com carrinho e conta com carrinho vazio, e o inverso; fusão que estoura estoque **e** limite ao mesmo tempo; login com o carrinho de 7 dias no último dia; login em dois dispositivos ao mesmo tempo; sair da conta e voltar.

**O CA-6 merece atenção especial.** É o cenário mais próximo do dinheiro e o mais esquecido em teste — o cliente já decidiu comprar, já preencheu o endereço, e um login mal resolvido joga tudo fora. **Vale um dos cinco caminhos E2E automatizados do MVP.**
