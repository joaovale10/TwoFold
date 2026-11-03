import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import CategoriaSeletor from './CategoriaSeletor'
import { dataLocalISO } from '../lib/datas'

const TIPOS = [
  ['despesa', 'Despesa'],
  ['receita', 'Receita'],
  ['transferencia', 'Transferência'],
]

export default function TransactionForm({
  transacao,
  accounts,
  categories,
  regras,
  householdId,
  userId,
  onGuardada,
  onCancelar,
}) {
  const contaRotuloId = useId()
  const categoriaRotuloId = useId()
  const destinoRotuloId = useId()
  // Uma transação antiga pode estar numa conta já desativada: mantém-na na lista para não a perder.
  const contas = accounts.filter((a) => a.ativa || a.id === transacao?.account_id || a.id === transacao?.conta_destino_id)

  const [tipo, setTipo] = useState(transacao?.tipo ?? 'despesa')
  const [valor, setValor] = useState(transacao ? String(transacao.valor) : '')
  const [accountId, setAccountId] = useState(transacao?.account_id ?? contas[0]?.id ?? '')
  const [contaDestinoId, setContaDestinoId] = useState(transacao?.conta_destino_id ?? '')
  const [categoriaId, setCategoriaId] = useState(transacao?.categoria_id ?? '')
  const [data, setData] = useState(transacao?.data ?? dataLocalISO())
  const [descricao, setDescricao] = useState(transacao?.descricao ?? '')
  const [etiqueta, setEtiqueta] = useState(transacao?.etiqueta ?? '')
  const [etiquetasExistentes, setEtiquetasExistentes] = useState([])
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    supabase
      .from('transactions')
      .select('etiqueta')
      .eq('household_id', householdId)
      .not('etiqueta', 'is', null)
      .then(({ data: linhas }) => setEtiquetasExistentes([...new Set((linhas ?? []).map((l) => l.etiqueta))].sort()))
  }, [householdId])

  if (contas.length === 0) {
    return (
      <p>
        Para registar uma transação, precisas de uma conta ativa. <Link to="/contas">Criar conta</Link>
      </p>
    )
  }

  const categoriasDoTipo = categories.filter((c) => c.tipo === tipo)
  const contasDestino = contas.filter((a) => a.id !== accountId)

  function mudarTipo(novo) {
    setTipo(novo)
    setCategoriaId('')
  }

  function alterarDescricao(texto) {
    setDescricao(texto)
    if (categoriaId || !texto) return

    const regra = regras.find((r) => texto.toLowerCase().includes(r.padrao.toLowerCase()))
    const sugerida = regra && categories.find((c) => c.id === regra.categoria_id)
    if (sugerida && sugerida.tipo === tipo) setCategoriaId(sugerida.id)
  }

  async function submeter(e) {
    e.preventDefault()
    const transferencia = tipo === 'transferencia'
    if (transferencia && !contaDestinoId) {
      setErro('Escolhe a conta destino.')
      return
    }
    setErro(null)
    setAGuardar(true)

    const campos = {
      tipo,
      account_id: accountId,
      conta_destino_id: transferencia ? contaDestinoId : null,
      categoria_id: transferencia ? null : categoriaId || null,
      valor: Number(valor),
      data,
      descricao,
      etiqueta: etiqueta.trim() || null,
    }

    const { error } = transacao
      ? await supabase.from('transactions').update(campos).eq('id', transacao.id)
      : await supabase.from('transactions').insert({ ...campos, household_id: householdId, user_id: userId })

    setAGuardar(false)
    if (error) {
      setErro(error.message)
      return
    }
    onGuardada()
  }

  return (
    <form onSubmit={submeter} className="form-despesa">
      {!transacao && (
        <div className="tipo-toggle" role="group" aria-label="Tipo de transação">
          {TIPOS.map(([valorTipo, rotulo]) => (
            <button
              key={valorTipo}
              type="button"
              className={tipo === valorTipo ? 'ativo' : ''}
              aria-pressed={tipo === valorTipo}
              onClick={() => mudarTipo(valorTipo)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      )}

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
          Data
          <input name="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </label>
      </div>

      <div className="nova-transacao__linha">
        <label>
          Descrição
          <input
            name="descricao"
            autoComplete="off"
            placeholder="Opcional"
            value={descricao}
            onChange={(e) => alterarDescricao(e.target.value)}
          />
        </label>
      </div>

      <div className="nova-transacao__linha">
        <div className="nova-transacao__campo" role="group" aria-labelledby={contaRotuloId}>
          <span id={contaRotuloId}>{tipo === 'transferencia' ? 'Conta de origem' : 'Conta'}</span>
          <div className="tipo-toggle tipo-toggle--deslizante">
            {contas.map((a) => (
              <button
                key={a.id}
                type="button"
                className={a.id === accountId ? 'ativo' : ''}
                aria-pressed={a.id === accountId}
                onClick={() => {
                  setAccountId(a.id)
                  if (a.id === contaDestinoId) setContaDestinoId('')
                }}
              >
                {a.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="nova-transacao__linha">
        {tipo === 'transferencia' ? (
          <div className="nova-transacao__campo" role="group" aria-labelledby={destinoRotuloId}>
            <span id={destinoRotuloId}>Conta destino</span>
            <div className="tipo-toggle tipo-toggle--deslizante">
              {contasDestino.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={a.id === contaDestinoId ? 'ativo' : ''}
                  aria-pressed={a.id === contaDestinoId}
                  onClick={() => setContaDestinoId(a.id)}
                >
                  {a.nome}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="nova-transacao__campo" role="group" aria-labelledby={categoriaRotuloId}>
            <span id={categoriaRotuloId}>Categoria</span>
            <CategoriaSeletor categorias={categoriasDoTipo} value={categoriaId} onChange={setCategoriaId} opcional />
          </div>
        )}
      </div>

      <div className="nova-transacao__linha">
        <label>
          Etiqueta
          <input
            name="etiqueta"
            autoComplete="off"
            list="etiquetas-existentes"
            placeholder="Ex: Férias Cabo Verde"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
          />
          <datalist id="etiquetas-existentes">
            {etiquetasExistentes.map((et) => (
              <option key={et} value={et} />
            ))}
          </datalist>
        </label>
      </div>

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
          {aGuardar ? 'A guardar…' : transacao ? 'Guardar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
