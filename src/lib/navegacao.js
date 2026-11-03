export const LINKS_BARRA = [
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

export const LINK_ADMIN = { to: '/convites', label: 'Convites' }

export function estaAtivo(pathname, { to, base }) {
  const raiz = base ?? to
  return pathname === raiz || pathname.startsWith(`${raiz}/`)
}

// As páginas da barra dispensam título no telemóvel: o separador ativo já diz onde estamos.
export function paginaDaBarra(pathname) {
  return [...LINKS_BARRA, LINK_ADMIN].some((link) => estaAtivo(pathname, link))
}
