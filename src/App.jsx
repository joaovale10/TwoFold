import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { supabase } from './lib/supabaseClient'
import { gerarTransacoesRecorrentes } from './lib/recorrentes.js'
import Login from './pages/Login.jsx'
import AceitarConvitePage from './pages/AceitarConvitePage.jsx'
import ConvitesPage from './pages/ConvitesPage.jsx'
import ContaPage from './pages/ContaPage.jsx'
import AjudaPage from './pages/AjudaPage.jsx'
import AppLayout from './components/AppLayout.jsx'
import SummaryPage from './pages/SummaryPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import CouplePage from './pages/CouplePage.jsx'
import AccountsPage from './pages/AccountsPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import FixedExpensesPage from './pages/FixedExpensesPage.jsx'
import BudgetsPage from './pages/BudgetsPage.jsx'
import GoalsPage from './pages/GoalsPage.jsx'

function EspacoPrivado() {
  const { user, session, loading, signOut } = useAuth()
  const [household, setHousehold] = useState(undefined)
  const [contas, setContas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [regras, setRegras] = useState([])

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
    const [{ data: accs }, { data: cats }, { data: regs }] = await Promise.all([
      supabase.from('accounts').select('*').eq('household_id', householdId),
      supabase.from('categories').select('*').eq('household_id', householdId),
      supabase.from('category_rules').select('*').eq('household_id', householdId),
    ])
    setContas(accs ?? [])
    setCategorias(cats ?? [])
    setRegras(regs ?? [])
  }

  useEffect(() => {
    if (user) carregarHousehold()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (household?.id) carregarAuxiliares(household.id)
  }, [household])

  useEffect(() => {
    if (household?.id) gerarTransacoesRecorrentes(household.id, user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household?.id])

  if (loading) return <p>A carregar...</p>
  if (!session) return <Navigate to="/login" replace />
  if (household === undefined) return <p>A carregar...</p>

  if (household === null) {
    return (
      <div className="login-panel" style={{ minHeight: '100vh' }}>
        <div className="login-form">
          <h2>Sem acesso a nenhum espaço</h2>
          <p className="login-form__lead">
            O teu utilizador ainda não está associado a nenhum espaço. Se recebeste um link de
            convite, usa-o para criar conta; caso contrário, fala com quem geriu a configuração
            inicial da app.
          </p>
          <button type="button" className="botao-link" onClick={signOut}>
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppLayout
      household={household}
      contas={contas}
      categorias={categorias}
      regras={regras}
      atualizar={() => carregarAuxiliares(household.id)}
      atualizarHousehold={carregarHousehold}
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/convite/:codigo" element={<AceitarConvitePage />} />
      <Route path="/" element={<EspacoPrivado />}>
        <Route index element={<Navigate to="/resumo" replace />} />
        <Route path="resumo" element={<SummaryPage />} />
        <Route path="transacoes" element={<TransactionsPage />} />
        <Route path="casal" element={<CouplePage />} />
        <Route path="contas" element={<AccountsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="despesas-fixas" element={<FixedExpensesPage />} />
        <Route path="orcamentos/:tipo" element={<BudgetsPage />} />
        <Route path="objetivos" element={<GoalsPage />} />
        <Route path="convites" element={<ConvitesPage />} />
        <Route path="conta" element={<ContaPage />} />
        <Route path="ajuda" element={<AjudaPage />} />
      </Route>
    </Routes>
  )
}
