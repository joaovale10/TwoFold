# Vale & Clara — Estrutura Completa de Páginas e Telas

## Objetivo

Transformar o Vale & Clara numa aplicação de gestão financeira para casal, com separação clara entre dinheiro pessoal e dinheiro conjunto.

A aplicação deve ser simples para utilização diária, mas suficientemente completa para responder rapidamente a:

- Quanto temos?
- Quanto gastámos este mês?
- Quanto podemos gastar?
- Quanto estamos a poupar?
- Estamos a cumprir o orçamento?
- Quanto dinheiro é pessoal e quanto é conjunto?
- Para onde está a ir o nosso dinheiro?

---

# 1. Estrutura geral

A navegação principal deve ser:

```text
VALE & CLARA
│
├── 🏠 Resumo
├── 💳 Transações
├── 🏦 Contas
├── 📊 Orçamento
├── 🎯 Objetivos
├── 👩‍❤️‍👨 Casal
├── 🔄 Recorrentes
└── ⚙️ Definições
```

Deve existir sempre uma ação rápida para criar um movimento:

```text
＋ Novo movimento
```

Ao clicar:

```text
┌───────────────────────────────┐
│       NOVO MOVIMENTO           │
│                               │
│  Despesa   Receita   Transfer.│
│                               │
│  Valor                       │
│  ┌─────────────────────────┐ │
│  │ 25,90 €                 │ │
│  └─────────────────────────┘ │
│                               │
│  Descrição                    │
│  ┌─────────────────────────┐ │
│  │ Mercadona                │ │
│  └─────────────────────────┘ │
│                               │
│  Categoria       Conta        │
│  Alimentação     Conta Casal  │
│                               │
│  Data                          │
│  26/08/2026                    │
│                               │
│          [ Adicionar ]         │
└───────────────────────────────┘
```

---

# 2. 🏠 Resumo

Esta deve ser a home page.

Objetivo:

> Perceber em poucos segundos como estão as finanças.

## Informação principal

Mostrar:

- Património total
- Saldo atual
- Receitas do mês
- Despesas do mês
- Poupança do mês
- Evolução relativamente ao mês anterior

Exemplo:

```text
┌──────────────────────────────────────────────────────────────┐
│ Vale & Clara                                  Agosto 2026    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Património                 Este mês                         │
│  18.420 €                   Receitas       4.320 €           │
│  +1.240 € ↑                 Despesas       2.870 €           │
│                             Poupança       1.450 €           │
│                                                              │
├────────────────────┬────────────────────┬────────────────────┤
│ 👤 VALE            │ 👤 CLARA           │ 🏠 CASAL           │
│                    │                    │                    │
│ 2.179 €            │ 1.420 €            │ 4.850 €            │
│                    │                    │                    │
│ Pessoal            │ Pessoal            │ Conjunto           │
└────────────────────┴────────────────────┴────────────────────┘
```

## Despesas do mês

Mostrar as principais categorias:

- Casa
- Alimentação
- Transportes
- Lazer
- Outros

Exemplo:

```text
┌──────────────────────────────────────┬───────────────────────┐
│ DESPESAS DE AGOSTO                   │ ORÇAMENTO             │
│                                      │                       │
│ Casa             820 €               │ 2.870 / 3.500 €       │
│ Alimentação      540 €               │ ███████████████░░░    │
│ Transportes      320 €               │                       │
│ Lazer            210 €               │ Restam 630 €          │
│ Outros           290 €               │                       │
└──────────────────────────────────────┴───────────────────────┘
```

## Próximos movimentos

Mostrar despesas/receitas futuras:

```text
28 AGO  Prestação      -900 €
01 SET  Netflix         -13 €
05 SET  Ginásio         -80 €
```

## Objetivos

Mostrar progresso dos objetivos de poupança.

## Disponível para gastar

Uma métrica central:

```text
DISPONÍVEL PARA GASTAR

1.240 €

Até ao fim do mês

39,99 € / dia
```

O cálculo conceptual é:

```text
Saldo atual
- Despesas previstas
- Poupança planeada
= Disponível para gastar
```

E:

```text
Disponível para gastar / dias restantes
= Limite diário recomendado
```

## Filtros do dashboard

Permitir alternar:

```text
[ Agosto 2026 ▼ ]

[ Todos ] [ Vale ] [ Clara ] [ Casal ]
```

---

# 3. 💳 Transações

Esta é a página principal para consultar e lançar movimentos.

## Tipos de movimento

- Despesa
- Receita
- Transferência

## Campos

- Valor
- Descrição
- Categoria
- Subcategoria
- Conta
- Data
- Pessoa / âmbito: Vale, Clara ou Casal

## Transferências

