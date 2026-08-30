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
      >
        🔔
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
