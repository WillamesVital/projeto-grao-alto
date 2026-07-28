# Backlog 01 — Épico Conta

**GA-101 a GA-105.** Cadastro, login, recuperação de senha e migração da base do WhatsApp.

---

## GA-101 — Cadastro com e-mail e senha

| | |
|---|---|
| **Épico** | Conta |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 5 pontos |

### Contexto de negócio

Hoje o cliente não tem cadastro. A Bia guarda o endereço de cada um numa planilha e num caderno. Quando um cliente novo compra, ela pede tudo por mensagem: nome, endereço, CPF para a nota.

Sem cadastro, cada pedido recomeça do zero. Com cadastro, o segundo pedido custa dois toques.

**O custo de não ter:** ~8 minutos de atendimento por pedido de cliente novo.

### História

> Como cliente que nunca comprou na Grão Alto,
> quero criar uma conta rapidamente,
> para não precisar informar meus dados de novo a cada compra.

### Regras de negócio

**RN-101.1** Campos obrigatórios: nome completo, e-mail, senha, telefone.
**RN-101.2** CPF é opcional no cadastro e obrigatório no checkout (ver RN-13, nota fiscal).
**RN-101.3** E-mail é único no sistema. Não existem duas contas com o mesmo e-mail.
**RN-101.4** Senha com no mínimo 8 caracteres, contendo pelo menos uma letra e um número.
**RN-101.5** Telefone aceita celular com 11 dígitos, com DDD.
**RN-101.6** Nome completo exige ao menos duas palavras.
**RN-101.7** O aceite dos termos de uso e da política de privacidade é obrigatório e registrado com data, hora e IP (LGPD).
**RN-101.8** A conta nasce com status `PENDENTE_CONFIRMACAO` e só compra após confirmar o e-mail (ver GA-102).
**RN-101.9** Senha armazenada com hash. Nunca em texto puro, nunca reversível, nunca em log.

### Critérios de aceite

**CA-1 — Cadastro válido**
> **Dado** que informo nome "Jussara Alves", e-mail "jussara@email.com", senha "cafe1234" e telefone "81988887777"
> **E** aceito os termos
> **Quando** confirmo o cadastro
> **Então** a conta é criada com status `PENDENTE_CONFIRMACAO`
> **E** recebo a mensagem "Enviamos um e-mail para jussara@email.com. Confirme para começar a comprar."

**CA-2 — E-mail já cadastrado**
> **Dado** que já existe conta com "jussara@email.com"
> **Quando** tento cadastrar com o mesmo e-mail
> **Então** vejo "Esse e-mail já tem conta na Grão Alto."
> **E** vejo um link "Entrar" e um link "Esqueci minha senha"
> **E** nenhuma conta nova é criada

**CA-3 — Senha fraca**
> **Dado** que informo a senha "12345678"
> **Quando** tento confirmar
> **Então** vejo "A senha precisa ter ao menos 8 caracteres, com letras e números."
> **E** o cadastro não é enviado

**CA-4 — Validação em tempo de digitação**
> **Dado** que saio do campo de e-mail com "jussara@"
> **Quando** o campo perde o foco
> **Então** vejo "Digite um e-mail válido." abaixo do campo
> **E** o campo fica marcado como inválido para leitor de tela

**CA-5 — Aceite não marcado**
> **Dado** que preenchi tudo corretamente
> **E** não marquei o aceite dos termos
> **Quando** tento confirmar
> **Então** o botão permanece desabilitado
> **E** o motivo está visível ao lado do botão

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Serviço de e-mail indisponível | Conta é criada. Fila de reenvio assume. Cliente vê "Se não chegar em 5 minutos, reenvie" |
| Falha no banco | Mensagem genérica, sem stack trace. Erro logado com ID de correlação exibido ao cliente |
| Envio duplicado do formulário | Idempotência por e-mail. Segunda tentativa não cria segunda conta |
| Caracteres especiais no nome | Aceita acento, hífen e apóstrofo. Rejeita dígito e emoji |

### Fora de escopo

- Login social (Google, Apple)
- Cadastro só com telefone
- Cadastro de pessoa jurídica
- Autenticação em dois fatores

### DoD específico

