import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const TIPO_POR_ROTA = { mensais: 'mensal', anuais: 'anual' }

export default function BudgetsPage() {
  const { tipo: tipoRota } = useParams()
  const tipo = TIPO_POR_ROTA[tipoRota] ?? 'mensal'
  const { household, categorias } = useOutletContext()

  const [budgets, setBudgets] = useState([])
  const [gastoPorCategoria, setGastoPorCategoria] = useState({})
  const [categoriaId, setCategoriaId] = useState('')
  const [limite, setLimite] = useState('')
  const [erro, setErro] = useState(null)

  const categoriasDespesa = categorias.filter((c) => c.tipo === 'despesa')

  async function carregar() {
    const { data } = await supabase
      .from('budgets')
      .select('*, categories (nome, cor)')
      .eq('household_id', household.id)
      .eq('tipo', tipo)

    setBudgets(data ?? [])

    const inicio =
      tipo === 'mensal'
        ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
        : `${new Date().getFullYear()}-01-01`

    const { data: txs } = await supabase
      .from('transactions')
      .select('categoria_id, valor')
      .eq('household_id', household.id)
      .eq('tipo', 'despesa')
      .gte('data', inicio)

    const totais = {}
    for (const tx of txs ?? []) {
      totais[tx.categoria_id] = (totais[tx.categoria_id] ?? 0) + Number(tx.valor)
    }
    setGastoPorCategoria(totais)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id, tipo])

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase
      .from('budgets')
      .insert({ household_id: household.id, tipo, categoria_id: categoriaId, limite_mensal: Number(limite) })

    if (error) {
      setErro(error.message)
      return
    }

    setLimite('')
    setCategoriaId('')
    carregar()
  }

  const titulo = { mensal: 'Orçamentos Mensais', anual: 'Orçamentos Anuais' }[tipo]

  return (
    <div>
      <h1 className="titulo-centrado">{titulo}</h1>

      <form onSubmit={submeter} className="transaction-form">
        <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
          <option value="">Categoria</option>
          {categoriasDespesa.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Limite (€)"
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
          required
        />
        <button type="submit" className="botao-primario">
          Adicionar
        </button>
      </form>
      {erro && <p className="erro">{erro}</p>}

      {budgets.length === 0 ? (
        <p>Ainda não há orçamentos definidos.</p>
      ) : (
        <div className="budget-lista">
          {budgets.map((b) => {
            const gasto = gastoPorCategoria[b.categoria_id] ?? 0
            const percentagem = Math.min(100, Math.round((gasto / Number(b.limite_mensal)) * 100))

            return (
              <div key={b.id} className="budget-item">
                <div className="budget-item__cabecalho">
                  <span>{b.categories?.nome}</span>
                  <span>
                    {gasto.toFixed(2)} € / {Number(b.limite_mensal).toFixed(2)} €
                  </span>
                </div>
                <div className="budget-item__barra">
                  <div
                    className="budget-item__progresso"
                    style={{
                      width: `${percentagem}%`,
                      background: percentagem >= 100 ? 'var(--danger)' : 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
