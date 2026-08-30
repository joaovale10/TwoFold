# CLAUDE.md

Este ficheiro fornece orientações ao Claude Code (claude.ai/code) para trabalhar neste repositório.

## Idioma

Toda a comunicação com o utilizador deve ser feita em **português de Portugal** (não brasileiro, não inglês) — vocabulário, ortografia e conjugações europeias (ex.: "utilizador" e não "usuário", "ecrã" e não "tela", "ficheiro" e não "arquivo").

## Estado do projeto

App React + Vite + Supabase a compilar (`npm run build`/`npm run lint` a passar). Projeto Supabase já criado, `.env` preenchido. Login funcional, navegação lateral com Transações/Contas/Categorias/Despesas Fixas/Orçamentos. **Falta:** correr o `supabase/schema.sql` atual (mudou várias vezes — confirmar que a versão em produção tem `budgets.tipo`/`nome`, `fixed_expenses` e as policies de privacidade de `accounts`/`transactions`), seed do Vale e da Clara (ver fim do `schema.sql`), deploy no Vercel.

## Objetivo do projeto

Uma aplicação web de finanças pessoais e de casal, simples e **100% gratuita** (receitas, despesas, orçamentos, objetivos de poupança), em português — "Website Financeiro (Casal + Pessoal)".

## Stack planeada

- **Frontend:** React + Vite (ou HTML/CSS/JS simples)
- **Backend/DB/Auth:** Supabase (Postgres + Auth incluída) — sem backend próprio planeado
- **Hosting:** Vercel (frontend), deploy automático a cada `git push`
- **Gráficos:** `recharts` ou `chart.js`

O plano opta explicitamente por Supabase em vez de um backend Node/Express próprio para evitar gestão de servidor, e pelo subdomínio gratuito do Vercel em vez de domínio próprio, para manter o custo a zero.

## Modelo de dados (Supabase/Postgres)

```
users (gerido pelo Supabase Auth) — só 2 utilizadores fixos: Vale e Clara, sem registo público

households (id, nome)
household_members (household_id, user_id, nome [ex: "Vale"/"Clara", usado na página Casal])

accounts (id, household_id, owner_user_id [null = casal], tipo [pessoal/casal], nome, saldo_inicial, ativa)

categories (id, household_id [null = global], parent_id [subcategoria], nome, tipo [receita/despesa], cor)

transactions (
  id, household_id, account_id, conta_destino_id [só em transferências], user_id,
  tipo [receita/despesa/transferencia], valor, categoria_id, data, descricao
)

budgets (id, household_id, tipo [mensal/anual], categoria_id, limite_mensal)

fixed_expenses (id, household_id, account_id, categoria_id, descricao, valor, dia_vencimento, data_inicio, ultima_geracao, ativa)

savings_goals (id, household_id, account_id, nome, valor_objetivo, data_limite, contribuicao_mensal)

category_rules (id, household_id, padrao, categoria_id)
```

Pontos-chave de design:
- Os dados são delimitados por `household_id` (RLS via `is_household_member()`), não apenas por `user_id` — há sempre um único household partilhado pelo Vale e pela Clara.
- **Privacidade por conta:** dentro do mesmo household, uma conta `pessoal` só é visível/editável por quem é o `owner_user_id`; a conta `casal` é visível/editável por ambos. As transações herdam essa privacidade através do `account_id` (função `can_access_account()` no schema). `budgets`, `categories` e `fixed_expenses` continuam totalmente partilhados entre os dois membros — a privacidade só existe ao nível de `accounts`/`transactions`.
- Sem registo público: a app não tem ecrã de "criar conta". Os 2 utilizadores e o household são criados uma vez via SQL (ver secção de seeding no fim de `supabase/schema.sql`).
- **Transferências** (`tipo = 'transferencia'`) movem dinheiro entre `account_id` e `conta_destino_id` sem contar como despesa/receita nas somas — ficam de fora de qualquer soma que filtre por `tipo in ('receita','despesa')`.
- Existe um documento de especificação mais amplo, `docs/especificacao-produto.md`, com o produto completo em 4 fases. A implementação segue esse roadmap por fases — não tentar tudo de uma vez. O que falta das Fases 3/4 está detalhado em `docs/roadmap.md`.

