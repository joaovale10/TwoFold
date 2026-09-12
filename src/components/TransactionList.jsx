import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { nivelDaCategoria, nomeCompletoCategoria } from '../lib/categorias'

function LinhaEdicao({ tx, categorias, onGuardado, onCancelar }) {
  const categoriasDoTipo = categorias.filter((c) => c.tipo === tx.tipo)
  const categoriasTopoDoTipo = categoriasDoTipo.filter((c) => !c.parent_id)
  const [data, setData] = useState(tx.data)
  const [descricao, setDescricao] = useState(tx.descricao ?? '')
  const nivelInicial = nivelDaCategoria(categorias, tx.categoria_id)
  const [categoriaTopoId, setCategoriaTopoId] = useState(nivelInicial.topoId)
  const [categoriaSubId, setCategoriaSubId] = useState(nivelInicial.subId)
  const [valor, setValor] = useState(String(tx.valor))
  const [erro, setErro] = useState(null)

  const subcategoriasDaTopo = categoriasDoTipo.filter((c) => c.parent_id === categoriaTopoId)
  const categoriaId = categoriaSubId || categoriaTopoId

  async function guardar(e) {
    e.preventDefault()
    setErro(null)

    const payload =
      tx.tipo === 'transferencia'
        ? { data, descricao, valor: Number(valor) }
        : { data, descricao, valor: Number(valor), categoria_id: categoriaId || null }

    const { error } = await supabase.from('transactions').update(payload).eq('id', tx.id)

    if (error) {
      setErro(error.message)
      return
    }

    onGuardado()
  }

  return (
    <tr>
      <td>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </td>
      <td>
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </td>
      <td>
        {tx.tipo === 'transferencia' ? (
          '—'
        ) : (
          <>
            <select
              value={categoriaTopoId}
              onChange={(e) => {
                setCategoriaTopoId(e.target.value)
                setCategoriaSubId('')
              }}
            >
              <option value="">Sem categoria</option>
              {categoriasTopoDoTipo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            {subcategoriasDaTopo.length > 0 && (
              <select value={categoriaSubId} onChange={(e) => setCategoriaSubId(e.target.value)}>
                <option value="">Nenhuma</option>
                {subcategoriasDaTopo.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </td>
      <td>{tx.accounts?.nome}</td>
      <td>
        <input type="number" step="0.01" min="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
      </td>
      <td>
        <button type="button" className="botao-link" onClick={guardar}>
          Guardar
        </button>
        <button type="button" className="botao-link" onClick={onCancelar}>
          Cancelar
        </button>
        {erro && <p className="erro">{erro}</p>}
      </td>
    </tr>
  )
}

function sinalEcor(tx, contaEmFoco) {
  if (tx.tipo === 'receita') return { sinal: '+', cor: '#2f7a4f' }
  if (tx.tipo === 'despesa') return { sinal: '-', cor: 'var(--danger)' }
  // transferência: o sinal depende de a conta em foco ser a origem (sai) ou o destino (entra)
  if (contaEmFoco && tx.account_id === contaEmFoco) return { sinal: '-', cor: 'var(--danger)' }
  if (contaEmFoco && tx.conta_destino_id === contaEmFoco) return { sinal: '+', cor: '#2f7a4f' }
  return { sinal: '', cor: 'var(--muted)' }
}

export default function TransactionList({ transactions, categorias = [], contaEmFoco, onAtualizado }) {
  const [editandoId, setEditandoId] = useState(null)

  async function apagar(id) {
    if (!window.confirm('Apagar esta transação? Podes restaurá-la em "Ver transações apagadas".')) return

    const { error } = await supabase
      .from('transactions')
      .update({ apagada_em: new Date().toISOString() })
      .eq('id', id)

    if (!error) onAtualizado()
  }

  if (transactions.length === 0) return <p>Ainda não há transações.</p>

  return (
    <div className="transaction-list__wrap">
    <table className="transaction-list">
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th>Conta</th>
          <th>Valor</th>
          {onAtualizado && <th>Ações</th>}
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => {
          if (editandoId === tx.id) {
            return (
              <LinhaEdicao
                key={tx.id}
                tx={tx}
                categorias={categorias}
                onGuardado={() => {
                  setEditandoId(null)
                  onAtualizado()
                }}
                onCancelar={() => setEditandoId(null)}
              />
            )
          }

          const { sinal, cor } = sinalEcor(tx, contaEmFoco)

          return (
            <tr key={tx.id} className={tx.tipo}>
              <td>{tx.data}</td>
              <td>
                {tx.descricao || '—'}
                {tx.tipo === 'transferencia' && ` → ${tx.conta_destino?.nome ?? 'Conta privada'}`}
              </td>
              <td style={{ color: tx.categories?.cor }}>
                {nomeCompletoCategoria(categorias, tx.categoria_id) ?? '—'}
              </td>
              <td>{tx.accounts?.nome ?? (tx.tipo === 'transferencia' ? 'Conta privada' : '')}</td>
              <td className="transaction-list__valor" style={{ color: cor }}>
                {sinal}
                {Number(tx.valor).toFixed(2)} €
              </td>
              {onAtualizado && (
                <td>
                  <button type="button" className="botao-link" onClick={() => setEditandoId(tx.id)}>
                    Editar
                  </button>
                  <button type="button" className="botao-link" onClick={() => apagar(tx.id)}>
                    Apagar
                  </button>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
    </div>
  )
}
