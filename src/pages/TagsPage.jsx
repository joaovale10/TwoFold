import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { nomeCompletoCategoria } from '../lib/categorias'

export default function TagsPage() {
  const { household, categorias } = useOutletContext()
  const [transacoes, setTransacoes] = useState([])
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    async function carregar() {
      let query = supabase
        .from('transactions')
        .select('valor, categoria_id, etiqueta')
        .eq('household_id', household.id)
        .eq('tipo', 'despesa')
        .is('apagada_em', null)
        .not('etiqueta', 'is', null)

      if (dataInicio) query = query.gte('data', dataInicio)
      if (dataFim) query = query.lte('data', dataFim)

      const { data } = await query
      setTransacoes(data ?? [])
    }
    carregar()
  }, [household.id, dataInicio, dataFim])

  const porEtiqueta = {}
  for (const tx of transacoes) {
    const grupo = (porEtiqueta[tx.etiqueta] ??= { total: 0, nTransacoes: 0, porCategoria: {} })
    grupo.total += Number(tx.valor)
    grupo.nTransacoes += 1
    const nomeCategoria = nomeCompletoCategoria(categorias, tx.categoria_id) ?? 'Sem categoria'
    grupo.porCategoria[nomeCategoria] = (grupo.porCategoria[nomeCategoria] ?? 0) + Number(tx.valor)
  }

  const etiquetas = Object.entries(porEtiqueta).sort(([, a], [, b]) => b.total - a.total)
  const semFiltroDeData = !dataInicio && !dataFim

  return (
    <div>
      <h1 className="titulo-centrado">Por Etiqueta</h1>
      <p className="login-form__lead">
        Total gasto por etiqueta (ex: "Férias Cabo Verde"), somando despesas de todas as categorias.
      </p>

      <div className="filtro-datas">
        <label>
          De
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </label>
        <label>
          Até
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </label>
        <button
          type="button"
          className="botao-link"
          disabled={semFiltroDeData}
          onClick={() => {
            setDataInicio('')
            setDataFim('')
          }}
        >
          Todas as datas
        </button>
      </div>

      {etiquetas.length === 0 ? (
        <p>Ainda não há transações com etiqueta. Adiciona uma etiqueta ao criar/editar uma despesa em Transações.</p>
      ) : (
        etiquetas.map(([etiqueta, grupo]) => (
          <div key={etiqueta} className="plano-orcamento__secao">
            <h3>{etiqueta}</h3>
            <p>
              <strong>{grupo.total.toFixed(2)} €</strong> em {grupo.nTransacoes}{' '}
              {grupo.nTransacoes === 1 ? 'despesa' : 'despesas'}
            </p>
            <div className="transaction-list__wrap">
              <table className="transaction-list">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grupo.porCategoria)
                    .sort(([, a], [, b]) => b - a)
                    .map(([categoria, valor]) => (
                      <tr key={categoria}>
                        <td>{categoria}</td>
                        <td>{valor.toFixed(2)} €</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
