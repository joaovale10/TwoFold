import { useEffect, useState } from 'react'
import { gerarNotificacoes } from '../lib/notifications.js'

export default function NotificationsBell({ householdId }) {
  const [notificacoes, setNotificacoes] = useState([])
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    gerarNotificacoes(householdId).then(setNotificacoes)
  }, [householdId])

  return (
    <div className="notificacoes">
      <button
        type="button"
        className="notificacoes__botao"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label="Notificações"
      >
        <span className="so-desktop">🔔</span>
        <svg className="icone-topo so-movel" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {notificacoes.length > 0 && <span className="notificacoes__contador">{notificacoes.length}</span>}
      </button>

      {aberto && (
        <div className="notificacoes__painel">
          {notificacoes.length === 0 ? (
            <p className="login-form__lead">Sem novidades.</p>
          ) : (
            <ul className="notificacoes__lista">
              {notificacoes.map((n) => (
                <li key={n.id} className={`notificacao notificacao--${n.nivel}`}>
                  {n.texto}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