As transferências entre contas **não são despesas**.

Exemplo:

```text
Conta Casal → Poupança Casal
500 €
```

Deve alterar o saldo das duas contas, mas não entrar nas estatísticas de despesas.

## Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Transações                                      + Movimento  │
│                                                              │
│ Saldo total                                                  │
│ 18.420 €                                                     │
│                                                              │
│ 🔎 Pesquisar...                                              │
│                                                              │
│ [Todas] [Despesas] [Receitas] [Transferências]              │
│                                                              │
│ Agosto 2026                                                  │
├──────────┬────────────────────┬─────────────┬───────────────┤
│ Data     │ Descrição          │ Categoria   │ Valor         │
├──────────┼────────────────────┼─────────────┼───────────────┤
│ 26 AGO   │ Mercadona          │ Alimentação │ -54,20 €      │
│ 25 AGO   │ Salário            │ Salário     │ +2.179 €      │
│ 24 AGO   │ Netflix            │ Lazer       │ -12,99 €      │
│ 23 AGO   │ Transferência      │ —           │ -500 €        │
└──────────┴────────────────────┴─────────────┴───────────────┘
```

## Pesquisa e filtros

Filtros:

- Texto
- Data
- Conta
- Categoria
- Pessoa
- Tipo de movimento
- Intervalo de valores

Exemplos:

```text
Mercadona
```

ou:

```text
Agosto + Alimentação
```

## Detalhe da transação

Ao clicar numa transação, abrir painel lateral:

```text
┌──────────────────────────────┐
│ MERCADONA                    │
│                              │
│ -54,20 €                     │
│                              │
│ Alimentação                  │
│ Supermercado                 │
│                              │
│ Conta Casal                  │
│ 26 Agosto 2026               │
│                              │
│ [Editar]      [Eliminar]     │
└──────────────────────────────┘
```

---

# 4. 🏦 Contas

Objetivo:

> Saber exatamente onde está o dinheiro.

Exemplo:

```text
┌─────────────────────────────────────┐
│ 👤 VALE                             │
│                                     │
│ Conta Pessoal                       │
│ 2.179 €                             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👤 CLARA                            │
│                                     │
│ Conta Pessoal                       │
│ 1.420 €                             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏠 CASAL                            │
│                                     │
│ Conta Conjunta                      │
│ 4.850 €                             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🎯 POUPANÇA                         │
│                                     │
│ Poupança Casal                      │
│ 10.000 €                            │
└─────────────────────────────────────┘

+ Adicionar conta
```

## Tipos de conta

Exemplos:

- Conta Pessoal — Vale
- Conta Pessoal — Clara
- Conta Conjunta
- Poupança — Casal
- Investimentos — Vale

## Detalhe de conta

```text
Conta Casal

Saldo
4.850 €

Este mês
+3.400 € receitas
-2.180 € despesas

[Transações]

26 AGO    Mercadona       -54 €
25 AGO    Salário       +1.700 €
...
```

Cada conta deve permitir:

- Nome
- Proprietário: Vale / Clara / Casal
- Saldo inicial
- Tipo
- Estado ativa/inativa

---

# 5. 📊 Orçamento

Área dedicada ao controlo dos gastos.

## Visão mensal

```text
Orçamento                         Agosto 2026 ▼

TOTAL

2.870 € / 3.500 €
████████████████░░░░
82%

Restante: 630 €
```

## Por categoria

```text
CASA
820 / 850 €
███████████████████░
96%

ALIMENTAÇÃO
540 / 600 €
██████████████████░░
90%

TRANSPORTES
320 / 400 €
████████████████░░░░
80%

LAZER
210 / 300 €
██████████████░░░░░░
70%
```

## Detalhe de categoria

Ao clicar em Alimentação:

```text
Alimentação

Orçamento: 600 €
Gasto: 540 €
Restante: 60 €

Histórico
──────────────
Supermercado    380 €
Restaurantes    110 €
Café             50 €

Evolução
[ gráfico últimos 6 meses ]
```

## Alertas

Exemplos:

- Alimentação: 70% do orçamento utilizado
- Lazer: orçamento ultrapassado em 42 €
- Casa: faltam apenas 30 € para atingir o limite

---

# 6. 🎯 Objetivos

Área para objetivos de poupança.

Exemplo:

```text
Objetivos

