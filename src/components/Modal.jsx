import { useEffect, useId, useRef } from 'react'

const FOCAVEIS = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'

export default function Modal({ titulo, onFechar, children }) {
  const tituloId = useId()
  const fundoRef = useRef(null)
  const painelRef = useRef(null)
  const onFecharRef = useRef(onFechar)

  useEffect(() => {
    onFecharRef.current = onFechar
  }, [onFechar])

  useEffect(() => {
    const anterior = document.activeElement
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Foca o painel e não o primeiro campo, para o teclado do telemóvel não abrir sozinho.
    painelRef.current.focus()

    function aoCarregarTecla(e) {
      // O seletor de categoria abre por cima deste modal e fecha primeiro.
      if (document.querySelector('.categoria-modal-fundo')) return
      if (e.key === 'Escape') {
        onFecharRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const focaveis = painelRef.current.querySelectorAll(FOCAVEIS)
      if (focaveis.length === 0) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      const ativo = document.activeElement
      if (e.shiftKey && (ativo === primeiro || ativo === painelRef.current)) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && ativo === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }

    // O iOS não encolhe a página com o teclado aberto: sem isto, os campos ficavam por baixo dele.
    const vista = window.visualViewport
    function ajustarAoTeclado() {
      fundoRef.current.style.height = `${vista.height}px`
      fundoRef.current.style.top = `${vista.offsetTop}px`
    }
    vista?.addEventListener('resize', ajustarAoTeclado)
    vista?.addEventListener('scroll', ajustarAoTeclado)
    document.addEventListener('keydown', aoCarregarTecla)

    return () => {
      document.body.style.overflow = overflowAnterior
      vista?.removeEventListener('resize', ajustarAoTeclado)
      vista?.removeEventListener('scroll', ajustarAoTeclado)
      document.removeEventListener('keydown', aoCarregarTecla)
      anterior?.focus?.()
    }
  }, [])

  return (
    <div
      className="modal-fundo"
      ref={fundoRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar()
      }}
    >
      <div
        className="modal"
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
      >
        <div className="modal__cabecalho">
          <h2 id={tituloId}>{titulo}</h2>
          <button type="button" className="modal__fechar" onClick={onFechar} aria-label="Fechar">
            <svg className="icone-topo" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
