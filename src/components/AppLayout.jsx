import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'
import NotificationsBell from './NotificationsBell.jsx'
import { aplicarTema, obterTemaInicial } from '../lib/theme.js'

const LINKS = [
  { to: '/resumo', label: 'Resumo' },
  { to: '/stats', label: 'Stats' },
  { to: '/transacoes', label: 'Transações' },
  { to: '/casal', label: 'Casal' },
  { to: '/contas', label: 'Contas' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/despesas-fixas', label: 'Despesas Fixas' },
  { to: '/objetivos', label: 'Objetivos' },
]

const ORCAMENTO_LINKS = [
  { to: '/orcamentos/mensais', label: 'Mensais' },
  { to: '/orcamentos/anuais', label: 'Anuais' },
]

const EMAIL_ADMIN = 'joao.projects.vale@gmail.com'

export default function AppLayout({ household, contas, categorias, regras, atualizar, atualizarHousehold }) {
  const { signOut, user } = useAuth()
  const [tema, setTema] = useState(obterTemaInicial)
  const [meuNome, setMeuNome] = useState(null)
  const [sidebarAberta, setSidebarAberta] = useState(false)

  useEffect(() => {
    supabase
      .from('household_members')
      .select('nome')
      .eq('household_id', household.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setMeuNome(data?.nome ?? null))
  }, [household.id, user.id])

  function alternarTema() {
    const novoTema = tema === 'dark' ? 'light' : 'dark'
    aplicarTema(novoTema)
    setTema(novoTema)
  }

  return (
    <div className="app-layout">
      <button
        type="button"
        className="sidebar__hamburger"
        onClick={() => setSidebarAberta(true)}
        title="Abrir menu"
        aria-label="Abrir menu"
      >
        ☰
      </button>
      <div className="app-canto-superior-direito">
        <Link to="/ajuda" className="notificacoes__botao" title="Como funciona a app">
          ❓
        </Link>
        <button type="button" className="notificacoes__botao" onClick={alternarTema} title="Alternar tema">
          {tema === 'dark' ? '☀️' : '🌙'}
        </button>
        <NotificationsBell householdId={household.id} />
      </div>
      {sidebarAberta && (
        <div className="sidebar__backdrop" onClick={() => setSidebarAberta(false)} />
      )}
      <aside className={sidebarAberta ? 'sidebar aberta' : 'sidebar'}>
        <div className="sidebar__topo">
          <p className="sidebar__marca">TwoFold</p>
          <button
            type="button"
            className="sidebar__fechar"
            onClick={() => setSidebarAberta(false)}
            title="Fechar menu"
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>
        <nav onClick={() => setSidebarAberta(false)}>
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'ativo' : undefined)}>
              {link.label}
            </NavLink>
          ))}

          <p className="sidebar__grupo">Orçamentos</p>
          {ORCAMENTO_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'ativo' : undefined)}>
              {link.label}
            </NavLink>
          ))}

          {user?.email === EMAIL_ADMIN && (
            <>
              <p className="sidebar__grupo">Admin</p>
              <NavLink to="/convites" className={({ isActive }) => (isActive ? 'ativo' : undefined)}>
                Convites
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar__rodape">
          <Link to="/conta" className="sidebar__utilizador" title="A minha conta" onClick={() => setSidebarAberta(false)}>
            <svg
              className="sidebar__utilizador-icone"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5Z" />
            </svg>
            <span className="sidebar__utilizador-nome">{meuNome ?? user?.email?.split('@')[0]}</span>
          </Link>
          <button type="button" className="botao-link" onClick={signOut}>
            Sair
          </button>
        </div>
      </aside>
      <main className="app-content">
        <Outlet context={{ household, contas, categorias, regras, atualizar, atualizarHousehold }} />
      </main>
    </div>
  )
}
