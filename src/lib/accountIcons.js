const PREFIXO = 'icone-conta-'
export const ICONE_OMISSAO = '🏦'

export const ICONES_DISPONIVEIS = ['🏦', '💳', '💶', '🐷', '✈️', '🏠', '🎯', '📈', '💰', '🧾']

export function obterIcone(contaId) {
  try {
    return localStorage.getItem(PREFIXO + contaId) || ICONE_OMISSAO
  } catch {
    return ICONE_OMISSAO
  }
}

export function definirIcone(contaId, icone) {
  try {
    localStorage.setItem(PREFIXO + contaId, icone)
  } catch {
    // localStorage indisponível (ex: modo privado) — falha em silêncio, é só preferência visual
  }
}