- [ ] Senha nunca aparece em log de aplicação nem de acesso
- [ ] Registro de consentimento LGPD gravado e consultável
- [ ] Formulário completo navegável por teclado, com ordem de foco correta
- [ ] Mensagens de erro associadas ao campo via `aria-describedby`

### Notas para QA

**Riscos:** duplicidade de conta, vazamento de senha em log, formulário inacessível.

**Bordas:** senha com exatamente 8 caracteres; nome com uma palavra só; e-mail com `+` e com subdomínio; telefone com 10 dígitos (fixo); envio duplo por duplo clique; caixa alta e baixa no e-mail (`Jussara@` deve colidir com `jussara@`).

**Massa:** conta já existente, e-mail com maiúscula, e-mail inválido, nome com acento.

---

## GA-102 — Confirmação de e-mail

| | |
|---|---|
| **Épico** | Conta |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 3 pontos |

### Contexto de negócio

E-mail errado significa cliente que nunca recebe a confirmação do pedido — e liga para a Bia perguntando se a compra deu certo. Confirmar o e-mail antes da primeira compra elimina essa classe inteira de atendimento.

### História

> Como Grão Alto,
> quero confirmar que o e-mail informado existe e pertence ao cliente,
> para garantir que a confirmação do pedido chegue.

### Regras de negócio

**RN-102.1** O link de confirmação vale 24 horas.
**RN-102.2** O link é de uso único. Depois de usado, deixa de funcionar.
**RN-102.3** O reenvio é permitido a cada 60 segundos, com máximo de 5 por dia por e-mail.
**RN-102.4** Reenviar invalida o link anterior.
**RN-102.5** Conta não confirmada pode navegar e montar carrinho, mas **não pode finalizar pedido**.
**RN-102.6** Conta não confirmada em 7 dias é removida, com aviso prévio no 6º dia (LGPD, minimização).

### Critérios de aceite

**CA-1 — Confirmação bem-sucedida**
> **Dado** que recebi o e-mail e o link tem menos de 24 horas
> **Quando** clico no link
> **Então** a conta passa para `ATIVA`
> **E** entro automaticamente logado
> **E** sou levado para a página de onde tinha vindo, ou para a lista de cafés

**CA-2 — Link expirado**
> **Dado** que o link foi gerado há 25 horas
> **Quando** clico nele
> **Então** vejo "Esse link expirou."
> **E** vejo o botão "Enviar novo link"
> **E** a conta permanece `PENDENTE_CONFIRMACAO`

**CA-3 — Link já usado**
> **Dado** que já confirmei a conta com esse link
> **Quando** clico nele de novo
> **Então** vejo "Sua conta já está confirmada."
> **E** vejo o botão "Entrar"

**CA-4 — Bloqueio na finalização**
> **Dado** que minha conta está `PENDENTE_CONFIRMACAO`
> **E** tenho itens no carrinho
> **Quando** tento finalizar o pedido
> **Então** vejo "Confirme seu e-mail para concluir a compra."
> **E** vejo o botão "Reenviar e-mail de confirmação"
> **E** o carrinho é mantido intacto

**CA-5 — Limite de reenvio**
> **Dado** que já solicitei 5 reenvios hoje
> **Quando** peço o sexto
> **Então** vejo "Você atingiu o limite de reenvios de hoje. Fale com a gente pelo WhatsApp."

### Cenários de erro

| Situação | Comportamento |
|---|---|
| E-mail cai em spam | Tela de aguardo orienta a verificar spam e a adicionar o remetente aos contatos |
| Cliente digitou o e-mail errado | Link "Corrigir e-mail" na tela de aguardo, com novo envio |
| Serviço de e-mail fora do ar | Fila de reenvio. Alerta operacional para Paulo |

### Fora de escopo

- Confirmação por SMS
- Verificação de e-mail descartável

### DoD específico

- [ ] Token de confirmação é aleatório, não sequencial nem derivado do e-mail
- [ ] Token não aparece em log
- [ ] Job de limpeza de contas não confirmadas testado

### Notas para QA

**Riscos:** token adivinhável, link reutilizável, carrinho perdido na confirmação.

