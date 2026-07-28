# Curso: Do Discovery à Produção — O QA no Fluxo Real de Desenvolvimento

**Versão 2 — enxuta**

## Metadados

- **Autor principal:** Willames Vital
- **Formato:** 25 módulos, 30–50 min cada
- **Carga total:** ~16h
- **Convidados:** 6 episódios
- **Público:** QA júnior a sênior

---

## Premissa

QA aprende fluxo dentro da empresa. Tarde demais.

Cada empresa tem particularidade. Existe esqueleto comum.

Este curso ensina o esqueleto e as variações.

---

## Estrutura em 7 blocos

### Bloco 1 — O mapa do território (3)

**M01 — Como software nasce e chega em produção** *(45 min)*
Pipeline macro. Fluxos por tipo de empresa: startup, scale-up, corporação, consultoria, regulado.

**M02 — Anatomia de um squad** *(35 min)*
Papéis, responsabilidades, zonas cinzentas. Quem decide o quê.

**M03 — Onde o QA entra em cada fase** *(40 min)*
Mapa de pontos de contato. Onde entra hoje, onde deveria entrar.

---

### Bloco 2 — Discovery e requisitos (3)

**M04 — Discovery e o papel do QA** *(50 min)*
Dual track, hipótese, validação. Perguntas que só QA faz. Testabilidade desde a ideia.

**M05 — 🎤 Produto e Design por dentro** *(50 min)*
*Convidados: Product Manager + Product Designer*
Priorização, roadmap, protótipo, acessibilidade. O que a dupla espera do QA.

**M06 — Requisitos, critérios e ambiguidade** *(45 min)*
Example Mapping, Specification by Example, Gherkin. Caçar ambiguidade cedo.

---

### Bloco 3 — Refinamento e planejamento (3)

**M07 — Refinamento que funciona** *(40 min)*
Three Amigos, DoR e DoD reais. Rituais que não viram teatro.

**M08 — Planejamento por risco e o custo do teste** *(45 min)*
Risk-based testing na sprint. Matriz prática. Como argumentar prazo.

**M09 — 🎤 Liderança técnica e qualidade** *(45 min)*
*Convidado: Tech Lead ou Engineering Manager*
Como liderança enxerga qualidade no planejamento.

---

### Bloco 4 — Desenvolvimento (4)

**M10 — O que acontece enquanto o dev codifica** *(40 min)*
Branch, PR, code review, teste unitário. Desmistificação.

**M11 — Camadas de teste: quem testa o quê** *(45 min)*
Pirâmide, troféu. Evitar duplicação de esforço entre dev e QA.

**M12 — QA lendo código e revisando PR** *(50 min)*
Ler diff, entender impacto, revisar sem programar bem.

**M13 — 🎤 Parceria dev–QA na prática** *(45 min)*
*Convidado: Desenvolvedor sênior*
O que funciona, o que irrita, o que muda o jogo.

---

### Bloco 5 — Estratégia e execução (4)

**M14 — Estratégia de teste que o time usa** *(45 min)*
Como escrever documento vivo, não anexo morto.

**M15 — Estratégias adotadas no mercado** *(50 min)*
Risk-based, exploratório, contract testing, regressão seletiva, shift-left, shift-right. Quando cada uma.

**M16 — Automação dentro do fluxo** *(50 min)*
Onde roda, quem mantém, quando quebra. Custo real de manutenção.

**M17 — Ambientes, dados e feature flags** *(45 min)*
Paridade, massa de teste, toggles. Por que "só quebra em prod".

---

### Bloco 6 — Entrega e produção (4)

**M18 — 🎤 CI/CD e quality gates** *(50 min)*
*Convidado: DevOps ou SRE*
Pipeline, gates, flaky tests, gates que não travam entrega.

**M19 — Estratégias de release** *(40 min)*
Blue-green, canary, feature toggle, rollback. Impacto no teste.

**M20 — Teste em produção e observabilidade** *(45 min)*
Shift-right, smoke pós-deploy, métricas, logs, alertas.

**M21 — 🎤 Quando quebra em produção** *(45 min)*
*Convidado: SRE ou Suporte*
Incidente, severidade, postmortem. Papel real do QA.

---

### Bloco 7 — Metodologias, modelos e carreira (4)

**M22 — Metodologias e o dia a dia do QA** *(45 min)*
Scrum, Kanban, Shape Up, waterfall, ambiente regulado. Sem torcida por framework.

**M23 — Modelos de time e métricas de qualidade** *(50 min)*
QA embarcado, chapter, centralizado, quality coach, sem QA. DORA, escape rate, lead time. Métricas que destroem o time.

**M24 — 🎤 Carreira, influência e futuro do QA** *(50 min)*
*Convidado: Head ou Gerente de QA*
Como QA muda processo sem cargo de liderança.

**M25 — Seus primeiros 30 dias e projeto final** *(50 min)*
Roteiro de perguntas. Mapeamento do fluxo local. Aluno propõe melhoria real.

---

## Convidados — 6 episódios

| Módulo | Área |
|---|---|
| M05 | Product Manager + Designer |
| M09 | Tech Lead / EM |
| M13 | Desenvolvedor sênior |
| M18 | DevOps / SRE |
| M21 | SRE / Suporte |
| M24 | Head de QA |

### Roteiro padrão do episódio

1. Contexto do convidado — 3 min
2. Como a área enxerga o fluxo
3. O que a área espera do QA
4. O que o QA costuma errar ali
5. Um caso real
6. Três ações práticas
7. Comentário de fechamento do autor

---

## Template de módulo

```
# Módulo XX — Título

## Metadados
Bloco | Duração | Pré-requisitos | Nível

## Antes de começar
Conexão com o módulo anterior.

## O problema real
Situação concreta de squad.

## Conteúdo
Teoria + diagrama de fluxo + exemplo prático.

## Na prática
Exercício aplicável ao trabalho do aluno.

## Minha opinião
Posicionamento direto, primeira pessoa.

## Checklist
Itens verificáveis.

## Próximo módulo
Gancho.

## Referências
Bibliografia real.
```

---

## Artefatos entregues

- Mapa visual do fluxo completo
- Template de estratégia de teste
- Matriz de risco preenchível
- Checklist dos primeiros 30 dias
- Banco de perguntas para refinamento

---

## O que saiu da v1

- Módulo isolado de ambiente regulado → virou seção no M22
- Designer como episódio próprio → mesa com PM no M05
- Feedback do usuário → seção dentro do M20
- Estimativa como módulo → fundida ao M08

---

## Decisões pendentes

1. Ordem de gravação dos convidados
2. Pago ou YouTube aberto
3. Projeto final com correção ou autoavaliação