## Funcionalidades

1. Login (só entrar — sem registo, só existem o Vale e a Clara)
2. **Resumo** (`/resumo`, página inicial): património, saldo pessoal vs. casal, receitas/despesas/poupança do mês com evolução face ao mês anterior, despesas por categoria, orçamento mensal, "disponível para gastar" + limite diário, próximos vencimentos de despesas fixas — com filtro Tudo/A minha conta/Casal
3. Transações por conta (receita/despesa/transferência: valor, categoria, data, descrição), com saldo, filtro de datas (De/Até ou "Todas as datas"), pesquisa por texto e edição inline
4. **Casal** (`/casal`): resumo do mês só das contas `casal` — receitas, despesas, poupança/disponível, contribuições por pessoa (usa `household_members.nome`), despesas conjuntas por categoria, taxa de poupança vs. média de 6 meses
5. Contas: cartões lado a lado (`AccountCard.jsx`), cada um cria as suas contas pessoais (privadas) e contas casal (partilhadas), com saldo inicial, ícone (só visual, `localStorage`, não vai para a BD) e estado ativa/inativa — editável (nome, saldo inicial); saldo de cada conta = saldo inicial + movimentos (incluindo transferências); **só contas ativas aparecem nos dropdowns de escolher conta** ao criar transações, despesas fixas ou objetivos
6. Categorias com subcategorias (predefinidas + personalizáveis) — uma subcategoria pode ter como categoria-mãe tanto uma categoria própria como uma predefinida
7. Despesas Fixas / Recorrentes (`/despesas-fixas`): cada despesa fixa tem `account_id`, `dia_vencimento`, `data_inicio` e `ultima_geracao`. Ao carregar a app (`App.jsx` → `gerarTransacoesRecorrentes` em `src/lib/recorrentes.js`), gera automaticamente as transações reais em falta desde `ultima_geracao` (ou `data_inicio`) até hoje, uma por mês, e atualiza `ultima_geracao` — idempotente, seguro correr em cada load
8. Orçamentos: Mensais e Anuais (por categoria, com progresso face ao gasto real)
9. **Objetivos** (`/objetivos`, tabela `savings_goals`): cada objetivo liga-se a uma conta real (`account_id`) — o "valor já poupado" é sempre o saldo dessa conta, não um contador à parte. Tem `valor_objetivo`, `data_limite` e `contribuicao_mensal` opcionais; a previsão de quando a meta é atingida usa o ritmo real dos últimos 6 meses de movimentos na conta (`ritmoMensalAtual` em `GoalsPage.jsx`), não o valor pretendido introduzido pelo utilizador (esse só é mostrado como referência)
10. **Regras de categorização** (tabela `category_rules`, geridas em `/categorias`): se a descrição de uma transação contiver o padrão da regra, `TransactionForm` sugere automaticamente a categoria (só sugere — nunca substitui uma categoria já escolhida manualmente)
11. **Notificações** (sino na sidebar, `NotificationsBell.jsx` + `src/lib/notifications.js`): calculadas em tempo real (não ficam guardadas) — orçamento mensal ultrapassado ou a ≥80%, despesas fixas a vencer nos próximos 7 dias, objetivos que atingiram ≥75%/100%
12. **Insights** (cartão no Resumo, calculados em `SummaryPage.jsx`): peso da maior categoria de despesa, comparação dessa categoria com o mês anterior, variação da taxa de poupança vs. mês anterior, previsão do saldo disponível no fim do mês — sempre comparados mês atual vs. mês anterior, independentemente do filtro de período da página
13. **Gráficos** (`CategoryPieChart.jsx`, `recharts`): gráfico de despesas por categoria no Resumo e na página Casal
14. **Modo escuro**: toggle 🌙/☀️ na sidebar (`AppLayout.jsx`); tokens de cor flippable em `[data-theme='dark']` (`src/index.css`) — `--panel-dark`/`--panel-dark-text` são fixos nos dois temas (sidebar, hero do login, cartões em destaque continuam sempre escuros); preferência guardada em `localStorage` via `src/lib/theme.js`, aplicada em `main.jsx` antes do primeiro render para não haver flash
15. **PWA**: `vite-plugin-pwa` (grátis), instalável — manifest + service worker gerados automaticamente no `npm run build`
16. **Pesquisa** em `/transacoes`, por descrição ou nome de categoria

