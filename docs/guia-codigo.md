# Guia do código

Referência rápida do que cada ficheiro faz, para saber onde mexer sem ter de reler tudo. Para o modelo de dados, RLS e as fases do produto, ver `CLAUDE.md` e `docs/especificacao-produto.md`.

## Entrada da aplicação

| Ficheiro | O que faz |
|---|---|
| `src/main.jsx` | Ponto de entrada. Aplica o tema guardado (`aplicarTema`) antes do primeiro render, para não haver flash de tema errado. Monta `<BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>`. |
| `src/App.jsx` | Define as rotas. `EspacoPrivado` é o componente que protege tudo o que precisa de sessão: carrega o `household` do utilizador, as `accounts`/`categories`/`category_rules`, corre `gerarTransacoesRecorrentes` uma vez por sessão, e só depois renderiza `AppLayout` com esses dados via `<Outlet context={...}>`. Se o utilizador autenticado não tiver `household_members` (não deve acontecer em uso normal), mostra um aviso em vez de rotas. |
| `src/index.css` | Toda a folha de estilos da app — paleta "Orgânico/Natural", tokens de cor com variantes `[data-theme='dark']`. |

## `src/context/`

| Ficheiro | O que faz |
|---|---|
| `AuthContext.jsx` | `AuthProvider` + hook `useAuth()`. Só expõe `signInWithPassword` e `signOut` (sem `signUp` — não há registo público). Escuta `supabase.auth.onAuthStateChange` para manter a sessão sincronizada. |

## `src/lib/` — lógica sem UI, reutilizada por várias páginas

