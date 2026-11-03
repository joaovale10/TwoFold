import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'
import TransactionForm from '../components/TransactionForm.jsx'
import TransactionList from '../components/TransactionList.jsx'
import Modal from '../components/Modal'

const COLUNAS =
  'id, tipo, valor, data, descricao, etiqueta, account_id, conta_destino_id, categoria_id, categories (nome, cor), accounts!transactions_account_id_fkey (nome), conta_destino:accounts!transactions_conta_destino_id_fkey (nome)'

const formatoValor = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })

export default function TransactionsPage() {
  const { household, contas, categorias, regras } = useOutletContext()
  const { user } = useAuth()
  const [transacoes, setTransacoes] = useState(null)
  const [pesquisa, setPesquisa] = useState('')
  const [formulario, setFormulario] = useState(null) // null | { transacao: objeto ou null }
  const [aApagar, setAApagar] = useState(null)
  const [apagadas, setApagadas] = useState([])
  const [mostrarApagadas, setMostrarApagadas] = useState(false)
  const [erro, setErro] = useState(null)

  // O RLS já limita às contas a que o utilizador tem acesso (pessoais dele + casal).
  async function carregar() {
    const { data, error } = await supabase
      .from('transactions')
      .select(COLUNAS)
      .eq('household_id', household.id)
      .is('apagada_em', null)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) setErro('Não foi possível carregar as transações. Atualiza a página para tentar de novo.')
    setTransacoes(data ?? [])
  }

  async function carregarApagadas() {
    const { data } = await supabase
      .from('transactions')
      .select(COLUNAS)
      .eq('household_id', household.id)
      .not('apagada_em', 'is', null)
      .order('apagada_em', { ascending: false })
      .limit(50)

    setApagadas(data ?? [])
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id])

  useEffect(() => {
    if (mostrarApagadas) carregarApagadas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id, mostrarApagadas])

  async function apagar() {
    setErro(null)
    const { error } = await supabase
      .from('transactions')
      .update({ apagada_em: new Date().toISOString() })
      .eq('id', aApagar.id)

    if (error) setErro('Não foi possível apagar a transação. Tenta de novo.')
    else await Promise.all([carregar(), mostrarApagadas && carregarApagadas()])
    setAApagar(null)
  }

  async function restaurar(id) {
    const { error } = await supabase.from('transactions').update({ apagada_em: null }).eq('id', id)
    if (!error) await Promise.all([carregar(), carregarApagadas()])
  }

  function aposGuardar() {
    setFormulario(null)
    carregar()
  }

  const termo = pesquisa.trim().toLowerCase()
  const visiveis = (transacoes ?? []).filter(
    (tx) =>
      !termo ||
      (tx.descricao ?? '').toLowerCase().includes(termo) ||
      (tx.categories?.nome ?? '').toLowerCase().includes(termo) ||
      (tx.etiqueta ?? '').toLowerCase().includes(termo) ||
      (tx.accounts?.nome ?? '').toLowerCase().includes(termo)
  )

  return (
    <div className="transacoes">
      <h1 className="titulo-centrado">Transações</h1>

      <input
        type="search"
        name="pesquisa"
        aria-label="Pesquisar transações"
        placeholder="Pesquisar transações…"
        autoComplete="off"
        value={pesquisa}
        onChange={(e) => setPesquisa(e.target.value)}
        className="pesquisa-transacoes"
      />

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      {transacoes && visiveis.length === 0 && (
        <p className="despesas-lista__vazio">
          {termo ? 'Nenhuma transação encontrada.' : 'Ainda não há transações. Usa o botão + para registar a primeira.'}
        </p>
      )}

      <TransactionList
        transactions={visiveis}
        categorias={categorias}
        onEditar={(tx) => setFormulario({ transacao: tx })}
        onApagar={setAApagar}
      />

      <button type="button" className="botao-link" onClick={() => setMostrarApagadas((v) => !v)}>
        {mostrarApagadas ? 'Esconder apagadas' : 'Ver transações apagadas'}
      </button>

      {mostrarApagadas && (
        <div className="transacoes-apagadas">
          {apagadas.length === 0 ? (
            <p className="login-form__lead">Sem transações apagadas.</p>
          ) : (
            apagadas.map((tx) => (
              <div key={tx.id} className="transacoes-apagadas__item">
                <span>
                  {tx.data} — {tx.descricao || '—'} — {formatoValor.format(tx.valor)}
                </span>
                <button type="button" className="botao-link" onClick={() => restaurar(tx.id)}>
                  Restaurar
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <button
        type="button"
        className="botao-circular"
        onClick={() => setFormulario({ transacao: null })}
        aria-label="Registar transação"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {formulario && (
        <Modal
          titulo={formulario.transacao ? 'Editar transação' : 'Nova transação'}
          onFechar={() => setFormulario(null)}
        >
          <TransactionForm
            transacao={formulario.transacao}
            accounts={contas}
            categories={categorias}
            regras={regras}
            householdId={household.id}
            userId={user.id}
            onGuardada={aposGuardar}
            onCancelar={() => setFormulario(null)}
          />
        </Modal>
      )}

      {aApagar && (
        <Modal titulo="Apagar transação?" onFechar={() => setAApagar(null)}>
          <p className="modal__texto">
            “{aApagar.descricao || 'Sem descrição'}” de {formatoValor.format(aApagar.valor)}. Podes restaurá-la em
            “Ver transações apagadas”.
          </p>
          <div className="modal__acoes">
            <button type="button" className="botao-secundario" onClick={() => setAApagar(null)}>
              Cancelar
            </button>
            <button type="button" className="botao-perigo" onClick={apagar}>
              Apagar transação
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