┌───────────────────────────────────────┐
│ 🏠 CASA                               │
│                                       │
│ 7.000 € / 20.000 €                    │
│ ███████░░░░░░░░░░░                    │
│                                       │
│ 35%                                   │
│ +500 € / mês                          │
│ Meta: Dezembro 2028                   │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ ✈️ FÉRIAS                             │
│                                       │
│ 1.200 € / 2.000 €                     │
│ ████████████░░░░░░                    │
│                                       │
│ 60%                                   │
└───────────────────────────────────────┘
```

## Criar objetivo

Campos:

- Nome
- Valor objetivo
- Valor inicial
- Data limite
- Conta associada
- Poupança mensal pretendida

A aplicação deve calcular:

> No ritmo atual, a meta será atingida em determinada data.

---

# 7. 👩‍❤️‍👨 Casal

Página dedicada exclusivamente às finanças conjuntas.

## Resumo

```text
FINANÇAS DO CASAL

Receitas       3.400 €
Despesas      -2.180 €
Poupança        800 €
──────────────────────
Disponível     1.220 €
```

## Contribuições

```text
CONTRIBUIÇÕES

Vale
1.900 €
55,9%

Clara
1.500 €
44,1%
```

## Despesas conjuntas

```text
Casa                  820 €
Alimentação           540 €
Transportes           320 €
Lazer                 210 €
Outros                290 €
```

## Taxa de poupança

```text
Taxa de poupança

Este mês
42,1%

Média 6 meses
36,8%

↑ +5,3 p.p.
```

---

# 8. 🔄 Recorrentes

Área para gerir movimentos automáticos.

## Lista

```text
Movimentos recorrentes

DESPESAS

Netflix
12,99 €
Mensal • dia 1
Conta Casal
● Ativo

Ginásio
80 €
Mensal • dia 5
Conta Vale
● Ativo

Seguro
23 €
Mensal • dia 10
Conta Casal
● Ativo

Prestação
900 €
Mensal • dia 28
Conta Casal
● Ativo
```

## Criar recorrente

```text
Novo movimento recorrente

Tipo
[ Despesa ]

Descrição
Netflix

Valor
12,99 €

Conta
Conta Casal

Categoria
Entretenimento

Periodicidade
Mensal

Dia
[ 01 ]

Data de início
01/09/2026

[ Criar recorrente ]
```

## Funcionamento

Cada movimento recorrente deve ter uma **data definida**.

Exemplo:

```text
Netflix
Valor: 12,99 €
Periodicidade: Mensal
Dia: 5
```

Quando chegar essa data, a aplicação deve **criar automaticamente uma nova transação real** no histórico.

Exemplo:

```text
05/09/2026
        ↓
Netflix — 12,99 €
        ↓
Nova transação criada

05/10/2026
        ↓
Netflix — 12,99 €
        ↓
Nova transação criada
```

Não deve ser apenas uma previsão.

## Campos da recorrência

Permitir:

- Tipo: despesa ou receita
- Descrição
- Valor
- Conta
- Categoria
- Subcategoria
- Periodicidade
- Dia
- Data de início
- Ativar/desativar
- Opcionalmente data de fim

## Próximos movimentos

Mostrar:

```text
Próximos 30 dias

01 SET    Netflix       -12,99 €
05 SET    Ginásio       -80,00 €
10 SET    Seguro        -23,00 €
28 SET    Prestação    -900,00 €
```

---

# 9. ⚙️ Definições

Manter simples.

```text
Definições

PERFIL
├── Vale
├── Clara
└── Casal

CATEGORIAS
├── Gerir categorias
└── Gerir subcategorias

REGRAS
└── Regras automáticas

APARÊNCIA
├── Tema
└── Moeda

DADOS
├── Exportar
├── Importar
└── Backup

SISTEMA
├── Notificações
└── Segurança
```

---

# 10. 🔔 Notificações

Criar um pequeno centro de notificações.

Exemplos:

```text
🔴 Orçamento de alimentação ultrapassado

🟠 Restam 60 € no orçamento de alimentação

🔵 Netflix criada automaticamente

🟢 Objetivo "Férias" atingiu 60%

🟠 Tens 4 despesas recorrentes nos próximos 7 dias
```

---

# 11. 🧠 Insights

Funcionalidade para uma segunda fase.

A aplicação deve analisar os dados e apresentar informação útil, não apenas gráficos.

Exemplos:

### Alimentação

> Gastaste 18% menos em alimentação do que no mês passado.

### Transportes

> Os transportes representam 14% das tuas despesas este mês.

### Poupança

> Estás a poupar 5,3 pontos percentuais acima da tua média de 6 meses.

### Previsão

> Mantendo o ritmo atual, vais terminar o mês com aproximadamente 1.420 € de saldo disponível.

---

# 12. 📱 Mobile

No mobile, simplificar a navegação.

```text
┌─────────────────────────┐
│                         │
│       Conteúdo          │
│                         │
│                         │
├─────────────────────────┤
│ 🏠    💳    ＋    📊    👤 │
│ Res.  Trans. Novo Orç. Mais│
└─────────────────────────┘
```

O botão `＋` deve ser central e muito fácil de utilizar.

---

# 13. 🎨 Design / UX

A base visual atual pode ser mantida, mas deve evoluir para uma experiência entre:

- Dashboard financeiro
- Revolut
- Notion

Sem parecer uma aplicação bancária pesada.

## Princípios

- Interface limpa
- Fundo claro/bege
- Laranja como cor principal
- Tipografia simples
- Cartões discretos
- Bastante espaço
- Números grandes
- Poucas cores
- Verde para valores positivos
- Vermelho apenas para alertas

Em vez de:

```text
Saldo: 2179.00 €
```

preferir:

```text
2 179 €

