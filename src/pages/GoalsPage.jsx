import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { saldoDaConta } from '../lib/saldo.js'

function chaveDoMes(dataISO) {
  return dataISO.slice(0, 7) // 'YYYY-MM'
}

export default function GoalsPage() {
  const { household, contas } = useOutletContext()
  const contasAtivas = contas.filter((c) => c.ativa)
  const [objetivos, setObjetivos] = useState([])
  const [transacoes, setTransacoes] = useState([])
  const [nome, setNome] = useState('')
  const [accountId, setAccountId] = useState(contasAtivas[0]?.id ?? '')
  const [valorObjetivo, setValorObjetivo] = useState('')
  const [dataLimite, setDataLimite] = useState('')
  const [contribuicaoMensal, setContribuicaoMensal] = useState('')
  const [erro, setErro] = useState(null)

  async function carregar() {
    const { data } = await supabase
      .from('savings_goals')
      .select('*, accounts (nome, saldo_inicial)')
      .eq('household_id', household.id)

    setObjetivos(data ?? [])

    const { data: txs } = await supabase
      .from('transactions')
      .select('account_id, conta_destino_id, tipo, valor, data')
      .eq('household_id', household.id)
      .is('apagada_em', null)

    setTransacoes(txs ?? [])
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

  // Variação líquida da conta em cada um dos últimos 6 meses, para estimar o ritmo atual.
  function ritmoMensalAtual(conta) {
    const hoje = new Date()
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      return chaveDoMes(d.toISOString())
    })

    const variacaoPorMes = Object.fromEntries(meses.map((m) => [m, 0]))
    transacoes.forEach((tx) => {
      const mes = chaveDoMes(tx.data)
      if (!(mes in variacaoPorMes)) return
      if (tx.tipo === 'transferencia') {
        if (tx.account_id === conta.id) variacaoPorMes[mes] -= Number(tx.valor)
        if (tx.conta_destino_id === conta.id) variacaoPorMes[mes] += Number(tx.valor)
        return
      }
      if (tx.account_id !== conta.id) return
      variacaoPorMes[mes] += tx.tipo === 'receita' ? Number(tx.valor) : -Number(tx.valor)
    })

    const total = Object.values(variacaoPorMes).reduce((t, v) => t + v, 0)
    return total / meses.length
  }

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase.from('savings_goals').insert({
      household_id: household.id,
      account_id: accountId,
      nome,
      valor_objetivo: Number(valorObjetivo),
      data_limite: dataLimite || null,
      contribuicao_mensal: contribuicaoMensal ? Number(contribuicaoMensal) : null,
    })

    if (error) {
      setErro(error.message)
      return
    }

    setNome('')
    setValorObjetivo('')
    setDataLimite('')
    setContribuicaoMensal('')
    carregar()
  }

  return (
    <div>
      <h1 className="titulo-centrado">Objetivos</h1>

      <form onSubmit={submeter} className="nova-transacao">
        <div className="nova-transacao__linha nova-transacao__linha--3">
          <label>
            Nome
            <input
              placeholder="Ex: Férias, Casa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
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
          <label>
            Objetivo (€)
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00 €"
              value={valorObjetivo}
              onChange={(e) => setValorObjetivo(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="nova-transacao__linha nova-transacao__linha--2">
          <label>
            Data limite (opcional)
            <input type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)} />
          </label>
          <label>
            Poupança mensal pretendida (opcional)
            <input
              type="number"
              step="0.01"
              placeholder="0,00 €"
              value={contribuicaoMensal}
              onChange={(e) => setContribuicaoMensal(e.target.value)}
            />
          </label>
        </div>

        <div className="nova-transacao__acoes">
          <button type="submit" className="botao-primario">
            + Adicionar objetivo
          </button>
        </div>
      </form>
      {erro && <p className="erro">{erro}</p>}

      {objetivos.length === 0 ? (
        <p>Ainda não há objetivos de poupança definidos.</p>
      ) : (
        <div className="budget-lista">
          {objetivos.map((o) => {
            const valorAtual = saldoDaConta(
              { id: o.account_id, saldo_inicial: o.accounts?.saldo_inicial ?? 0 },
              transacoes
            )
            const percentagem = Math.min(100, Math.round((valorAtual / Number(o.valor_objetivo)) * 100))
            const restante = Number(o.valor_objetivo) - valorAtual
            const ritmo = ritmoMensalAtual({ id: o.account_id })

            let previsao
            if (restante <= 0) {
              previsao = 'Objetivo atingido! 🎉'
            } else if (ritmo > 0) {
              const meses = Math.ceil(restante / ritmo)
              const dataPrevista = new Date(new Date().getFullYear(), new Date().getMonth() + meses, 1)
              previsao = `No ritmo atual (${ritmo.toFixed(2)} €/mês), atinges em ${dataPrevista.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`
            } else {
              previsao = 'Sem ritmo de poupança suficiente para prever a data'
            }

            return (
              <div key={o.id} className="budget-item">
                <div className="budget-item__cabecalho">
                  <span>{o.nome}</span>
                  <span>
                    {valorAtual.toFixed(2)} € / {Number(o.valor_objetivo).toFixed(2)} € · {percentagem}%
                  </span>
                </div>
                <div className="budget-item__barra">
                  <div
                    className="budget-item__progresso"
                    style={{ width: `${percentagem}%`, background: 'var(--accent)' }}
                  />
                </div>
                <p className="login-form__lead" style={{ marginTop: '0.5rem' }}>
                  {previsao}
                  {o.data_limite &&
                    ` · Meta para ${new Date(o.data_limite).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`}
                  {o.contribuicao_mensal && ` · Poupança pretendida: ${Number(o.contribuicao_mensal).toFixed(2)} €/mês`}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