Paleta "Orgânico/Natural": fundo bege claro (`--paper` `#f4f1ea`), texto castanho escuro (`--ink` `#3e3529`), acento verde-oliva único (`--accent` `#556b2f`) — ver `src/index.css`.

Todos os itens das Fases 1-4 do `docs/especificacao-produto.md` estão feitos, exceto importação de extratos bancários (deixada para depois de propósito) e deteção de gastos fora do padrão. Ver `docs/roadmap.md`.

## Comandos

```
npm install       # instalar dependências
npm run dev       # servidor de desenvolvimento (precisa de .env preenchido)
npm run build     # build de produção (dist/), não precisa de .env válido
npm run lint      # eslint
npm run preview   # pré-visualizar o build de produção
```

Ainda não há testes configurados.

## Estrutura do código

```
src/
  main.jsx                 # entry point, monta BrowserRouter + AuthProvider
  App.jsx                   # rotas: /login (público) + EspacoPrivado (carrega household/contas/categorias, gera recorrentes)
  context/AuthContext.jsx   # sessão Supabase Auth, expõe useAuth() (só signInWithPassword + signOut, sem signUp)
  lib/
    supabaseClient.js        # cliente Supabase (lê VITE_SUPABASE_URL/ANON_KEY)
    recorrentes.js            # gerarTransacoesRecorrentes() — cria transações reais em falta a partir de fixed_expenses
    notifications.js          # gerarNotificacoes() — calcula notificações em tempo real (orçamentos, despesas fixas, objetivos)
    theme.js                  # obterTemaInicial()/aplicarTema() — modo escuro via [data-theme] + localStorage
    accountIcons.js            # obterIcone()/definirIcone() — ícone do cartão de conta, só em localStorage, nunca na BD
  pages/
    Login.jsx                # só "Entrar" — sem ecrã de registo
    SummaryPage.jsx           # /resumo (página inicial): património, receitas/despesas/poupança, disponível, categorias, insights
    TransactionsPage.jsx      # /transacoes: saldo da conta, TransactionForm + TransactionList (com edição inline), filtro de datas + pesquisa
    CouplePage.jsx            # /casal: resumo, contribuições por pessoa, despesas conjuntas, taxa de poupança
    AccountsPage.jsx          # /contas: cartões em grelha (AccountCard) por conta pessoal/casal, saldo, ativa/inativa
    CategoriesPage.jsx        # /categorias: criar/editar categorias + subcategorias + regras de categorização automática
    FixedExpensesPage.jsx     # /despesas-fixas: CRUD de despesas fixas (conta, categoria, dia de vencimento), edição inline na tabela
    BudgetsPage.jsx           # /orcamentos/:tipo (mensais|anuais): limite por categoria, progresso face ao gasto real
    GoalsPage.jsx             # /objetivos: metas de poupança ligadas a uma conta real, com previsão de data
  components/
    AppLayout.jsx            # sidebar de navegação + toggle de tema + sino de notificações + <Outlet context={{ household, contas, categorias, regras, atualizar }} />
    NotificationsBell.jsx    # dropdown de notificações na sidebar
    CategoryPieChart.jsx     # gráfico de pizza (recharts) reutilizado no Resumo e na página Casal
    AccountCard.jsx          # cartão de conta: ícone (localStorage), saldo, editar (nome/saldo inicial), ativar/desativar
    TransactionForm.jsx      # criar transação (despesa/receita/transferência), conta controlada pelo pai, sugere categoria via regras; só lista contas ativas
    TransactionList.jsx      # tabela de transações, com edição inline por linha quando recebe `onAtualizado`
supabase/schema.sql           # schema completo + RLS + seeding do Vale/Clara (comentado no fim), corre no SQL editor do Supabase
scripts/reset-password.js     # script pontual para repor a password de um utilizador via Supabase Admin API
docs/
  especificacao-produto.md    # spec original completa (4 fases) que guia a implementação
  roadmap.md                   # o que falta
  plano-inicial.md             # plano inicial de stack/custos (histórico, pré-especificação)
  instrucoes-fase1.md          # to-do original que arrancou a Fase 1 (histórico)
  superpowers/plans/            # planos de implementação gerados durante o desenvolvimento
```

