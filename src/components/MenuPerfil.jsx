import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function MenuPerfil({ nome, onSair }) {
  const [aberto, setAberto] = useState(false)
  const raizRef = useRef(null)

  useEffect(() => {
    if (!aberto) return undefined

    function aoClicarFora(e) {
      if (!raizRef.current?.contains(e.target)) setAberto(false)
    }
    function aoCarregarTecla(e) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('pointerdown', aoClicarFora)
    document.addEventListener('keydown', aoCarregarTecla)
    return () => {
      document.removeEventListener('pointerdown', aoClicarFora)
      document.removeEventListener('keydown', aoCarregarTecla)
    }
  }, [aberto])

  return (
    <div className="notificacoes so-movel" ref={raizRef}>
      <button
        type="button"
        className="notificacoes__botao"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label="Perfil: conta, ajuda e sair"
      >
        <svg className="icone-topo" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      </button>

      {aberto && (
        <div className="notificacoes__painel menu-perfil">
          <p className="menu-perfil__nome">{nome}</p>
          <Link to="/conta" onClick={() => setAberto(false)}>
            A minha conta
          </Link>
          <Link to="/ajuda" onClick={() => setAberto(false)}>
            Ajuda
          </Link>
          <button type="button" onClick={onSair}>
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
