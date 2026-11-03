import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'
import { paginaDaBarra } from '../lib/navegacao'
import BarraNavegacao from './BarraNavegacao.jsx'
import MenuPerfil from './MenuPerfil.jsx'
import NotificationsBell from './NotificationsBell.jsx'
import { aplicarTema, obterTemaInicial } from '../lib/theme.js'

const LINKS = [
  { to: '/resumo', label: 'Resumo' },
  { to: '/transacoes', label: 'Transações' },
  { to: '/casal', label: 'Casal' },
  { to: '/contas', label: 'Contas' },
  { to: '/stats', label: 'Stats' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/despesas-fixas', label: 'Despesas Fixas' },
  { to: '/objetivos', label: 'Objetivos' },
  { to: '/etiquetas', label: 'Por Etiqueta' },
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
  const { pathname } = useLocation()

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

  const nomeVisivel = meuNome ?? user?.email?.split('@')[0]
  const admin = user?.email === EMAIL_ADMIN

  return (
    <div className="app-layout">
      <p className="app-marca-movel so-movel">TwoFold</p>
      <div className="app-canto-superior-direito">
        <Link to="/ajuda" className="notificacoes__botao so-desktop" title="Como funciona a app">
          ❓
        </Link>
        <button
          type="button"
          className="notificacoes__botao"
          onClick={alternarTema}
          title="Alternar tema"
          aria-label="Alternar tema"
        >
          <span className="so-desktop">{tema === 'dark' ? '☀️' : '🌙'}</span>
          <svg className="icone-topo so-movel" viewBox="0 0 24 24" aria-hidden="true">
            {tema === 'dark' ? (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </>
            ) : (
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
            )}
          </svg>
        </button>
        <NotificationsBell householdId={household.id} />
        <MenuPerfil nome={nomeVisivel} onSair={signOut} />
      </div>
      <aside className="sidebar">
        <div className="sidebar__topo">
          <p className="sidebar__marca">TwoFold</p>
        </div>
        <nav>
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

          {admin && (
            <>
              <p className="sidebar__grupo">Admin</p>
              <NavLink to="/convites" className={({ isActive }) => (isActive ? 'ativo' : undefined)}>
                Convites
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar__rodape">
          <Link to="/conta" className="sidebar__utilizador" title="A minha conta">
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
            <span className="sidebar__utilizador-nome">{nomeVisivel}</span>
          </Link>
          <button type="button" className="botao-link" onClick={signOut}>
            Sair
          </button>
        </div>
      </aside>
      <main className={paginaDaBarra(pathname) ? 'app-content app-content--na-barra' : 'app-content'}>
        {pathname.startsWith('/orcamentos/') && (
          <nav className="tipo-toggle seletor-orcamento so-movel" aria-label="Tipo de orçamento">
            {ORCAMENTO_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'ativo' : undefined)}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
        <Outlet context={{ household, contas, categorias, regras, atualizar, atualizarHousehold }} />
      </main>
      <BarraNavegacao admin={admin} />
    </div>
  )
}
