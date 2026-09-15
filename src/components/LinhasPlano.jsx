import { useState } from 'react'

function LinhaEdicao({ item, categoriasDespesa, mostrarPoupanca, mostrarPagador, membros, onGuardar, onCancelar }) {
  const [descricao, setDescricao] = useState(item.descricao)
  const [valor, setValor] = useState(String(item.valor))
  const [categoriaId, setCategoriaId] = useState(item.categoria_id)
  const [poupanca, setPoupanca] = useState(item.poupanca)
  const [pagadorId, setPagadorId] = useState(item.user_id ?? '')
  const [erro, setErro] = useState(null)

  function guardar(e) {
    e.preventDefault()
    if (!descricao.trim()) {
      setErro('Indica uma descrição.')
      return
    }
    if (!(Number(valor) > 0)) {
      setErro('O valor tem de ser maior que zero.')
      return
    }
    if (!categoriaId) {
      setErro('Escolhe uma categoria.')
      return
    }
    if (mostrarPagador && !pagadorId) {
      setErro('Escolhe quem paga.')
      return
    }
    const dados = { descricao, valor: Number(valor), categoria_id: categoriaId, poupanca }
    if (mostrarPagador) dados.user_id = pagadorId
    onGuardar(item.id, dados)
  }

  return (
    <tr>
      <td>
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
      </td>
      <td>
        <input type="number" step="0.01" min="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required />
      </td>
      <td>
        <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
          {categoriasDespesa.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </td>
      {mostrarPagador && (
        <td>
          <select value={pagadorId} onChange={(e) => setPagadorId(e.target.value)} required>
            <option value="">Quem paga</option>
            {membros.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.nome}
              </option>
            ))}
          </select>
        </td>
      )}
      {mostrarPoupanca && (
        <td>
          <input type="checkbox" checked={poupanca} onChange={(e) => setPoupanca(e.target.checked)} />
        </td>
      )}
      <td>
        <button type="button" className="botao-link" onClick={guardar}>
          Guardar
        </button>
        <button type="button" className="botao-link" onClick={onCancelar}>
          Cancelar
        </button>
        {erro && <p className="erro">{erro}</p>}
      </td>
    </tr>
  )
}

export default function LinhasPlano({ titulo, items, categoriasDespesa, mostrarPoupanca, mostrarPagador, membros, onAdicionar, onEditar, onApagar }) {
  const [editandoId, setEditandoId] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [poupanca, setPoupanca] = useState(false)
  const [pagadorId, setPagadorId] = useState('')
  const [erro, setErro] = useState(null)

  const total = items.reduce((soma, i) => soma + Number(i.valor), 0)
  const numColunas = 3 + (mostrarPagador ? 1 : 0) + (mostrarPoupanca ? 1 : 0)

  function adicionar(e) {
    e.preventDefault()
    setErro(null)
    if (!categoriaId) {
      setErro('Escolhe uma categoria.')
      return
    }
    if (mostrarPagador && !pagadorId) {
      setErro('Escolhe quem paga.')
      return
    }
    const dados = { descricao, valor: Number(valor), categoria_id: categoriaId, poupanca }
    if (mostrarPagador) dados.user_id = pagadorId
    onAdicionar(dados)
    setDescricao('')
    setValor('')
    setCategoriaId('')
    setPoupanca(false)
    setPagadorId('')
  }

  return (
    <div className="plano-orcamento__secao">
      <h3>
        {titulo} — <span>{total.toFixed(2)} €</span>
      </h3>

      {items.length > 0 && (
        <div className="transaction-list__wrap">
          <table className="transaction-list">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Categoria</th>
                {mostrarPagador && <th>Quem paga</th>}
                {mostrarPoupanca && <th>Poupança</th>}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) =>
                editandoId === item.id ? (
                  <LinhaEdicao
                    key={item.id}
                    item={item}
                    categoriasDespesa={categoriasDespesa}
                    mostrarPoupanca={mostrarPoupanca}
                    mostrarPagador={mostrarPagador}
                    membros={membros}
                    onGuardar={(id, dados) => {
                      onEditar(id, dados)
                      setEditandoId(null)
                    }}
                    onCancelar={() => setEditandoId(null)}
                  />
                ) : (
                  <tr key={item.id}>
                    <td>{item.descricao}</td>
                    <td>{Number(item.valor).toFixed(2)} €</td>
                    <td>{categoriasDespesa.find((c) => c.id === item.categoria_id)?.nome ?? '—'}</td>
                    {mostrarPagador && <td>{membros.find((m) => m.user_id === item.user_id)?.nome ?? '—'}</td>}
                    {mostrarPoupanca && <td>{item.poupanca ? 'Sim' : '—'}</td>}
                    <td>
                      <button type="button" className="botao-link" onClick={() => setEditandoId(item.id)}>
                        Editar
                      </button>
                      <button type="button" className="botao-link" onClick={() => onApagar(item.id)}>
                        Apagar
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={adicionar} className="nova-transacao">
        <div className={`nova-transacao__linha nova-transacao__linha--${numColunas}`}>
          <label>
            Descrição
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
          </label>
          <label>
            Valor
            <input type="number" step="0.01" min="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required />
          </label>
          <label>
            Categoria
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
              <option value="">Escolher categoria</option>
              {categoriasDespesa.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          {mostrarPagador && (
            <label>
              Quem paga
              <select value={pagadorId} onChange={(e) => setPagadorId(e.target.value)} required>
                <option value="">Escolher</option>
                {membros.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          {mostrarPoupanca && (
            <label>
              É poupança
              <input
                type="checkbox"
                checked={poupanca}
                onChange={(e) => setPoupanca(e.target.checked)}
                style={{ width: 'auto', alignSelf: 'flex-start' }}
              />
            </label>
          )}
        </div>
        {erro && <p className="erro">{erro}</p>}
        <div className="nova-transacao__acoes">
          <button type="submit" className="botao-primario">
            Adicionar linha
          </button>
        </div>
      </form>
    </div>
  )
}
