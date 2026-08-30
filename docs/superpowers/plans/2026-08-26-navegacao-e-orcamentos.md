# Navegação Principal + Despesas Fixas + Orçamentos — Plano de Implementação

> **Para quem executa:** Este projeto ainda não tem framework de testes automatizados (ver CLAUDE.md, secção "Comandos": "Ainda não há testes configurados"). Introduzir um agora só para este plano seria complexidade que o projeto pequeno não precisa. Por isso, cada tarefa substitui "escrever teste falhado / correr testes" por: `npm run lint`, `npm run build`, e uma verificação manual no browser (`npm run dev`) do fluxo em causa.

**Objetivo:** Substituir o dashboard de página única por uma navegação lateral (Transações / Categorias / Despesas Fixas / Orçamentos) com sub-rotas, e implementar as páginas de Categorias, Despesas Fixas e Orçamentos (mensais, anuais, poupanças).

**Arquitetura:** `AppLayout` com barra lateral fixa + `<Outlet />` do react-router-dom, montado dentro da rota privada `/` já existente em `App.jsx`. Cada secção é uma rota filha (`/transacoes`, `/categorias`, `/despesas-fixas`, `/orcamentos/:tipo`). Os dados continuam no Supabase, sempre filtrados por `household_id` (RLS já trata o filtro no servidor).

**Tech Stack:** React Router (rotas aninhadas), Supabase JS, CSS já existente em `src/index.css` (tokens de cor/tipografia definidos no redesign da página de login).

**Spec:** `instructions.md` (raiz do repo) + `CLAUDE.md` (modelo de dados e stack).

## Global Constraints

- Todo o texto da UI em português de Portugal.
- Sem frameworks de teste novos — verificação manual + lint + build.
- Reutilizar os tokens CSS existentes (`--ink`, `--paper`, `--accent-a`, `--accent-b`, `--font-*`) em vez de introduzir cores/fontes novas.
- RLS já filtra por `household_id` via `is_household_member()` — as queries no cliente continuam a incluir `.eq('household_id', ...)` por clareza/performance, tal como já acontece em `Dashboard.jsx`.
- Commits só se o utilizador pedir explicitamente (política do projeto).

---

## Task 1: Alargar o schema — despesas fixas e tipos de orçamento

**Files:**
- Modify: `supabase/schema.sql`

**Interfaces:**
- Produces: tabela `fixed_expenses(id, household_id, categoria_id, descricao, valor, dia_vencimento, ativa)`; tabela `budgets` alargada com `tipo` (`mensal`/`anual`/`poupanca`) e `nome` (só para poupanças, `categoria_id` passa a opcional).

- [ ] **Step 1: Adicionar `fixed_expenses` ao schema**

Acrescentar no fim de `supabase/schema.sql`, depois da tabela `budgets`:

```sql
-- ---------------------------------------------------------------------------
-- Despesas fixas: despesas recorrentes mensais (renda, seguros, streaming...)
-- ---------------------------------------------------------------------------
create table fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  categoria_id uuid references categories (id),
  descricao text not null,
  valor numeric(12, 2) not null check (valor > 0),
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table fixed_expenses enable row level security;

create policy "membros gerem despesas fixas do household"
  on fixed_expenses for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
```

- [ ] **Step 2: Alargar `budgets` com tipo e nome (poupanças)**

Substituir a definição atual da tabela `budgets` (e a respetiva policy já existe, não mexer) por:

```sql
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  tipo text not null default 'mensal' check (tipo in ('mensal', 'anual', 'poupanca')),
  categoria_id uuid references categories (id),
  nome text,
  limite_mensal numeric(12, 2) not null check (limite_mensal > 0),
  created_at timestamptz not null default now(),
  constraint budgets_categoria_ou_nome check (
    (tipo in ('mensal', 'anual') and categoria_id is not null and nome is null) or
    (tipo = 'poupanca' and nome is not null)
  )
);
```

