import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'
import { saldoDaConta } from '../lib/saldo.js'
import AccountCard from '../components/AccountCard.jsx'
import Modal from '../components/Modal'

export default function AccountsPage() {
  const { household, contas, atualizar } = useOutletContext()
  const { user } = useAuth()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('pessoal')
  const [saldoInicial, setSaldoInicial] = useState('0')
  const [transacoes, setTransacoes] = useState([])
  const [erro, setErro] = useState(null)
  const [aCriar, setACriar] = useState(false)
  const [aGuardar, setAGuardar] = useState(false)

  useEffect(() => {
    supabase
      .from('transactions')
      .select('account_id, conta_destino_id, tipo, valor')
      .eq('household_id', household.id)
      .is('apagada_em', null)
      .then(({ data }) => setTransacoes(data ?? []))
  }, [household.id])

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setAGuardar(true)

    const { error } = await supabase.from('accounts').insert({
      household_id: household.id,
      owner_user_id: tipo === 'pessoal' ? user.id : null,
      tipo,
      nome: nome.trim(),
      saldo_inicial: Number(saldoInicial) || 0,
    })

    setAGuardar(false)
    if (error) {
      setErro(error.message)
      return
    }

    fecharFormulario()
    atualizar()
  }

  function fecharFormulario() {
    setACriar(false)
    setNome('')
    setTipo('pessoal')
    setSaldoInicial('0')
    setErro(null)
  }

  const minhas = contas.filter((c) => c.owner_user_id === user.id)
  const casal = contas.filter((c) => c.tipo === 'casal')

  return (
    <div className="contas">
      <h1 className="titulo-centrado">Contas</h1>
      <p className="login-form__lead">
        As tuas contas pessoais só são visíveis a ti. As contas casal são partilhadas com o/a parceiro/a.
      </p>

      <h2>As tuas contas pessoais</h2>
      {minhas.length === 0 ? (
        <p>Ainda não tens contas pessoais.</p>
      ) : (
        <div className="conta-grelha">
          {minhas.map((c) => (
            <AccountCard key={c.id} conta={c} saldo={saldoDaConta(c, transacoes)} atualizar={atualizar} />
          ))}
        </div>
      )}

      <h2>Contas casal</h2>
      {casal.length === 0 ? (
        <p>Ainda não há contas casal.</p>
      ) : (
        <div className="conta-grelha">
          {casal.map((c) => (
            <AccountCard key={c.id} conta={c} saldo={saldoDaConta(c, transacoes)} atualizar={atualizar} />
          ))}
        </div>
      )}
      <button type="button" className="botao-circular" onClick={() => setACriar(true)} aria-label="Adicionar conta">
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {aCriar && (
        <Modal titulo="Nova conta" onFechar={fecharFormulario}>
          <form onSubmit={submeter} className="form-despesa">
            <div className="nova-transacao__linha">
              <label>
                Nome da conta
                <input
                  name="nome"
                  autoComplete="off"
                  placeholder="Ex: Conta Ordenado"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="nova-transacao__campo" role="group" aria-label="Tipo de conta">
              <span>Tipo</span>
              <div className="tipo-toggle">
                {[
                  ['pessoal', 'Pessoal (só tua)'],
                  ['casal', 'Casal (partilhada)'],
                ].map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    className={tipo === valor ? 'ativo' : ''}
                    aria-pressed={tipo === valor}
                    onClick={() => setTipo(valor)}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>

            <div className="nova-transacao__linha">
              <label>
                Saldo inicial (€)
                <input
                  name="saldo-inicial"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0,00"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                />
              </label>
            </div>

            {erro && (
              <p className="erro" role="alert">
                {erro}
              </p>
            )}

            <div className="modal__acoes">
              <button type="button" className="botao-secundario" onClick={fecharFormulario}>
                Cancelar
              </button>
              <button type="submit" className="botao-primario" disabled={aGuardar}>
                {aGuardar ? 'A guardar…' : 'Adicionar conta'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
