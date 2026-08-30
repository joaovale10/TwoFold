const CHAVE = 'tema'

export function obterTemaInicial() {
  const guardado = localStorage.getItem(CHAVE)
  if (guardado === 'light' || guardado === 'dark') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema
  localStorage.setItem(CHAVE, tema)
}