Fluxo de dados: `App.jsx` (`EspacoPrivado`) carrega o `household` do utilizador autenticado (via `household_members`) e as `accounts`/`categories`; passa tudo a `AppLayout`, que expõe via `useOutletContext()` a cada página filha. Não há mais fluxo de criação de household pela UI — se um utilizador autenticado não tiver `household_members`, mostra-se uma mensagem a pedir para contactar quem fez a configuração inicial (isto não deve acontecer em uso normal, só há 2 utilizadores e ambos são seedados por SQL). RLS cobre dois níveis: `is_household_member(household_id)` (todas as tabelas) e `can_access_account(account_id)` (só `accounts`/`transactions`, para a privacidade das contas pessoais).

## Próximos passos (não feitos ainda)

- Confirmar que `supabase/schema.sql` foi corrido na versão atual (mudou várias vezes — última alteração: `savings_goals`, `budgets` sem tipo `poupanca`) e correr o seeding do Vale/Clara.
- Fases 3/4 do produto — ver `docs/roadmap.md`.
- Deploy no Vercel.

## Como trabalhar neste projeto

### Perfil esperado

Atua como especialista em desenvolvimento web full-stack, engenharia de dados e Python — as três áreas relevantes para este projeto (frontend React/Vite, modelação de dados em Postgres/Supabase, e eventuais scripts/automatizações em Python, ex. para migrações, importação de extratos bancários ou análise de dados). Aplica boas práticas de cada área (schema design normalizado, políticas RLS no Supabase, componentes React reutilizáveis, tipagem, tratamento de datas/moedas) sem introduzir complexidade que o projeto — pequeno e de uso pessoal — não precisa.

### Minimização de tokens e simplificação

- Respostas diretas e concisas: sem preâmbulos, sem repetir o que foi pedido, sem secções desnecessárias em respostas simples.
- Preferir diffs/edições pontuais a reescrever ficheiros inteiros quando a alteração é pequena.
- Não gerar comentários óbvios no código; só comentar o "porquê" quando não é evidente pelo nome das variáveis/funções.
- Não criar documentação, resumos ou ficheiros intermédios que não foram pedidos.
- Ao chamar ferramentas ou APIs (incluindo a própria API da Supabase ou de LLMs, se vierem a ser usadas), preferir pedidos batched/paginados a chamadas repetidas desnecessárias, e pedir só os campos/colunas necessários (`select` explícito em vez de `select *`).
- Manter prompts (system prompts, instruções para funcionalidades de IA, se existirem) curtos e objetivos — sem contexto redundante que já esteja disponível por outra via.

### Registo de alterações

Sempre que se implementa ou altera algo de relevante no código (feature, refactor, bugfix), acrescentar uma entrada no topo de `docs/CHANGELOG.md` a resumir o que foi feito e porquê — não é um diff, é para se perceber rapidamente o histórico sem reler código ou sessões antigas. Isto é uma exceção deliberada à regra acima de "não criar documentação não pedida": este ficheiro específico deve ser mantido sempre atualizado, por pedido explícito do utilizador.