**Bordas:** link no minuto 23:59 e no 24:01; dois reenvios seguidos e uso do link antigo; confirmação em navegador diferente do cadastro; confirmação com o carrinho cheio.

**Testabilidade:** é preciso conseguir adiantar o relógio no ambiente de teste, ou o cenário de expiração vira teste de 24 horas. **Levantar isso no refinamento, não na hora de testar.**

---

## GA-103 — Login e sessão

| | |
|---|---|
| **Épico** | Conta |
| **Tipo** | Story |
| **Prioridade** | Alta |
| **Estimativa** | 5 pontos |

### Contexto de negócio

62% dos clientes da Grão Alto são recorrentes, comprando a cada 24 dias. O login precisa ser leve o bastante para não ser um obstáculo entre a vontade de café e o pedido.

### História

> Como cliente cadastrado,
> quero entrar na minha conta e continuar conectado,
> para comprar de novo sem repetir dados.

### Regras de negócio

**RN-103.1** Login por e-mail e senha.
**RN-103.2** "Continuar conectado" mantém a sessão por 30 dias. Sem marcar, a sessão dura 24 horas.
**RN-103.3** 5 tentativas erradas do mesmo e-mail bloqueiam novas tentativas por 15 minutos.
**RN-103.4** A mensagem de erro **não** revela se o e-mail existe. Sempre "E-mail ou senha incorretos."
**RN-103.5** Ao entrar, o carrinho de visitante é fundido ao carrinho da conta (detalhe em GA-303).
**RN-103.6** Após o login, o cliente volta para a página em que estava.
**RN-103.7** Sair encerra a sessão apenas no dispositivo atual.

### Critérios de aceite

**CA-1 — Login válido**
> **Dado** que tenho conta ativa com "jussara@email.com"
> **Quando** entro com a senha correta
> **Então** sou autenticado
> **E** volto para a página em que estava
> **E** vejo meu primeiro nome no topo

**CA-2 — Senha incorreta**
> **Dado** que informo a senha errada
> **Quando** tento entrar
> **Então** vejo "E-mail ou senha incorretos."
> **E** a mensagem é idêntica à de e-mail inexistente

**CA-3 — Bloqueio por tentativas**
> **Dado** que errei a senha 5 vezes seguidas
> **Quando** tento a sexta vez, mesmo com a senha correta
> **Então** vejo "Muitas tentativas. Tente de novo em 15 minutos ou redefina sua senha."
> **E** vejo o link de redefinição

**CA-4 — Sessão persistente**
> **Dado** que entrei marcando "continuar conectado"
> **Quando** volto ao site 20 dias depois, no mesmo navegador
> **Então** continuo autenticado

**CA-5 — Sessão expirada durante a compra**
> **Dado** que minha sessão expirou
> **E** estou na página de checkout
> **Quando** tento avançar
> **Então** vejo a tela de login
> **E** após entrar, volto ao checkout **com o carrinho e o endereço preenchidos**

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Conta ainda não confirmada | Entra normalmente, mas vê o aviso de confirmação pendente |
| Conta removida | Mensagem genérica de credencial inválida |
| Token de sessão adulterado | Sessão encerrada, redireciona para login sem detalhar o motivo |

### Fora de escopo

- Login social
- Dois fatores
- Gerenciar sessões ativas em outros dispositivos

### DoD específico

- [ ] Cookie de sessão com `HttpOnly`, `Secure` e `SameSite`
- [ ] Contagem de tentativas por e-mail **e** por IP
- [ ] Nenhuma resposta diferencia e-mail existente de inexistente, nem no tempo de resposta

### Notas para QA

**Riscos:** enumeração de usuário, sessão perdida no meio do checkout, carrinho sumindo no login.

**Bordas:** 5ª e 6ª tentativa; acerto na 5ª; bloqueio expirando; login em duas abas; sessão expirando entre o clique e o envio do pedido.

**Atenção especial ao CA-5.** É o cenário mais provável de gerar abandono real, e é o que mais escapa em teste. Perder o carrinho por causa de um login é a diferença entre um pedido e um cliente irritado no WhatsApp da Bia.

---

## GA-104 — Recuperação de senha

