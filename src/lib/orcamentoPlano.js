export function somaLiquidos(incomes) {
  return incomes.reduce((soma, i) => soma + Number(i.liquido), 0)
}

export function percentualMembro(income, somaLiquidosTodos) {
  if (income.percentual_manual != null) return Number(income.percentual_manual)
  if (!somaLiquidosTodos) return 0
  return (Number(income.liquido) / somaLiquidosTodos) * 100
}

export function totalItems(items) {
  return items.reduce((soma, i) => soma + Number(i.valor), 0)
}

export function valorTransferir(income, totalContaComum, somaLiquidosTodos) {
  return (totalContaComum * percentualMembro(income, somaLiquidosTodos)) / 100
}

export function totalIndividualDoMembro(items, userId) {
  return totalItems(items.filter((i) => i.user_id === userId))
}

export function totalPoupancaDoMembro(items, userId) {
  return totalItems(items.filter((i) => i.user_id === userId && i.poupanca))
}

export function sobraDoMembro({ liquido, transferir, individual }) {
  return liquido - transferir - individual
}

export function agruparValoresPorCategoria(items) {
  const somas = {}
  for (const item of items) {
    somas[item.categoria_id] = (somas[item.categoria_id] ?? 0) + Number(item.valor)
  }
  return somas
}
