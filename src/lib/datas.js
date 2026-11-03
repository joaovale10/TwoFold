// toISOString() converte para UTC e, na hora de verão, recua um dia às datas locais.
export function dataLocalISO(d = new Date()) {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function dentroDoMes(dataISO, referencia) {
  const d = new Date(dataISO)
  return d.getFullYear() === referencia.getFullYear() && d.getMonth() === referencia.getMonth()
}

export function dentroDoAno(dataISO, referencia) {
  return new Date(dataISO).getFullYear() === referencia.getFullYear()
}