| | |
|---|---|
| **Épico** | Conta |
| **Tipo** | Story |
| **Prioridade** | Média |
| **Estimativa** | 3 pontos |

### Contexto de negócio

Compra a cada 24 dias significa senha esquecida com frequência. Sem autoatendimento, cada esquecimento vira mensagem para a Bia.

### História

> Como cliente que esqueceu a senha,
> quero redefini-la sozinho,
> para voltar a comprar sem falar com ninguém.

### Regras de negócio

**RN-104.1** O link de redefinição vale 1 hora.
**RN-104.2** Uso único. Após redefinir, o link morre.
**RN-104.3** Solicitar um novo link invalida o anterior.
**RN-104.4** A tela de solicitação exibe **sempre** a mesma mensagem, exista ou não a conta.
**RN-104.5** A nova senha segue a RN-101.4 e não pode ser igual à anterior.
**RN-104.6** Redefinir encerra todas as sessões ativas da conta.
**RN-104.7** A conta é notificada por e-mail sempre que a senha muda.

### Critérios de aceite

**CA-1 — Solicitação**
> **Dado** que informo "jussara@email.com" na tela de recuperação
> **Quando** confirmo
> **Então** vejo "Se houver conta com esse e-mail, enviamos o link de redefinição."
> **E** vejo a mesma mensagem para um e-mail que não existe

**CA-2 — Redefinição válida**
> **Dado** que tenho um link gerado há 10 minutos
> **Quando** informo a nova senha "graoalto26" duas vezes
> **Então** a senha é alterada
> **E** todas as sessões anteriores são encerradas
> **E** recebo o e-mail "Sua senha foi alterada"
> **E** sou levado ao login

**CA-3 — Link expirado**
> **Dado** que o link foi gerado há 61 minutos
> **Quando** clico nele
> **Então** vejo "Esse link expirou. Peça um novo."

**CA-4 — Senha igual à anterior**
> **Dado** que estou na tela de nova senha
> **Quando** informo exatamente a senha atual
> **Então** vejo "Escolha uma senha diferente da anterior."

**CA-5 — Confirmação divergente**
> **Dado** que informo "graoalto26" e "graoalto27"
> **Quando** confirmo
> **Então** vejo "As senhas não conferem."

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Dois links pedidos em sequência | Só o mais recente funciona |
| Link usado, tela reaberta | Mensagem de link já utilizado, com opção de pedir novo |
| Conta bloqueada por tentativas | Redefinir a senha libera o bloqueio |

### Fora de escopo

- Recuperação por SMS
- Pergunta de segurança

### DoD específico

- [ ] Token aleatório, de uso único, sem informação da conta
- [ ] Encerramento de sessões testado com sessão ativa em outro navegador
- [ ] E-mail de aviso de alteração enviado sempre

### Notas para QA

**Riscos:** enumeração de conta, link reutilizável, sessão antiga sobrevivendo à troca de senha.

**Bordas:** minuto 59 e 61; dois links e uso do primeiro; redefinir com sessão aberta em outra aba; redefinir com o carrinho cheio.

---

## GA-105 — Convite para a base do WhatsApp

| | |
|---|---|
| **Épico** | Conta |
| **Tipo** | Story |
| **Prioridade** | Média |
| **Estimativa** | 5 pontos |

### Contexto de negócio

Esta é **a história mais importante do épico para o negócio** — e a mais fácil de subestimar.

A Grão Alto tem cerca de 400 clientes ativos comprando por WhatsApp. Se eles não migrarem, o site fica bonito e vazio, e a Bia continua com 5 horas de atendimento por dia. O projeto inteiro falha.

A meta é 60% da base comprando pelo site em 6 meses.

**O risco real:** o cliente recebe o convite, não entende, ignora, e continua mandando mensagem. Migração não é problema técnico. É problema de confiança e de hábito.

### História

> Como cliente que já compra pelo WhatsApp,
> quero criar minha conta sem preencher tudo de novo,
> para não ter trabalho de migrar para o site.

### Regras de negócio

