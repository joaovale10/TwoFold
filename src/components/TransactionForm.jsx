import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function TransactionForm({
  accounts,
  categories,
  regras,
  householdId,
  userId,
  accountId,
  onAccountChange,
  onCriada,
}) {
  const [tipo, setTipo] = useState('despesa')
  const [valor, setValor] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [contaDestinoId, setContaDestinoId] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [descricao, setDescricao] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const categoriasDoTipo = categories.filter((c) => c.tipo === tipo)
  const contasDestino = accounts.filter((a) => a.id !== accountId)

  function alterarDescricao(valor) {
    setDescricao(valor)
    if (categoriaId || !valor) return

    const regra = regras.find((r) => valor.toLowerCase().includes(r.padrao.toLowerCase()))
    if (!regra) return

    const categoriaSugerida = categories.find((c) => c.id === regra.categoria_id)
    if (categoriaSugerida && categoriaSugerida.tipo === tipo) setCategoriaId(categoriaSugerida.id)
  }

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setAEnviar(true)

    const payload =
      tipo === 'transferencia'
        ? {
            household_id: householdId,
            account_id: accountId,
            conta_destino_id: contaDestinoId,
            user_id: userId,
            tipo,
            valor: Number(valor),
            data,
            descricao,
          }
        : {
            household_id: householdId,
            account_id: accountId,
            user_id: userId,
            tipo,
            valor: Number(valor),
            categoria_id: categoriaId || null,
            data,
            descricao,
          }

    const { error } = await supabase.from('transactions').insert(payload)

    setAEnviar(false)

    if (error) {
      setErro(error.message)
      return
    }

    setValor('')
    setDescricao('')
    setCategoriaId('')
    setContaDestinoId('')
    setData(new Date().toISOString().slice(0, 10))
    setSucesso(true)
    setTimeout(() => setSucesso(false), 2500)
    onCriada()
  }

  function limpar() {
    setValor('')
    setDescricao('')
    setCategoriaId('')
    setContaDestinoId('')
    setData(new Date().toISOString().slice(0, 10))
    setErro(null)
  }

  return (
    <form onSubmit={submeter} className="nova-transacao">
      <div className="tipo-toggle">
        <button type="button" className={tipo === 'despesa' ? 'ativo' : ''} onClick={() => setTipo('despesa')}>
          Despesa
        </button>
        <button type="button" className={tipo === 'receita' ? 'ativo' : ''} onClick={() => setTipo('receita')}>
          Receita
        </button>
        <button
          type="button"
          className={tipo === 'transferencia' ? 'ativo' : ''}
          onClick={() => setTipo('transferencia')}
        >
          Transferência
        </button>
      </div>

      <div className="nova-transacao__linha nova-transacao__linha--2">
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
          Descrição
          <input
            type="text"
            placeholder="Descrição opcional"
            value={descricao}
            onChange={(e) => alterarDescricao(e.target.value)}
          />
        </label>
      </div>

      <div className="nova-transacao__linha nova-transacao__linha--3">
        <label>
          Conta
          <select value={accountId} onChange={(e) => onAccountChange(e.target.value)} required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </label>

        {tipo === 'transferencia' ? (
          <label>
            Conta destino
            <select value={contaDestinoId} onChange={(e) => setContaDestinoId(e.target.value)} required>
              <option value="">Escolher conta</option>
              {contasDestino.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Categoria
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Sem categoria</option>
              {categoriasDoTipo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </label>
      </div>

      {erro && <p className="erro">{erro}</p>}
      {sucesso && <p className="sucesso">Transação adicionada.</p>}

      <div className="nova-transacao__acoes">
        <button type="button" className="botao-link" onClick={limpar}>
          Cancelar
        </button>
        <button type="submit" className="botao-primario" disabled={aEnviar}>
          Adicionar
        </button>
      </div>
    </form>
  )
}
