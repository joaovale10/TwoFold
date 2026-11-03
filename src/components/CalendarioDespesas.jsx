import { semanasDoMes } from '../lib/calendario'

const DIAS_SEMANA = [
  ['S', 'Segunda'],
  ['T', 'Terça'],
  ['Q', 'Quarta'],
  ['Q', 'Quinta'],
  ['S', 'Sexta'],
  ['S', 'Sábado'],
  ['D', 'Domingo'],
]

const COR_SEM_CATEGORIA = 'var(--muted)'
const MAXIMO_DE_PONTOS = 3

const formatoMes = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' })
const formatoValor = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })

function Seta({ d }) {
  return (
    <svg className="icone-topo" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export default function CalendarioDespesas({ ano, mes, despesasPorDia, diaSelecionado, onEscolherDia, onMudarMes }) {
  const hoje = new Date()
  const eMesAtual = hoje.getFullYear() === ano && hoje.getMonth() === mes
  const semanas = semanasDoMes(ano, mes)
  const nomeMes = formatoMes.format(new Date(ano, mes, 1)).replace(' de ', ' ')

  return (
    <section className="calendario" aria-label="Calendário de despesas fixas">
      <div className="calendario__cabecalho">
        <h2 aria-live="polite">{nomeMes}</h2>
        {!eMesAtual && (
          <button type="button" className="botao-link" onClick={() => onMudarMes(0, true)}>
            Hoje
          </button>
        )}
        <div className="calendario__setas">
          <button type="button" onClick={() => onMudarMes(-1)} aria-label="Mês anterior">
            <Seta d="M15 5l-7 7 7 7" />
          </button>
          <button type="button" onClick={() => onMudarMes(1)} aria-label="Mês seguinte">
            <Seta d="M9 5l7 7-7 7" />
          </button>
        </div>
      </div>

      <table className="calendario__grelha" key={`${ano}-${mes}`}>
        <thead>
          <tr>
            {DIAS_SEMANA.map(([letra, nome]) => (
              <th key={nome} scope="col" abbr={nome}>
                {letra}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana) => {
            const estaSemana = eMesAtual && semana.includes(hoje.getDate())
            return (
              <tr key={semana.find(Boolean)} className={estaSemana ? 'calendario__semana-atual' : undefined}>
                {semana.map((dia, i) => {
                  if (!dia) return <td key={`vazio-${i}`} />

                  const despesas = despesasPorDia[dia] ?? []
                  const eHoje = eMesAtual && dia === hoje.getDate()
                  const classes = ['calendario__dia']
                  if (eHoje) classes.push('calendario__dia--hoje')

                  if (despesas.length === 0) {
                    return (
                      <td key={dia}>
                        <span className={classes.join(' ')}>{dia}</span>
                      </td>
                    )
                  }

                  const selecionado = dia === diaSelecionado
                  if (selecionado) classes.push('calendario__dia--selecionado')
                  const total = despesas.reduce((soma, d) => soma + Number(d.valor), 0)
                  const contagem = despesas.length === 1 ? '1 despesa' : `${despesas.length} despesas`

                  return (
                    <td key={dia}>
                      <button
                        type="button"
                        className={classes.join(' ')}
                        aria-pressed={selecionado}
                        aria-label={`Dia ${dia}: ${contagem}, ${formatoValor.format(total)}`}
                        onClick={() => onEscolherDia(selecionado ? null : dia)}
                      >
                        {dia}
                        <span className="calendario__pontos" aria-hidden="true">
                          {despesas.slice(0, MAXIMO_DE_PONTOS).map((d) => (
                            <i key={d.id} style={{ background: d.categories?.cor ?? COR_SEM_CATEGORIA }} />
                          ))}
                        </span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