**RN-105.1** A Bia importa a base da planilha: nome, telefone, e-mail quando existe, endereço, histórico de pedidos.
**RN-105.2** Contas pré-criadas nascem com status `PRE_CADASTRADA`. Não têm senha e não conseguem entrar.
**RN-105.3** O convite é enviado por WhatsApp, com link pessoal e intransferível.
**RN-105.4** O link do convite vale 30 dias.
**RN-105.5** Ao ativar, o cliente define a senha, confere o endereço e aceita os termos. Só isso.
**RN-105.6** Ativada, a conta passa a `ATIVA` sem exigir confirmação de e-mail — o telefone já era conhecido.
**RN-105.7** O histórico de pedidos importado fica visível como "Compras anteriores", marcado como feito por WhatsApp.
**RN-105.8** O cliente pode comprar pelo WhatsApp normalmente durante e após a migração. **Nada é desligado.**
**RN-105.9** O envio é em ondas: 40 clientes por semana, começando pelos mais recorrentes.

### Critérios de aceite

**CA-1 — Ativação do convite**
> **Dado** que sou cliente pré-cadastrado e recebi o link
> **Quando** abro o link, defino a senha e confirmo o endereço
> **Então** minha conta fica `ATIVA`
> **E** entro logado
> **E** vejo "Bem-vinda de volta, Jussara" com meus 6 pedidos anteriores listados

**CA-2 — Repetir o último pedido**
> **Dado** que ativei minha conta e tenho histórico importado
> **Quando** escolho "Pedir de novo" no último pedido
> **Então** os mesmos itens, pesos e moagens vão para o carrinho
> **E** itens indisponíveis aparecem sinalizados, e não são adicionados em silêncio

**CA-3 — Link expirado**
> **Dado** que o convite tem 31 dias
> **Quando** abro o link
> **Então** vejo "Esse convite expirou. Fale com a gente pelo WhatsApp que enviamos outro."
> **E** vejo o botão que abre a conversa com a loja

**CA-4 — Endereço divergente**
> **Dado** que o endereço importado está desatualizado
> **Quando** ativo a conta
> **Então** consigo editar o endereço antes de concluir
> **E** o endereço atualizado passa a valer para os próximos pedidos

**CA-5 — Cliente sem e-mail na planilha**
> **Dado** que meu cadastro importado só tem telefone
> **Quando** ativo a conta
> **Então** o e-mail é solicitado como campo obrigatório
> **E** recebo a confirmação de e-mail depois, sem bloquear a primeira compra

### Cenários de erro

| Situação | Comportamento |
|---|---|
| Link encaminhado para outra pessoa | Link é pessoal. A ativação registra o dispositivo. Uso divergente alerta a operação |
| Cliente já criou conta sozinho no site | Ao importar, o e-mail já existente não gera duplicidade. Os pedidos são vinculados à conta existente |
| Dado sujo na planilha | Importação valida CEP, telefone e e-mail. Linha inválida vai para um relatório de exceção, não é importada pela metade |
| Cliente ativa e continua comprando pelo WhatsApp | Comportamento esperado. Bia lança o pedido no painel e ele aparece no histórico |

### Fora de escopo

- Importação automática do histórico de conversas
- Migração de clientes B2B (cafeterias)
- Programa de incentivo ou cupom de migração — decisão de marketing, não do MVP

### DoD específico

- [ ] Importação executada em ambiente de teste com a planilha real anonimizada
- [ ] Relatório de exceções da importação revisado com a Bia
- [ ] Roteiro de mensagem do convite aprovado por Marina
- [ ] Bia treinada para responder as dúvidas da primeira onda
- [ ] Métrica de ativação por onda instrumentada

### Notas para QA

**Riscos:** duplicidade entre conta importada e conta criada no site; endereço errado gerando entrega perdida; cliente sem entender o convite; dado pessoal exposto num link mal gerado.

**Bordas:** cliente com dois telefones; cliente com e-mail já usado por outra conta; planilha com CEP de 7 dígitos; nome só com uma palavra; pedido histórico com café que saiu do catálogo.

**Fora do software:** esta história tem um risco que nenhum teste automatizado pega — o cliente não entender e não migrar. **Vale teste de usabilidade com 3 clientes reais da primeira onda**, acompanhado pela Bia. Levantar isso no refinamento.

**Este card é o exemplo do M04.** Ele mostra que a maior parte do risco de uma história pode estar fora do código.
