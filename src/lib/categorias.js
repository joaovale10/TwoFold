export function nivelDaCategoria(categorias, categoriaId) {
  const cat = categorias.find((c) => c.id === categoriaId)
  if (!cat) return { topoId: '', subId: '' }
  return cat.parent_id ? { topoId: cat.parent_id, subId: cat.id } : { topoId: cat.id, subId: '' }
}

export function nomeCompletoCategoria(categorias, categoriaId) {
  const cat = categorias.find((c) => c.id === categoriaId)
  if (!cat) return null
  if (!cat.parent_id) return cat.nome
  const pai = categorias.find((c) => c.id === cat.parent_id)
  return pai ? `${pai.nome} / ${cat.nome}` : cat.nome
}