Remover o `unique (household_id, categoria_id)` antigo (um household pode ter um orçamento mensal e um anual para a mesma categoria).

- [ ] **Step 3: Verificar**

Correr o ficheiro completo no SQL Editor do Supabase (projeto já criado — ver `.env`). Confirmar sem erros e que `select * from fixed_expenses` e `select * from budgets` devolvem tabelas vazias.

---

## Task 2: `AppLayout` com navegação lateral

**Files:**
- Create: `src/components/AppLayout.jsx`
- Modify: `src/App.jsx`
- Modify: `src/index.css` (estilos `.app-layout`, `.sidebar`)

**Interfaces:**
- Consumes: `useAuth()` de `src/context/AuthContext.jsx` (já existe: `user`, `signOut`).
- Produces: `<AppLayout household={household} />` que renderiza `<Outlet />` para as rotas filhas; contexto `household` passado via `useOutletContext()` para as páginas filhas consumirem `{ household, refetch }`.

- [ ] **Step 1: Criar `AppLayout.jsx`**

```jsx
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const LINKS = [
  { to: '/transacoes', label: 'Transações' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/despesas-fixas', label: 'Despesas Fixas' },
  { to: '/orcamentos/mensais', label: 'Orçamentos', matchPrefix: '/orcamentos' },
]

export default function AppLayout({ household, contas, categorias, atualizar }) {
  const { signOut } = useAuth()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <p className="sidebar__household">{household.nome}</p>
        <nav>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive || (link.matchPrefix && location.pathname.startsWith(link.matchPrefix))
                  ? 'ativo'
                  : undefined
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button className="botao-link" onClick={signOut}>
          Sair
        </button>
      </aside>
      <main className="app-content">
        <Outlet context={{ household, contas, categorias, atualizar }} />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Estilos em `src/index.css`**

```css
.app-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: var(--ink);
  color: var(--paper);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar__household {
  font-family: var(--font-display);
  font-size: 1.1rem;
  margin: 0;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar nav a {
  color: #cbb9a5;
  text-decoration: none;
  padding: 0.5rem 0.6rem;
  border-radius: 6px;
  font-size: 0.92rem;
}

.sidebar nav a:hover {
  background: rgba(255, 255, 255, 0.06);
}

.sidebar nav a.ativo {
  background: var(--accent-a);
  color: white;
}

.app-content {
  padding: 2rem;
  max-width: 900px;
}

@media (max-width: 720px) {
  .app-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    overflow-x: auto;
  }

  .sidebar nav {
    flex-direction: row;
  }

  .sidebar__household {
    display: none;
  }
}
```

- [ ] **Step 3: Verificar**

`npm run lint` sem erros novos. Ainda não liga a `App.jsx` (feito na Task 3) — este passo só confirma que o ficheiro compila isoladamente (import-only, sem uso ainda não gera erro de lint).

---

## Task 3: Rotas e mover a lógica do `Dashboard` para `TransactionsPage`

**Files:**
- Modify: `src/App.jsx`
- Create: `src/pages/TransactionsPage.jsx`
- Delete: `src/pages/Dashboard.jsx` (lógica de household/contas/categorias sobe para `App.jsx`, o resto vai para `TransactionsPage.jsx`)

**Interfaces:**
- Consumes: `CreateHousehold`, `AppLayout`, `TransactionForm`, `TransactionList` (já existentes).
- Produces: `App.jsx` passa a fazer o `carregarHousehold`/`carregarDados` (movidos de `Dashboard.jsx`) e a decidir entre `CreateHousehold` e `AppLayout`; `TransactionsPage` consome `useOutletContext()` para `{ household, contas, categorias, atualizar }` e mostra `TransactionForm` + saldo + `TransactionList`.

- [ ] **Step 1: Reescrever `App.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login.jsx'
import AppLayout from './components/AppLayout.jsx'
import CreateHousehold from './components/CreateHousehold.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import FixedExpensesPage from './pages/FixedExpensesPage.jsx'
import BudgetsPage from './pages/BudgetsPage.jsx'

