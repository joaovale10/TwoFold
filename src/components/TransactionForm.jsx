import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { nivelDaCategoria } from '../lib/categorias'

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
  const [categoriaTopoId, setCategoriaTopoId] = useState('')
  const [categoriaSubId, setCategoriaSubId] = useState('')
  const [contaDestinoId, setContaDestinoId] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [descricao, setDescricao] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [etiquetasExistentes, setEtiquetasExistentes] = useState([])
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    async function carregarEtiquetas() {
      const { data: linhas } = await supabase
        .from('transactions')
        .select('etiqueta')
        .eq('household_id', householdId)
        .not('etiqueta', 'is', null)
      const unicas = [...new Set((linhas ?? []).map((l) => l.etiqueta))].sort()
      setEtiquetasExistentes(unicas)
    }
    carregarEtiquetas()
  }, [householdId])

  const categoriasDoTipo = categories.filter((c) => c.tipo === tipo)
  const categoriasTopoDoTipo = categoriasDoTipo.filter((c) => !c.parent_id)
  const subcategoriasDaTopo = categoriasDoTipo.filter((c) => c.parent_id === categoriaTopoId)
  const contasDestino = accounts.filter((a) => a.id !== accountId)
  const categoriaId = categoriaSubId || categoriaTopoId

  function alterarDescricao(valor) {
    setDescricao(valor)
    if (categoriaId || !valor) return

    const regra = regras.find((r) => valor.toLowerCase().includes(r.padrao.toLowerCase()))
    if (!regra) return

    const categoriaSugerida = categories.find((c) => c.id === regra.categoria_id)
    if (categoriaSugerida && categoriaSugerida.tipo === tipo) {
      const { topoId, subId } = nivelDaCategoria(categories, categoriaSugerida.id)
      setCategoriaTopoId(topoId)
      setCategoriaSubId(subId)
    }
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
            etiqueta: etiqueta.trim() || null,
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
            etiqueta: etiqueta.trim() || null,
          }

    const { error } = await supabase.from('transactions').insert(payload)

    setAEnviar(false)

    if (error) {
      setErro(error.message)
      return
    }

    setValor('')
    setDescricao('')
    setCategoriaTopoId('')
    setCategoriaSubId('')
    setContaDestinoId('')
    setData(new Date().toISOString().slice(0, 10))
    setEtiqueta('')
    setSucesso(true)
    setTimeout(() => setSucesso(false), 2500)
    onCriada()
  }

  function limpar() {
    setValor('')
    setDescricao('')
    setCategoriaTopoId('')
    setCategoriaSubId('')
    setContaDestinoId('')
    setData(new Date().toISOString().slice(0, 10))
    setEtiqueta('')
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

      <div className="nova-transacao__linha nova-transacao__linha--3">
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
        <label>
          Etiqueta
          <input
            type="text"
            list="etiquetas-existentes"
            placeholder="Ex: Férias Cabo Verde"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
          />
          <datalist id="etiquetas-existentes">
            {etiquetasExistentes.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </label>
      </div>

      <div
        className={`nova-transacao__linha ${
          tipo !== 'transferencia' && subcategoriasDaTopo.length > 0
            ? 'nova-transacao__linha--4'
            : 'nova-transacao__linha--3'
        }`}
      >
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
            <select
              value={categoriaTopoId}
              onChange={(e) => {
                setCategoriaTopoId(e.target.value)
                setCategoriaSubId('')
              }}
            >
              <option value="">Sem categoria</option>
              {categoriasTopoDoTipo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
        )}

        {tipo !== 'transferencia' && subcategoriasDaTopo.length > 0 && (
          <label>
            Subcategoria
            <select value={categoriaSubId} onChange={(e) => setCategoriaSubId(e.target.value)}>
              <option value="">Nenhuma (categoria geral)</option>
              {subcategoriasDaTopo.map((c) => (
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
