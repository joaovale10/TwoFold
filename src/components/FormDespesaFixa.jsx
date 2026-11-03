import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import CategoriaSeletor from './CategoriaSeletor'

export default function FormDespesaFixa({ despesa, householdId, contas, categorias, onGuardada, onCancelar }) {
  const categoriaRotuloId = useId()
  const contasDisponiveis = contas.filter((c) => c.ativa || c.id === despesa?.account_id)

  const [descricao, setDescricao] = useState(despesa?.descricao ?? '')
  const [valor, setValor] = useState(despesa ? String(despesa.valor) : '')
  const [diaVencimento, setDiaVencimento] = useState(despesa ? String(despesa.dia_vencimento) : '1')
  const [accountId, setAccountId] = useState(despesa?.account_id ?? contasDisponiveis[0]?.id ?? '')
  const [categoriaId, setCategoriaId] = useState(despesa?.categoria_id ?? '')
  const [erro, setErro] = useState(null)
  const [aGuardar, setAGuardar] = useState(false)

  if (contasDisponiveis.length === 0) {
    return (
      <p>
        Para adicionar uma despesa fixa, precisas de uma conta ativa. <Link to="/contas">Criar conta</Link>
      </p>
    )
  }

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setAGuardar(true)

    const campos = {
      descricao: descricao.trim(),
      valor: Number(valor),
      account_id: accountId,
      categoria_id: categoriaId || null,
      dia_vencimento: Number(diaVencimento),
    }
    const { error } = despesa
      ? await supabase.from('fixed_expenses').update(campos).eq('id', despesa.id)
      : await supabase.from('fixed_expenses').insert({ ...campos, household_id: householdId })

    setAGuardar(false)
    if (error) {
      setErro(error.message)
      return
    }
    onGuardada()
  }

  return (
    <form onSubmit={submeter} className="form-despesa">
      <div className="nova-transacao__linha">
        <label>
          Descrição
          <input
            name="descricao"
            autoComplete="off"
            placeholder="Ex: Renda"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="nova-transacao__linha form-despesa__par">
        <label>
          Valor
          <input
            name="valor"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="0,00 €"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
          />
        </label>
        <label>
          Dia do mês
          <input
            name="dia"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            value={diaVencimento}
            onChange={(e) => setDiaVencimento(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="nova-transacao__linha">
        <label>
          Conta
          <select name="conta" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
            {contasDisponiveis.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="nova-transacao__linha">
        <div className="nova-transacao__campo" role="group" aria-labelledby={categoriaRotuloId}>
          <span id={categoriaRotuloId}>Categoria</span>
          <CategoriaSeletor categorias={categorias} value={categoriaId} onChange={setCategoriaId} opcional />
        </div>
      </div>

      {!despesa && (
        <p className="form-despesa__nota">A transação de cada mês é criada automaticamente na conta escolhida.</p>
      )}
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <div className="modal__acoes">
        <button type="button" className="botao-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="botao-primario" disabled={aGuardar}>
          {aGuardar ? 'A guardar…' : despesa ? 'Guardar alterações' : 'Adicionar despesa'}
        </button>
      </div>
    </form>
  )
}