function EspacoPrivado() {
  const { user, session, loading } = useAuth()
  const [household, setHousehold] = useState(undefined)
  const [contas, setContas] = useState([])
  const [categorias, setCategorias] = useState([])

  async function carregarHousehold() {
    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id, households (id, nome)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    setHousehold(membership?.households ?? null)
  }

  async function carregarAuxiliares(householdId) {
    const [{ data: accs }, { data: cats }] = await Promise.all([
      supabase.from('accounts').select('*').eq('household_id', householdId),
      supabase
        .from('categories')
        .select('*')
        .or(`household_id.eq.${householdId},household_id.is.null`),
    ])
    setContas(accs ?? [])
    setCategorias(cats ?? [])
  }

  useEffect(() => {
    if (user) carregarHousehold()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (household?.id) carregarAuxiliares(household.id)
  }, [household])

  if (loading) return <p>A carregar...</p>
  if (!session) return <Navigate to="/login" replace />
  if (household === undefined) return <p>A carregar...</p>
  if (household === null) return <CreateHousehold onCriado={carregarHousehold} />

  return (
    <AppLayout
      household={household}
      contas={contas}
      categorias={categorias}
      atualizar={() => carregarAuxiliares(household.id)}
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<EspacoPrivado />}>
        <Route index element={<Navigate to="/transacoes" replace />} />
        <Route path="transacoes" element={<TransactionsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="despesas-fixas" element={<FixedExpensesPage />} />
        <Route path="orcamentos/:tipo" element={<BudgetsPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 2: Criar `src/pages/TransactionsPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'
import TransactionForm from '../components/TransactionForm.jsx'
import TransactionList from '../components/TransactionList.jsx'

export default function TransactionsPage() {
  const { household, contas, categorias } = useOutletContext()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])

  async function carregarTransacoes() {
    const { data } = await supabase
      .from('transactions')
      .select('*, categories (nome, cor), accounts (nome, tipo)')
      .eq('household_id', household.id)
      .order('data', { ascending: false })
      .limit(50)

    setTransactions(data ?? [])
  }

  useEffect(() => {
    carregarTransacoes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id])

  const saldo = transactions.reduce(
    (total, tx) => total + (tx.tipo === 'receita' ? Number(tx.valor) : -Number(tx.valor)),
    0
  )

  return (
    <div>
      <h1>Transações</h1>
      <p className="saldo">Saldo: {saldo.toFixed(2)} €</p>

      <TransactionForm
        accounts={contas}
        categories={categorias}
        householdId={household.id}
        userId={user.id}
        onCriada={carregarTransacoes}
      />

      <TransactionList transactions={transactions} />
    </div>
  )
}
```

- [ ] **Step 3: Apagar `src/pages/Dashboard.jsx`**

Já não é importado por ninguém depois do Step 1.

- [ ] **Step 4: Verificar**

`npm run lint`, `npm run build`. Depois `npm run dev`, abrir `http://localhost:5173`, confirmar: login funciona, `/` redireciona para `/transacoes`, sidebar visível, criar transação continua a funcionar e o saldo atualiza.

---

## Task 4: Página de Categorias

**Files:**
- Create: `src/pages/CategoriesPage.jsx`

**Interfaces:**
- Consumes: `useOutletContext()` → `{ household, categorias, atualizar }`.
- Produces: lista de categorias do household (as globais aparecem só como referência, não editáveis) + formulário para criar categoria nova (`nome`, `tipo`, `cor`).

- [ ] **Step 1: Criar `src/pages/CategoriesPage.jsx`**

```jsx
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function CategoriesPage() {
  const { household, categorias, atualizar } = useOutletContext()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('despesa')
  const [cor, setCor] = useState('#4f86a0')
  const [erro, setErro] = useState(null)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase
      .from('categories')
      .insert({ household_id: household.id, nome, tipo, cor })

    if (error) {
      setErro(error.message)
      return
    }

    setNome('')
    atualizar()
  }

  const proprias = categorias.filter((c) => c.household_id === household.id)
  const globais = categorias.filter((c) => c.household_id === null)

  return (
    <div>
      <h1>Categorias</h1>

      <form onSubmit={submeter} className="transaction-form">
        <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="despesa">Despesa</option>
          <option value="receita">Receita</option>
        </select>
        <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} />
        <button type="submit" className="botao-primario">
          Adicionar
        </button>
      </form>
      {erro && <p className="erro">{erro}</p>}

      <h2>As tuas categorias</h2>
      <ul className="categoria-lista">
        {proprias.map((c) => (
          <li key={c.id}>
            <span className="categoria-cor" style={{ background: c.cor }} /> {c.nome}
          </li>
        ))}
      </ul>

      <h2>Categorias predefinidas</h2>
      <ul className="categoria-lista">
        {globais.map((c) => (
          <li key={c.id}>
            <span className="categoria-cor" style={{ background: c.cor }} /> {c.nome}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Estilo `.categoria-lista` em `src/index.css`**

```css
.categoria-lista {
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.categoria-lista li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  background: var(--paper-alt);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.85rem;
}

.categoria-cor {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
```

- [ ] **Step 3: Verificar**

`npm run lint`, `npm run build`, depois no browser: ir a "Categorias", criar uma categoria nova, confirmar que aparece em "As tuas categorias" e que passa a estar disponível no `TransactionForm`.

---

## Task 5: Página de Despesas Fixas

**Files:**
- Create: `src/pages/FixedExpensesPage.jsx`

**Interfaces:**
- Consumes: `useOutletContext()` → `{ household, categorias }`.
- Produces: CRUD simples (criar + listar + marcar inativa) sobre a tabela `fixed_expenses` da Task 1.

- [ ] **Step 1: Criar `src/pages/FixedExpensesPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function FixedExpensesPage() {
  const { household, categorias } = useOutletContext()
  const [despesas, setDespesas] = useState([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [diaVencimento, setDiaVencimento] = useState('1')
  const [erro, setErro] = useState(null)

  const categoriasDespesa = categorias.filter((c) => c.tipo === 'despesa')

  async function carregar() {
    const { data } = await supabase
      .from('fixed_expenses')
      .select('*, categories (nome, cor)')
      .eq('household_id', household.id)
      .order('dia_vencimento')

    setDespesas(data ?? [])
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id])

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase.from('fixed_expenses').insert({
      household_id: household.id,
      descricao,
      valor: Number(valor),
      categoria_id: categoriaId || null,
      dia_vencimento: Number(diaVencimento),
    })

    if (error) {
      setErro(error.message)
      return
    }

    setDescricao('')
    setValor('')
    carregar()
  }

  async function alternarAtiva(despesa) {
    await supabase.from('fixed_expenses').update({ ativa: !despesa.ativa }).eq('id', despesa.id)
    carregar()
  }

  const totalMensal = despesas.filter((d) => d.ativa).reduce((t, d) => t + Number(d.valor), 0)

  return (
    <div>
      <h1>Despesas Fixas</h1>
      <p className="saldo">Total mensal: {totalMensal.toFixed(2)} €</p>

      <form onSubmit={submeter} className="transaction-form">
        <input
          placeholder="Descrição (ex: Renda)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Valor (€)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />
        <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          <option value="">Sem categoria</option>
          {categoriasDespesa.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          max="31"
          value={diaVencimento}
          onChange={(e) => setDiaVencimento(e.target.value)}
          title="Dia do mês de vencimento"
        />
        <button type="submit" className="botao-primario">
          Adicionar
        </button>
      </form>
      {erro && <p className="erro">{erro}</p>}

      <table className="transaction-list">
        <thead>
          <tr>
            <th>Dia</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Ativa</th>
          </tr>
        </thead>
        <tbody>
          {despesas.map((d) => (
            <tr key={d.id} style={{ opacity: d.ativa ? 1 : 0.5 }}>
              <td>{d.dia_vencimento ?? '—'}</td>
              <td>{d.descricao}</td>
              <td>{d.categories?.nome ?? '—'}</td>
              <td>{Number(d.valor).toFixed(2)} €</td>
              <td>
                <button type="button" className="botao-link" onClick={() => alternarAtiva(d)}>
                  {d.ativa ? 'Desativar' : 'Reativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

`npm run lint`, `npm run build`, depois no browser: criar uma despesa fixa, confirmar total mensal correto, desativar/reativar.

---

## Task 6: Página de Orçamentos (mensais / anuais / poupanças)

**Files:**
- Create: `src/pages/BudgetsPage.jsx`
- Modify: `src/components/AppLayout.jsx` (sub-links de Orçamentos)

**Interfaces:**
- Consumes: `useOutletContext()` → `{ household, categorias }`; `useParams()` → `tipo` (`mensais` | `anuais` | `poupancas`).
- Produces: por tipo `mensal`/`anual`, formulário liga a uma categoria de despesa + limite, com barra de progresso face ao gasto real do mês/ano corrente (soma de `transactions`); por tipo `poupanca`, formulário só pede `nome` (ex: "Férias", "Casa") + objetivo.

- [ ] **Step 1: Sub-navegação em `AppLayout.jsx`**

Substituir a entrada única de Orçamentos em `LINKS` por três:

```jsx
const LINKS = [
  { to: '/transacoes', label: 'Transações' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/despesas-fixas', label: 'Despesas Fixas' },
]

const ORCAMENTO_LINKS = [
  { to: '/orcamentos/mensais', label: 'Mensais' },
  { to: '/orcamentos/anuais', label: 'Anuais' },
  { to: '/orcamentos/poupancas', label: 'Poupanças' },
]
```

E no JSX da `<nav>`, depois do `.map(LINKS)`, acrescentar um grupo:

```jsx
<p className="sidebar__grupo">Orçamentos</p>
{ORCAMENTO_LINKS.map((link) => (
  <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'ativo' : undefined)}>
    {link.label}
  </NavLink>
))}
```

(Remove a entrada `{ to: '/orcamentos/mensais', label: 'Orçamentos', matchPrefix: ... }` do bloco `LINKS` original da Task 2 — substituída por este grupo.)

Estilo extra em `src/index.css`:

```css
.sidebar__grupo {
  margin: 0.5rem 0 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8a7565;
}
```

- [ ] **Step 2: Criar `src/pages/BudgetsPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const TIPO_POR_ROTA = { mensais: 'mensal', anuais: 'anual', poupancas: 'poupanca' }

export default function BudgetsPage() {
  const { tipo: tipoRota } = useParams()
  const tipo = TIPO_POR_ROTA[tipoRota] ?? 'mensal'
  const { household, categorias } = useOutletContext()

  const [budgets, setBudgets] = useState([])
  const [gastoPorCategoria, setGastoPorCategoria] = useState({})
  const [categoriaId, setCategoriaId] = useState('')
  const [nome, setNome] = useState('')
  const [limite, setLimite] = useState('')
  const [erro, setErro] = useState(null)

  const categoriasDespesa = categorias.filter((c) => c.tipo === 'despesa')

  async function carregar() {
    const { data } = await supabase
      .from('budgets')
      .select('*, categories (nome, cor)')
      .eq('household_id', household.id)
      .eq('tipo', tipo)

    setBudgets(data ?? [])

    if (tipo !== 'poupanca') {
      const inicio =
        tipo === 'mensal'
          ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
          : `${new Date().getFullYear()}-01-01`

      const { data: txs } = await supabase
        .from('transactions')
        .select('categoria_id, valor')
        .eq('household_id', household.id)
        .eq('tipo', 'despesa')
        .gte('data', inicio)

      const totais = {}
      for (const tx of txs ?? []) {
        totais[tx.categoria_id] = (totais[tx.categoria_id] ?? 0) + Number(tx.valor)
      }
      setGastoPorCategoria(totais)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id, tipo])

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    const payload =
      tipo === 'poupanca'
        ? { household_id: household.id, tipo, nome, limite_mensal: Number(limite) }
        : { household_id: household.id, tipo, categoria_id: categoriaId, limite_mensal: Number(limite) }

    const { error } = await supabase.from('budgets').insert(payload)

    if (error) {
      setErro(error.message)
      return
    }

    setNome('')
    setLimite('')
    setCategoriaId('')
    carregar()
  }

  const titulo = { mensal: 'Orçamentos Mensais', anual: 'Orçamentos Anuais', poupanca: 'Poupanças' }[tipo]

  return (
    <div>
      <h1>{titulo}</h1>

      <form onSubmit={submeter} className="transaction-form">
        {tipo === 'poupanca' ? (
          <input
            placeholder="Nome do objetivo (ex: Férias, Casa)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        ) : (
          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
            <option value="">Categoria</option>
            {categoriasDespesa.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        )}
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder={tipo === 'poupanca' ? 'Objetivo (€)' : 'Limite (€)'}
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
          required
        />
        <button type="submit" className="botao-primario">
          Adicionar
        </button>
      </form>
      {erro && <p className="erro">{erro}</p>}

      <div className="budget-lista">
        {budgets.map((b) => {
          const gasto = tipo === 'poupanca' ? 0 : gastoPorCategoria[b.categoria_id] ?? 0
          const percentagem = Math.min(100, Math.round((gasto / Number(b.limite_mensal)) * 100))

          return (
            <div key={b.id} className="budget-item">
              <div className="budget-item__cabecalho">
                <span>{tipo === 'poupanca' ? b.nome : b.categories?.nome}</span>
                <span>
                  {tipo === 'poupanca'
                    ? `Objetivo: ${Number(b.limite_mensal).toFixed(2)} €`
                    : `${gasto.toFixed(2)} € / ${Number(b.limite_mensal).toFixed(2)} €`}
                </span>
              </div>
              {tipo !== 'poupanca' && (
                <div className="budget-item__barra">
                  <div
                    className="budget-item__progresso"
                    style={{
                      width: `${percentagem}%`,
                      background: percentagem >= 100 ? 'var(--danger)' : 'var(--accent-b)',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Estilos `.budget-*` em `src/index.css`**

```css
.budget-lista {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.budget-item {
  padding: 0.9rem 1rem;
  background: var(--paper-alt);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.budget-item__cabecalho {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-family: var(--font-mono);
}

.budget-item__barra {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.budget-item__progresso {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}
```

- [ ] **Step 4: Verificar**

`npm run lint`, `npm run build`, depois no browser: criar um orçamento mensal para uma categoria com transações já lançadas, confirmar que a barra de progresso reflete o gasto real; criar uma poupança "Férias" e confirmar que aparece sem barra de progresso.

---

## Self-Review

- **Cobertura do `instructions.md`:** login (já feito antes deste plano) ✅ · barra lateral com Transações (Inserir despesa/rendimento ✅ já existia, Ver Budget mensal → coberto pelas rotas `/orcamentos/mensais`) ✅ · Categorias ✅ (Task 4) · Despesas Fixas ✅ (Task 5) · Orçamentos Mensais/Anuais/Poupanças (Férias, Casa, ...) ✅ (Task 6, `nome` livre cobre qualquer objetivo) · Transações por conta, despesa/rendimento, somas ✅ (já existia, mantido na Task 3).
- **Placeholders:** nenhum "TBD"/"implementar depois" — todos os passos têm código completo.
- **Consistência de tipos:** `atualizar()` (App→AppLayout→páginas) usado com o mesmo nome em todas as tasks; `useOutletContext()` devolve sempre `{ household, contas, categorias, atualizar }`; `tipo` de `budgets` (`'mensal' | 'anual' | 'poupanca'`) consistente entre schema (Task 1) e `BudgetsPage` (Task 6).
