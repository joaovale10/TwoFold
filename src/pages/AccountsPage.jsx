import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'
import { saldoDaConta } from '../lib/saldo.js'
import AccountCard from '../components/AccountCard.jsx'

export default function AccountsPage() {
  const { household, contas, atualizar } = useOutletContext()
  const { user } = useAuth()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('pessoal')
  const [saldoInicial, setSaldoInicial] = useState('0')
  const [transacoes, setTransacoes] = useState([])
  const [erro, setErro] = useState(null)

  useEffect(() => {
    supabase
      .from('transactions')
      .select('account_id, conta_destino_id, tipo, valor')
      .eq('household_id', household.id)
      .then(({ data }) => setTransacoes(data ?? []))
  }, [household.id])

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase.from('accounts').insert({
      household_id: household.id,
      owner_user_id: tipo === 'pessoal' ? user.id : null,
      tipo,
      nome,
      saldo_inicial: Number(saldoInicial) || 0,
    })

    if (error) {
      setErro(error.message)
      return
    }

    setNome('')
    setSaldoInicial('0')
    atualizar()
  }

  const minhas = contas.filter((c) => c.owner_user_id === user.id)
  const casal = contas.filter((c) => c.tipo === 'casal')

  return (
    <div>
      <h1>Contas</h1>
      <p className="login-form__lead">
        As tuas contas pessoais só são visíveis a ti. As contas casal são partilhadas com o/a parceiro/a.
      </p>

      <form onSubmit={submeter} className="login-form">
        <label>
          Nome da conta
          <input
            placeholder="Ex: Conta Ordenado"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </label>
        <label>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="pessoal">Pessoal (só tua)</option>
            <option value="casal">Casal (partilhada)</option>
          </select>
        </label>
        <label>
          Saldo inicial (€)
          <input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
          />
        </label>
        <button type="submit" className="botao-primario">
          Adicionar
        </button>
      </form>
      {erro && <p className="erro">{erro}</p>}

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
    </div>
  )
}
