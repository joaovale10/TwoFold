import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const LINKS = [
  { to: '/resumo', label: 'Resumo' },
  { to: '/transacoes', label: 'Transações' },
  { to: '/casal', label: 'Casal' },
  { to: '/orcamentos/mensais', base: '/orcamentos', label: 'Orçamentos' },
  { to: '/objetivos', label: 'Objetivos' },
  { to: '/contas', label: 'Contas' },
  { to: '/stats', label: 'Stats' },
  { to: '/despesas-fixas', label: 'Despesas Fixas' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/etiquetas', label: 'Etiquetas' },
]

const CAMPOS_DE_ESCRITA =
  'textarea, [contenteditable], input:not([type=checkbox], [type=radio], [type=file], [type=button], [type=submit], [type=color], [type=range])'

function estaAtivo(pathname, { to, base }) {
  const raiz = base ?? to
  return pathname === raiz || pathname.startsWith(`${raiz}/`)
}

export default function BarraNavegacao({ admin }) {
  const { pathname } = useLocation()
  const [aEscrever, setAEscrever] = useState(false)
  const fundoRef = useRef(null)
  const listaRef = useRef(null)
  const indicadorRef = useRef(null)
  const primeiraVezRef = useRef(true)

  const links = admin ? [...LINKS, { to: '/convites', label: 'Convites' }] : LINKS

  useLayoutEffect(() => {
    const lista = listaRef.current
    const indicador = indicadorRef.current

    function atualizarSombras() {
      const falta = lista.scrollWidth - lista.clientWidth - lista.scrollLeft
      fundoRef.current.style.setProperty('--sombra-esquerda', lista.scrollLeft > 4 ? 1 : 0)
      fundoRef.current.style.setProperty('--sombra-direita', falta > 4 ? 1 : 0)
    }

    function colocarIndicador() {
      const ativo = lista.querySelector('[aria-current="page"]')
      indicador.style.opacity = ativo ? 1 : 0
      if (ativo) {
        indicador.style.width = `${ativo.offsetWidth}px`
        indicador.style.transform = `translateX(${ativo.offsetLeft}px)`
      }
      atualizarSombras()
    }

    colocarIndicador()

    const ativo = lista.querySelector('[aria-current="page"]')
    if (ativo) {
      const animar =
        !primeiraVezRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      lista.scrollTo({
        left: ativo.offsetLeft - (lista.clientWidth - ativo.offsetWidth) / 2,
        behavior: animar ? 'smooth' : 'auto',
      })
    }

    // Só depois da primeira colocação, para o indicador não deslizar ao abrir a app.
    const frame = requestAnimationFrame(() => {
      indicador.dataset.pronto = 'true'
    })
    primeiraVezRef.current = false

    // A barra troca de display entre desktop e móvel, e a largura dos itens muda com a fonte.
    const observador = new ResizeObserver(colocarIndicador)
    observador.observe(lista)
    document.fonts?.ready.then(colocarIndicador)
    lista.addEventListener('scroll', atualizarSombras, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      observador.disconnect()
      lista.removeEventListener('scroll', atualizarSombras)
    }
  }, [pathname, admin])

  useEffect(() => {
    if (window.matchMedia('(max-width: 720px)').matches) window.scrollTo(0, 0)
  }, [pathname])

  // Com o teclado aberto, a barra taparia os campos do formulário.
  useEffect(() => {
    function aoEntrar(e) {
      setAEscrever(e.target instanceof Element && e.target.matches(CAMPOS_DE_ESCRITA))
    }
    function aoSair() {
      setAEscrever(false)
    }
    document.addEventListener('focusin', aoEntrar)
    document.addEventListener('focusout', aoSair)
    return () => {
      document.removeEventListener('focusin', aoEntrar)
      document.removeEventListener('focusout', aoSair)
    }
  }, [])

  return (
    <nav
      className={aEscrever ? 'barra-nav barra-nav--escondida' : 'barra-nav'}
      aria-label="Navegação principal"
    >
      <div className="barra-nav__fundo" ref={fundoRef}>
        <div className="barra-nav__lista" ref={listaRef}>
          <span className="barra-nav__indicador" ref={indicadorRef} aria-hidden="true" />
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="barra-nav__item"
              aria-current={estaAtivo(pathname, link) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
