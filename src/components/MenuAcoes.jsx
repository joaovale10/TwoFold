import { useEffect, useRef, useState } from 'react'

const ALTURA_RESERVADA = 240

export default function MenuAcoes({ rotulo, acoes }) {
  const [aberto, setAberto] = useState(false)
  const [paraCima, setParaCima] = useState(false)
  const raizRef = useRef(null)
  const botaoRef = useRef(null)

  useEffect(() => {
    if (!aberto) return undefined

    function aoClicarFora(e) {
      if (!raizRef.current?.contains(e.target)) setAberto(false)
    }
    function aoCarregarTecla(e) {
      if (e.key === 'Escape') {
        setAberto(false)
        botaoRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', aoClicarFora)
    document.addEventListener('keydown', aoCarregarTecla)
    return () => {
      document.removeEventListener('pointerdown', aoClicarFora)
      document.removeEventListener('keydown', aoCarregarTecla)
    }
  }, [aberto])

  function alternar() {
    // Perto do fundo do ecrã, a lista ficaria por baixo da barra de navegação.
    const { bottom } = botaoRef.current.getBoundingClientRect()
    setParaCima(window.innerHeight - bottom < ALTURA_RESERVADA)
    setAberto((a) => !a)
  }

  return (
    <div className="menu-acoes" ref={raizRef}>
      <button
        type="button"
        className="menu-acoes__botao"
        ref={botaoRef}
        onClick={alternar}
        aria-haspopup="true"
        aria-expanded={aberto}
        aria-label={rotulo}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {aberto && (
        <ul className={paraCima ? 'categoria-menu__lista menu-acoes__lista--cima' : 'categoria-menu__lista'}>
          {acoes.map((acao) => (
            <li key={acao.rotulo}>
              <button
                type="button"
                className={acao.perigo ? 'categoria-menu__botao-perigo' : undefined}
                onClick={() => {
                  setAberto(false)
                  acao.onClick()
                }}
              >
                {acao.rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
