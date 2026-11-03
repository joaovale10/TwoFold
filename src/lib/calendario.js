export function ultimoDiaDoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate()
}

// Semanas de segunda a domingo; os dias de outros meses ficam a null.
export function semanasDoMes(ano, mes) {
  const antes = (new Date(ano, mes, 1).getDay() + 6) % 7
  const dias = [
    ...Array(antes).fill(null),
    ...Array.from({ length: ultimoDiaDoMes(ano, mes) }, (_, i) => i + 1),
  ]
  while (dias.length % 7 !== 0) dias.push(null)

  const semanas = []
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7))
  return semanas
}

// Igual à geração de transações: o dia 31 passa para o último dia dos meses mais curtos.
export function diaEfetivo(diaVencimento, ano, mes) {
  return Math.min(diaVencimento, ultimoDiaDoMes(ano, mes))
}

export function jaComecou(dataInicio, ano, mes) {
  const chave = `${ano}-${String(mes + 1).padStart(2, '0')}`
  return !dataInicio || dataInicio.slice(0, 7) <= chave
}
