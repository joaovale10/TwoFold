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

function ModalNovaLinha({ titulo, categoriasDespesa, mostrarPoupanca, mostrarPagador, membros, onAdicionar, onFechar }) {
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [poupanca, setPoupanca] = useState(false)
  const [pagadorId, setPagadorId] = useState('')
  const [erro, setErro] = useState(null)

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
    onFechar()
  }

  return (
    <div className="categoria-modal-fundo" onClick={onFechar}>
      <div className="categoria-modal" onClick={(e) => e.stopPropagation()}>
        <div className="categoria-modal__cabecalho">
          <h2>{titulo}</h2>
          <button type="button" className="botao-link" aria-label="Fechar" onClick={onFechar}>
            ✕
          </button>
        </div>

        <form onSubmit={adicionar} className="nova-transacao">
          <div className={`nova-transacao__linha nova-transacao__linha--${numColunas}`}>
            <label>
              Descrição
              <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required autoFocus />
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
              <label className="nova-transacao__linha__campo--checkbox">
                <input type="checkbox" checked={poupanca} onChange={(e) => setPoupanca(e.target.checked)} />
                É poupança
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
    </div>
  )
}

export default function LinhasPlano({ titulo, items, categoriasDespesa, mostrarPoupanca, mostrarPagador, membros, onAdicionar, onEditar, onApagar }) {
  const [editandoId, setEditandoId] = useState(null)
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <div className="plano-orcamento__secao">
      <h3>{titulo}</h3>

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

      <button type="button" className="botao-primario" onClick={() => setModalAberto(true)}>
        + Adicionar linha
      </button>

      {modalAberto && (
        <ModalNovaLinha
          titulo={titulo}
          categoriasDespesa={categoriasDespesa}
          mostrarPoupanca={mostrarPoupanca}
          mostrarPagador={mostrarPagador}
          membros={membros}
          onAdicionar={onAdicionar}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}