| Ficheiro | O que faz |
|---|---|
| `supabaseClient.js` | Cria e exporta o cliente Supabase a partir de `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. Rebenta cedo (erro explícito) se o `.env` não estiver preenchido. |
| `saldo.js` | `saldoDaConta(conta, transacoes)` — saldo inicial + soma dos movimentos da conta; transferências só contam para a conta de origem (saída) ou destino (entrada). Usado por `notifications.js`, `AccountsPage`, `GoalsPage`, `SummaryPage` e `TransactionsPage`, para não haver a mesma fórmula copiada em cada página. |
| `datas.js` | `dentroDoMes(dataISO, referencia)` — compara ano/mês de uma data ISO com uma data de referência. Usado em `notifications.js`, `CouplePage` e `SummaryPage`. |
| `recorrentes.js` | `gerarTransacoesRecorrentes(householdId, userId)` — ao abrir a app, cria as transações reais em falta para cada despesa fixa ativa, desde `ultima_geracao` (ou `data_inicio`) até hoje, uma por mês, e atualiza `ultima_geracao`. Idempotente: correr várias vezes (ex. os dois membros a abrir a app ao mesmo tempo) não duplica lançamentos. |
| `notifications.js` | `gerarNotificacoes(householdId)` — calcula em tempo real (não fica guardado em lado nenhum) alertas de: orçamento mensal ultrapassado ou a ≥80%, despesas fixas a vencer nos próximos 7 dias, objetivos que atingiram ≥75%/100%. |
| `theme.js` | `obterTemaInicial()` (localStorage, ou preferência do sistema) / `aplicarTema(tema)` (aplica `data-theme` no `<html>` + guarda). |
| `accountIcons.js` | `obterIcone(contaId)` / `definirIcone(contaId, icone)` — ícone do cartão de conta, guardado só em `localStorage` (nunca na base de dados, é puramente visual e por dispositivo). |

## `src/components/` — peças reutilizadas por mais do que uma página

| Ficheiro | O que faz |
|---|---|
| `AppLayout.jsx` | Sidebar de navegação (links fixos + submenu de Orçamentos), toggle de tema, sino de notificações, botão de sair. Passa `household`/`contas`/`categorias`/`regras`/`atualizar` a todas as páginas filhas via `<Outlet context={...}>`, lido com `useOutletContext()`. |
| `NotificationsBell.jsx` | Dropdown de notificações; chama `gerarNotificacoes` quando o `householdId` muda e mostra a lista (ou "Sem novidades"). |
| `CategoryPieChart.jsx` | Gráfico de pizza (recharts) de despesas por categoria; recebe `dados = [{ nome, valor, cor }]`. Reutilizado no Resumo e na página Casal. |
| `AccountCard.jsx` | Cartão de uma conta: escolher ícone (popup de emojis), ver saldo, editar (nome/saldo inicial), ativar/desativar. |
| `TransactionForm.jsx` | Formulário de criar transação (despesa/receita/transferência). A conta de origem é controlada pelo componente pai (`accountId`/`onAccountChange`), só lista contas ativas, e sugere categoria com base nas `category_rules` quando a descrição muda (`alterarDescricao`) — só sugere, nunca substitui uma categoria já escolhida. |
| `TransactionList.jsx` | Tabela de transações. `sinalEcor(tx, contaEmFoco)` decide o sinal (+/-) e a cor de cada valor: receita/despesa são fixos, transferência depende de a conta em foco ser a origem (sai, vermelho) ou o destino (entra, verde). Se receber `onAtualizado`, ativa edição inline por linha (`LinhaEdicao`, componente interno). |

## `src/pages/` — uma por rota

| Ficheiro | Rota | O que faz |
|---|---|---|
| `Login.jsx` | `/login` | Só formulário de entrar (sem registo). |
| `SummaryPage.jsx` | `/resumo` | Página inicial: património, saldo pessoal vs. casal, receitas/despesas/poupança do período com evolução face ao mês anterior, despesas por categoria (gráfico), progresso do orçamento mensal, "disponível para gastar" + limite diário, insights, próximos vencimentos. Tem filtros de âmbito (Tudo/A minha conta/Casal) e de período (mês atual/tudo/intervalo) — os insights ignoram esses filtros e comparam sempre mês atual vs. anterior. |
| `TransactionsPage.jsx` | `/transacoes` | Transações de uma conta à vez (escolhida no `TransactionForm`), com saldo, filtro de datas, pesquisa por texto e a `TransactionList` com edição inline. |
| `CouplePage.jsx` | `/casal` | Resumo do mês só das contas `casal`: receitas/despesas/poupança, contribuições por pessoa (via `household_members.nome`), despesas conjuntas por categoria (gráfico), taxa de poupança vs. média de 6 meses. |
| `AccountsPage.jsx` | `/contas` | Criar contas (pessoal/casal) e listar as existentes em grelha (`AccountCard`), separadas em "As tuas contas pessoais" e "Contas casal". |
| `CategoriesPage.jsx` | `/categorias` | Criar/editar categorias e subcategorias (`CategoriaEditavel`, componente interno com edição inline), e gerir as regras de categorização automática (`category_rules`). |
| `FixedExpensesPage.jsx` | `/despesas-fixas` | CRUD de despesas fixas (conta, categoria, dia de vencimento), com edição inline na tabela. É a fonte de dados que `gerarTransacoesRecorrentes` usa para criar as transações reais. |
| `BudgetsPage.jsx` | `/orcamentos/mensais` e `/orcamentos/anuais` | Um único componente para os dois tipos — `tipo` vem do parâmetro de rota (`TIPO_POR_ROTA`). Limite por categoria com barra de progresso face ao gasto real. |
| `GoalsPage.jsx` | `/objetivos` | Metas de poupança ligadas a uma conta real — o "já poupado" é sempre `saldoDaConta` dessa conta, nunca um contador à parte. `ritmoMensalAtual` calcula a variação líquida média dos últimos 6 meses para prever a data de conclusão (o `contribuicao_mensal` introduzido pelo utilizador é só mostrado como referência, não entra na previsão). |

## `scripts/`

| Ficheiro | O que faz |
|---|---|
| `reset-password.js` | Utilitário Node de uso único (correr manualmente, nunca a partir da app) para definir a password de um utilizador diretamente via Supabase Admin API — necessário porque não há ecrã de registo nem fluxo de "esqueci-me da password" por email. Precisa de `SUPABASE_URL` e `SUPABASE_SECRET_KEY` (a secret key, nunca a anon key) como variáveis de ambiente; nunca commitar a secret key. Uso: `node scripts/reset-password.js email@exemplo.com novaPassword`. |

## `supabase/schema.sql`

Schema completo (tabelas, RLS, funções `is_household_member()`/`can_access_account()`) + seeding do Vale e da Clara comentado no fim do ficheiro. Corre-se no SQL editor do projeto Supabase (um projeto por ambiente — produção e cada ambiente local isolado têm o seu próprio).

## Padrões a manter ao adicionar/editar código

- **Saldo de conta**: usar sempre `saldoDaConta` de `src/lib/saldo.js`, nunca reimplementar o reduce.
- **Comparar datas por mês**: usar `dentroDoMes` de `src/lib/datas.js`.
- **Só contas ativas** (`conta.ativa === true`) devem aparecer nos `<select>` de escolher conta (criar transação, despesa fixa, objetivo) — ver o padrão `contasAtivas = contas.filter((c) => c.ativa)` já usado em várias páginas.
- **Privacidade de contas**: a UI já reflete a RLS (`accounts pessoal` só aparecem/editam-se para o dono), mas a fonte de verdade da privacidade é sempre a policy no Supabase, não a UI.
- **Sem comentários óbvios**: só comentar o "porquê" quando não é evidente pelo nome das variáveis/funções (ver exemplos em `saldo.js`, `recorrentes.js`, `notifications.js`).
