import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import LinhasPlano from './LinhasPlano.jsx'
import ResumoPlano from './ResumoPlano.jsx'
import { somaLiquidos, percentualMembro, valorTransferir, totalItems, agruparValoresPorCategoria } from '../lib/orcamentoPlano'

export default function PlanoOrcamento({ household, categorias, onLimitesAplicados }) {
  const [membros, setMembros] = useState([])
  const [planos, setPlanos] = useState([])
  const [planoId, setPlanoId] = useState('')
  const [plano, setPlano] = useState(null)
  const [incomes, setIncomes] = useState([])
  const [items, setItems] = useState([])
  const [tituloNovo, setTituloNovo] = useState('')
  const [duplicar, setDuplicar] = useState(true)
  const [formNovoAberto, setFormNovoAberto] = useState(false)
  const [erro, setErro] = useState(null)

  const categoriasDespesa = categorias.filter((c) => c.tipo === 'despesa')

  async function carregarMembros() {
    const { data } = await supabase
      .from('household_members')
      .select('user_id, nome')
      .eq('household_id', household.id)
    setMembros(data ?? [])
  }

  async function carregarPlanos() {
    const { data } = await supabase
      .from('budget_plans')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
    setPlanos(data ?? [])
    if (data && data.length > 0 && !planoId) setPlanoId(data[0].id)
  }

  async function carregarPlanoSelecionado(id) {
    if (!id) {
      setPlano(null)
      setIncomes([])
      setItems([])
      return
    }
    const [{ data: p }, { data: inc }, { data: its }] = await Promise.all([
      supabase.from('budget_plans').select('*').eq('id', id).single(),
      supabase.from('budget_plan_incomes').select('*').eq('plan_id', id),
      supabase.from('budget_plan_items').select('*').eq('plan_id', id),
    ])
    setPlano(p ?? null)
    setIncomes(inc ?? [])
    setItems(its ?? [])
  }

  useEffect(() => {
    carregarMembros()
    carregarPlanos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id])

  useEffect(() => {
    carregarPlanoSelecionado(planoId)
  }, [planoId])

  async function criarPlano(e) {
    e.preventDefault()
    setErro(null)

    const { data: novoPlano, error } = await supabase
      .from('budget_plans')
      .insert({ household_id: household.id, titulo: tituloNovo })
      .select()
      .single()

    if (error) {
      setErro(error.message)
      return
    }

    if (duplicar && plano) {
      const novosIncomes = incomes.map((i) => ({
        household_id: household.id,
        plan_id: novoPlano.id,
        user_id: i.user_id,
        liquido: i.liquido,
        subsidio_valor: i.subsidio_valor,
        subsidio_nota: i.subsidio_nota,
        percentual_manual: i.percentual_manual,
      }))
      const novosItems = items.map((i) => ({
        household_id: household.id,
        plan_id: novoPlano.id,
        secao: i.secao,
        user_id: i.user_id,
        descricao: i.descricao,
        valor: i.valor,
        categoria_id: i.categoria_id,
        poupanca: i.poupanca,
      }))
      if (novosIncomes.length > 0) await supabase.from('budget_plan_incomes').insert(novosIncomes)
      if (novosItems.length > 0) await supabase.from('budget_plan_items').insert(novosItems)
    } else {
      const novosIncomes = membros.map((m) => ({
        household_id: household.id,
        plan_id: novoPlano.id,
        user_id: m.user_id,
        liquido: 0,
      }))
      if (novosIncomes.length > 0) await supabase.from('budget_plan_incomes').insert(novosIncomes)
    }

    setTituloNovo('')
    setFormNovoAberto(false)
    await carregarPlanos()
    setPlanoId(novoPlano.id)
  }

  async function guardarNotas(notas) {
    await supabase.from('budget_plans').update({ notas }).eq('id', plano.id)
    setPlano((p) => ({ ...p, notas }))
  }

  async function guardarIncome(id, campos) {
    await supabase.from('budget_plan_incomes').update(campos).eq('id', id)
    setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, ...campos } : i)))
  }

  async function adicionarItem(dados) {
    const { data } = await supabase
      .from('budget_plan_items')
      .insert({ household_id: household.id, plan_id: plano.id, ...dados })
      .select()
      .single()
    if (data) setItems((prev) => [...prev, data])
  }

  async function editarItem(id, dados) {
    await supabase.from('budget_plan_items').update(dados).eq('id', id)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...dados } : i)))
  }

  async function apagarItem(id) {
    await supabase.from('budget_plan_items').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const [mensagemAplicado, setMensagemAplicado] = useState(null)

  async function aplicarLimites() {
    setErro(null)
    setMensagemAplicado(null)

    const somas = agruparValoresPorCategoria(items)
    const categoriaIds = Object.keys(somas)

    if (categoriaIds.length === 0) {
      setErro('O plano ainda não tem nenhuma linha com categoria.')
      return
    }

    const { data: existentes, error: erroSelect } = await supabase
      .from('budgets')
      .select('id, categoria_id')
      .eq('household_id', household.id)
      .eq('tipo', 'mensal')
      .in('categoria_id', categoriaIds)

    if (erroSelect) {
      setErro(erroSelect.message)
      return
    }

    const existentePorCategoria = Object.fromEntries((existentes ?? []).map((b) => [b.categoria_id, b.id]))

    const inserts = []
    for (const categoriaId of categoriaIds) {
      if (!existentePorCategoria[categoriaId]) {
        inserts.push({ household_id: household.id, tipo: 'mensal', categoria_id: categoriaId, limite_mensal: somas[categoriaId] })
      }
    }

    const updates = categoriaIds
      .filter((categoriaId) => existentePorCategoria[categoriaId])
      .map((categoriaId) =>
        supabase.from('budgets').update({ limite_mensal: somas[categoriaId] }).eq('id', existentePorCategoria[categoriaId])
      )

    const resultadosUpdate = updates.length > 0 ? await Promise.all(updates) : []
    const erroInsert = inserts.length > 0 ? (await supabase.from('budgets').insert(inserts)).error : null
    const erroUpdate = resultadosUpdate.find((r) => r.error)?.error

    if (erroUpdate || erroInsert) {
      setErro((erroUpdate ?? erroInsert).message)
      return
    }

    setMensagemAplicado('Limites por categoria atualizados a partir deste plano.')
    onLimitesAplicados?.()
  }

  if (planos.length === 0 && !formNovoAberto) {
    return (
      <section className="plano-orcamento">
        <p>Ainda não há nenhum plano de orçamento.</p>
        <button type="button" className="botao-primario" onClick={() => setFormNovoAberto(true)}>
          + Novo plano
        </button>
      </section>
    )
  }

  return (
    <section className="plano-orcamento">
      <div className="plano-orcamento__cabecalho">
        <select value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
          {planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.titulo}
            </option>
          ))}
        </select>
        <button type="button" className="botao-link" onClick={() => setFormNovoAberto((v) => !v)}>
          + Novo plano
        </button>
      </div>

      {formNovoAberto && (
        <form onSubmit={criarPlano} className="nova-transacao">
          <div className="nova-transacao__linha nova-transacao__linha--2">
            <label>
              Título
              <input
                placeholder="Ex: Setembro 2026"
                value={tituloNovo}
                onChange={(e) => setTituloNovo(e.target.value)}
                required
              />
            </label>
            {plano && (
              <label>
                <input type="checkbox" checked={duplicar} onChange={(e) => setDuplicar(e.target.checked)} />{' '}
                Duplicar o plano selecionado
              </label>
            )}
          </div>
          {erro && <p className="erro">{erro}</p>}
          <div className="nova-transacao__acoes">
            <button type="submit" className="botao-primario">
              Criar
            </button>
          </div>
        </form>
      )}

      {plano && (
        <>
          <label className="plano-orcamento__notas">
            Notas
            <textarea
              defaultValue={plano.notas ?? ''}
              onBlur={(e) => guardarNotas(e.target.value)}
              rows={2}
            />
          </label>

          <h3>Rendimentos</h3>
          <div className="transaction-list__wrap">
            <table className="transaction-list">
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Líquido</th>
                  <th>Subsídio</th>
                  <th>Nota do subsídio</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => {
                  const membro = membros.find((m) => m.user_id === income.user_id)
                  return (
                    <tr key={income.id}>
                      <td>{membro?.nome ?? '—'}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={income.liquido}
                          onBlur={(e) => guardarIncome(income.id, { liquido: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={income.subsidio_valor ?? ''}
                          onBlur={(e) =>
                            guardarIncome(income.id, {
                              subsidio_valor: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          defaultValue={income.subsidio_nota ?? ''}
                          onBlur={(e) => guardarIncome(income.id, { subsidio_nota: e.target.value || null })}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <LinhasPlano
            titulo="Conta Comum"
            items={items.filter((i) => i.secao === 'comum')}
            categoriasDespesa={categoriasDespesa}
            mostrarPoupanca={false}
            onAdicionar={(dados) => adicionarItem({ secao: 'comum', user_id: null, ...dados })}
            onEditar={editarItem}
            onApagar={apagarItem}
          />

          <div className="transaction-list__wrap">
            <table className="transaction-list">
              <thead>
                <tr>
                  <th>Transferência</th>
                  <th>%</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => {
                  const membro = membros.find((m) => m.user_id === income.user_id)
                  const soma = somaLiquidos(incomes)
                  const totalComum = totalItems(items.filter((i) => i.secao === 'comum'))
                  const percentual = percentualMembro(income, soma)
                  const transferir = valorTransferir(income, totalComum, soma)
                  return (
                    <tr key={income.id}>
                      <td>{membro?.nome ?? '—'}</td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="auto"
                          defaultValue={income.percentual_manual ?? ''}
                          onBlur={(e) =>
                            guardarIncome(income.id, {
                              percentual_manual: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                        />
                        {' '}({percentual.toFixed(1)}%)
                      </td>
                      <td>{transferir.toFixed(2)} €</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {membros.map((membro) => (
            <LinhasPlano
              key={membro.user_id}
              titulo={`Despesas Individuais — ${membro.nome}`}
              items={items.filter((i) => i.secao === 'individual' && i.user_id === membro.user_id)}
              categoriasDespesa={categoriasDespesa}
              mostrarPoupanca
              onAdicionar={(dados) => adicionarItem({ secao: 'individual', user_id: membro.user_id, ...dados })}
              onEditar={editarItem}
              onApagar={apagarItem}
            />
          ))}

          <ResumoPlano membros={membros} incomes={incomes} items={items} />

          <div className="plano-orcamento__acoes">
            <button type="button" className="botao-primario" onClick={aplicarLimites}>
              Aplicar limites ao Orçamento
            </button>
            {mensagemAplicado && <p className="sucesso">{mensagemAplicado}</p>}
          </div>
        </>
      )}
    </section>
  )
}
