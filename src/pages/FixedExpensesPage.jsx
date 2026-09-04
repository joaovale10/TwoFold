import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function FixedExpensesPage() {
  const { household, contas, categorias } = useOutletContext()
  const contasAtivas = contas.filter((c) => c.ativa)
  const [despesas, setDespesas] = useState([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [accountId, setAccountId] = useState(contasAtivas[0]?.id ?? '')
  const [categoriaId, setCategoriaId] = useState('')
  const [diaVencimento, setDiaVencimento] = useState('1')
  const [erro, setErro] = useState(null)

  const [editandoId, setEditandoId] = useState(null)
  const [edicao, setEdicao] = useState(null)
  const [erroEdicao, setErroEdicao] = useState(null)

  const categoriasDespesa = categorias.filter((c) => c.tipo === 'despesa')

  async function carregar() {
    const { data } = await supabase
      .from('fixed_expenses')
      .select('*, categories (nome, cor), accounts (nome)')
      .eq('household_id', household.id)
      .order('dia_vencimento')

    setDespesas(data ?? [])
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id])

  useEffect(() => {
    if (contasAtivas.length > 0 && !contasAtivas.some((c) => c.id === accountId)) {
      setAccountId(contasAtivas[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contas, accountId])

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase.from('fixed_expenses').insert({
      household_id: household.id,
      account_id: accountId,
      descricao,
      valor: Number(valor),
      categoria_id: categoriaId || null,
      dia_vencimento: Number(diaVencimento),
    })

    if (error) {
      setErro(error.message)
      return
    }

    setDescricao('')
    setValor('')
    carregar()
  }

  async function alternarAtiva(despesa) {
    await supabase.from('fixed_expenses').update({ ativa: !despesa.ativa }).eq('id', despesa.id)
    carregar()
  }

  function iniciarEdicao(despesa) {
    setEditandoId(despesa.id)
    setErroEdicao(null)
    setEdicao({
      descricao: despesa.descricao,
      valor: String(despesa.valor),
      account_id: despesa.account_id,
      categoria_id: despesa.categoria_id ?? '',
      dia_vencimento: String(despesa.dia_vencimento),
    })
  }

  async function guardarEdicao(id) {
    setErroEdicao(null)

    const { error } = await supabase
      .from('fixed_expenses')
      .update({
        descricao: edicao.descricao,
        valor: Number(edicao.valor),
        account_id: edicao.account_id,
        categoria_id: edicao.categoria_id || null,
        dia_vencimento: Number(edicao.dia_vencimento),
      })
      .eq('id', id)

    if (error) {
      setErroEdicao(error.message)
      return
    }

    setEditandoId(null)
    carregar()
  }

  const totalMensal = despesas.filter((d) => d.ativa).reduce((t, d) => t + Number(d.valor), 0)

  return (
    <div>
      <h1 className="titulo-centrado">Despesas Fixas</h1>
      <p className="saldo">Total mensal: {totalMensal.toFixed(2)} €</p>
      <p className="login-form__lead">
        Ao abrires a app, as transações reais em falta até hoje são criadas automaticamente na conta escolhida.
      </p>

      <form onSubmit={submeter} className="nova-transacao">
        <div className="nova-transacao__linha nova-transacao__linha--3">
          <label>
            Descrição
            <input
              placeholder="Ex: Renda"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </label>
          <label>
            Valor
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00 €"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </label>
          <label>
            Conta
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              {contasAtivas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="nova-transacao__linha nova-transacao__linha--2">
          <label>
            Categoria
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Sem categoria</option>
              {categoriasDespesa.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Dia do mês
            <input
              type="number"
              min="1"
              max="31"
              value={diaVencimento}
              onChange={(e) => setDiaVencimento(e.target.value)}
            />
          </label>
        </div>

        <div className="nova-transacao__acoes">
          <button type="submit" className="botao-primario">
            + Adicionar despesa fixa
          </button>
        </div>
      </form>
      {erro && <p className="erro">{erro}</p>}

      {despesas.length === 0 ? (
        <p>Ainda não há despesas fixas registadas.</p>
      ) : (
        <div className="transaction-list__wrap">
        <table className="transaction-list">
          <thead>
            <tr>
              <th>Dia</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) =>
              editandoId === d.id ? (
                <tr key={d.id}>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={edicao.dia_vencimento}
                      onChange={(e) => setEdicao({ ...edicao, dia_vencimento: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={edicao.descricao}
                      onChange={(e) => setEdicao({ ...edicao, descricao: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={edicao.categoria_id}
                      onChange={(e) => setEdicao({ ...edicao, categoria_id: e.target.value })}
                    >
                      <option value="">Sem categoria</option>
                      {categoriasDespesa.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={edicao.account_id}
                      onChange={(e) => setEdicao({ ...edicao, account_id: e.target.value })}
                    >
                      {contasAtivas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={edicao.valor}
                      onChange={(e) => setEdicao({ ...edicao, valor: e.target.value })}
                    />
                  </td>
                  <td>
                    <button type="button" className="botao-link" onClick={() => guardarEdicao(d.id)}>
                      Guardar
                    </button>
                    <button type="button" className="botao-link" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </button>
                    {erroEdicao && <p className="erro">{erroEdicao}</p>}
                  </td>
                </tr>
              ) : (
                <tr key={d.id} style={{ opacity: d.ativa ? 1 : 0.5 }}>
                  <td>{d.dia_vencimento ?? '—'}</td>
                  <td>{d.descricao}</td>
                  <td>{d.categories?.nome ?? '—'}</td>
                  <td>{d.accounts?.nome ?? '—'}</td>
                  <td className="transaction-list__valor">{Number(d.valor).toFixed(2)} €</td>
                  <td>
                    <button type="button" className="botao-link" onClick={() => iniciarEdicao(d)}>
                      Editar
                    </button>
                    <button type="button" className="botao-link" onClick={() => alternarAtiva(d)}>
                      {d.ativa ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
