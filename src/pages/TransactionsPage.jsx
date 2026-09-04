import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'
import { saldoDaConta } from '../lib/saldo.js'
import TransactionForm from '../components/TransactionForm.jsx'
import TransactionList from '../components/TransactionList.jsx'

export default function TransactionsPage() {
  const { household, contas, categorias, regras } = useOutletContext()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [todasTransacoes, setTodasTransacoes] = useState([])
  const contasAtivas = contas.filter((c) => c.ativa)
  const [accountId, setAccountId] = useState(contasAtivas[0]?.id ?? '')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [apagadas, setApagadas] = useState([])
  const [mostrarApagadas, setMostrarApagadas] = useState(false)

  async function carregarTransacoes() {
    let query = supabase
      .from('transactions')
      .select(
        '*, categories (nome, cor), accounts!transactions_account_id_fkey (nome, tipo), conta_destino:accounts!transactions_conta_destino_id_fkey (nome)'
      )
      .eq('household_id', household.id)
      .is('apagada_em', null)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })

    if (dataInicio) query = query.gte('data', dataInicio)
    if (dataFim) query = query.lte('data', dataFim)
    if (!dataInicio && !dataFim) query = query.limit(50)

    const { data, error } = await query

    if (error) {
      console.error(error)
      return
    }

    setTransactions(data ?? [])
  }

  // Histórico completo (sem filtro de data/pesquisa nem limite de 50), só para o cálculo
  // do saldo real da conta — a tabela usa `transactions`, que pode estar filtrada/limitada.
  async function carregarHistoricoSaldo() {
    const { data } = await supabase
      .from('transactions')
      .select('account_id, conta_destino_id, tipo, valor')
      .eq('household_id', household.id)
      .is('apagada_em', null)

    setTodasTransacoes(data ?? [])
  }

  async function atualizarTudo() {
    await Promise.all([carregarTransacoes(), carregarHistoricoSaldo()])
  }

  async function carregarApagadas() {
    const { data } = await supabase
      .from('transactions')
      .select(
        '*, categories (nome, cor), accounts!transactions_account_id_fkey (nome, tipo), conta_destino:accounts!transactions_conta_destino_id_fkey (nome)'
      )
      .eq('household_id', household.id)
      .not('apagada_em', 'is', null)
      .order('apagada_em', { ascending: false })
      .limit(50)

    setApagadas(data ?? [])
  }

  async function restaurar(id) {
    const { error } = await supabase.from('transactions').update({ apagada_em: null }).eq('id', id)
    if (error) return

    await Promise.all([atualizarTudo(), carregarApagadas()])
  }

  useEffect(() => {
    carregarTransacoes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id, dataInicio, dataFim])

  useEffect(() => {
    if (mostrarApagadas) carregarApagadas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id, mostrarApagadas])

  useEffect(() => {
    carregarHistoricoSaldo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id])

  useEffect(() => {
    if (contasAtivas.length > 0 && !contasAtivas.some((c) => c.id === accountId)) {
      setAccountId(contasAtivas[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contas, accountId])

  const termo = pesquisa.trim().toLowerCase()
  const transacoesDaConta = transactions.filter((tx) => {
    if (tx.account_id !== accountId && tx.conta_destino_id !== accountId) return false
    if (!termo) return true
    return (
      (tx.descricao ?? '').toLowerCase().includes(termo) ||
      (tx.categories?.nome ?? '').toLowerCase().includes(termo)
    )
  })

  const apagadasDaConta = apagadas.filter(
    (tx) => tx.account_id === accountId || tx.conta_destino_id === accountId
  )

  const contaAtual = contas.find((c) => c.id === accountId)
  const saldo = contaAtual ? saldoDaConta(contaAtual, todasTransacoes) : 0

  const semFiltroDeData = !dataInicio && !dataFim

  return (
    <div>
      <h1 className="titulo-centrado">Transações</h1>
      <p className="saldo">Saldo da conta: {saldo.toFixed(2)} €</p>

      <TransactionForm
        accounts={contasAtivas}
        categories={categorias}
        regras={regras}
        householdId={household.id}
        userId={user.id}
        accountId={accountId}
        onAccountChange={setAccountId}
        onCriada={atualizarTudo}
      />

      <input
        type="search"
        placeholder="Pesquisar por descrição ou categoria..."
        value={pesquisa}
        onChange={(e) => setPesquisa(e.target.value)}
        className="pesquisa-transacoes"
      />

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
        {semFiltroDeData && <span className="login-form__lead">A mostrar as últimas 50</span>}
      </div>

      <TransactionList
        transactions={transacoesDaConta}
        categorias={categorias}
        contaEmFoco={accountId}
        onAtualizado={atualizarTudo}
      />

      <button
        type="button"
        className="botao-link"
        onClick={() => setMostrarApagadas((v) => !v)}
      >
        {mostrarApagadas ? 'Esconder apagadas' : 'Ver transações apagadas'}
      </button>

      {mostrarApagadas && (
        <div className="transacoes-apagadas">
          {apagadasDaConta.length === 0 ? (
            <p className="login-form__lead">Sem transações apagadas nesta conta.</p>
          ) : (
            apagadasDaConta.map((tx) => (
              <div key={tx.id} className="transacoes-apagadas__item">
                <span>
                  {tx.data} — {tx.descricao || '—'} — {Number(tx.valor).toFixed(2)} €
                </span>
                <button type="button" className="botao-link" onClick={() => restaurar(tx.id)}>
                  Restaurar
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