Saldo disponível
```

---

# 14. 🗄️ Estrutura conceptual do Supabase

A aplicação deve ser pensada desde o início para suportar:

- Utilizadores
- Casal / household
- Contas
- Transações
- Transferências
- Categorias
- Subcategorias
- Orçamentos
- Movimentos recorrentes
- Objetivos de poupança
- Regras automáticas
- Notificações

Estrutura conceptual:

```text
users
  │
  ├── household / couple
  │       │
  │       ├── Vale
  │       └── Clara
  │
  ├── accounts
  │       │
  │       └── transactions
  │
  ├── categories
  │
  ├── recurring_transactions
  │
  ├── budgets
  │
  ├── savings_goals
  │
  └── rules
```

O conceito principal é:

```text
VALE
  └── dinheiro pessoal

CLARA
  └── dinheiro pessoal

CASAL
  └── dinheiro conjunto
```

Isto permite separar corretamente os saldos e movimentos sem misturar dinheiro pessoal com dinheiro conjunto.

---

# 15. 🚀 Roadmap de implementação

## Fase 1 — Base

- [ ] Estruturar utilizadores / casal
- [ ] Contas
- [ ] Transações
- [ ] Categorias
- [ ] Subcategorias
- [ ] Transferências
- [ ] Receitas / despesas
- [ ] Separação pessoal vs casal

## Fase 2 — Gestão

- [ ] Dashboard
- [ ] Orçamentos
- [ ] Movimentos recorrentes
- [ ] Criação automática das transações recorrentes
- [ ] Poupanças / objetivos
- [ ] Previsão de saldo
- [ ] Próximos movimentos

## Fase 3 — Inteligência

- [ ] Regras automáticas de categorização
- [ ] Alertas
- [ ] "Quanto posso gastar?"
- [ ] Previsão do fim do mês
- [ ] Comparação mensal
- [ ] Análise de hábitos
- [ ] Insights

## Fase 4 — UX

- [ ] Adicionar movimento em 2–3 segundos
- [ ] Pesquisa instantânea
- [ ] Filtros avançados
- [ ] Atalhos
- [ ] Mobile / PWA
- [ ] Exportação
- [ ] Importação
- [ ] Backup

---

# 16. ⭐ Experiência diária ideal

O fluxo normal deve ser:

```text
Abrir app
    ↓
Ver resumo
    ↓
Lançar movimento
    ↓
Fechar
```

Exemplo:

```text
＋
↓
Despesa
↓
54,20 €
↓
Mercadona
↓
[Adicionar]
```

A aplicação pode reconhecer automaticamente:

```text
Mercadona
→ Alimentação
→ Supermercado
→ Conta Casal
```

O objetivo é que um movimento normal seja registado em poucos segundos.

Ao mesmo tempo, quando for necessário fazer uma análise mais séria, devem estar disponíveis:

```text
Resumo
   ↓
Orçamento
   ↓
Casal
   ↓
Objetivos
   ↓
Estatísticas / Insights
```

---

# 17. Prioridade para a implementação

A implementação deve privilegiar primeiro a estrutura e a lógica dos dados.

Ordem recomendada:

```text
1. Base de dados Supabase
        ↓
2. Contas
        ↓
3. Transações
        ↓
4. Transferências
        ↓
5. Categorias
        ↓
6. Recorrentes
        ↓
7. Dashboard
        ↓
8. Orçamentos
        ↓
9. Objetivos
        ↓
10. Área Casal
        ↓
11. Notificações
        ↓
12. Insights
        ↓
13. Melhorias de UX / Mobile
```

A prioridade é evitar construir interfaces que depois obriguem a alterar a estrutura da base de dados.

---

# 18. Regra principal do produto

O Vale & Clara deve cumprir duas coisas simultaneamente:

### Ser extremamente rápido para o dia a dia

> "Registar uma despesa."

### Ser extremamente útil para análise

> "Perceber onde está o nosso dinheiro e para onde está a ir."

A aplicação deve esconder a complexidade quando não é necessária e mostrar detalhe quando o utilizador o procura.
