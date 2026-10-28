import { useState } from 'react'

export default function CategoriaSeletor({ categorias, value, onChange, placeholder = 'Escolher categoria', opcional = false }) {
  const [aberto, setAberto] = useState(false)
  const [topoId, setTopoId] = useState(null)

  const topo = categorias.filter((c) => !c.parent_id)
  const subsDe = (id) => categorias.filter((c) => c.parent_id === id)
  const selecionada = categorias.find((c) => c.id === value)
  const mae = selecionada?.parent_id && categorias.find((c) => c.id === selecionada.parent_id)
  const vazio = opcional ? 'Sem categoria' : placeholder
  const rotulo = selecionada ? (mae ? `${mae.nome} › ${selecionada.nome}` : selecionada.nome) : vazio
  const topoAtual = categorias.find((c) => c.id === topoId)

  function abrir() {
    setTopoId(null)
    setAberto(true)
  }

  function escolher(id) {
    onChange(id)
    setAberto(false)
  }

  return (
    <>
      <button type="button" className="categoria-seletor" onClick={abrir}>
        {rotulo}
      </button>
      {aberto && (
        <div className="categoria-modal-fundo" onClick={() => setAberto(false)}>
          <div className="categoria-modal" onClick={(e) => e.stopPropagation()}>
            <div className="categoria-modal__cabecalho">
              <h2>{topoAtual ? topoAtual.nome : 'Categoria'}</h2>
              <button type="button" className="botao-link" onClick={() => setAberto(false)}>
                ✕
              </button>
            </div>
            <div className="categoria-opcoes">
              {!topoAtual && opcional && (
                <button type="button" className={value ? '' : 'ativa'} onClick={() => escolher('')}>
                  Sem categoria
                </button>
              )}
              {!topoAtual ? (
                topo.map((c) => {
                  const temSubs = subsDe(c.id).length > 0
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={c.id === value || selecionada?.parent_id === c.id ? 'ativa' : ''}
                      onClick={() => (temSubs ? setTopoId(c.id) : escolher(c.id))}
                    >
                      {c.nome}
                      {temSubs && ' ›'}
                    </button>
                  )
                })
              ) : (
                <>
                  <button type="button" onClick={() => setTopoId(null)}>
                    ‹ Voltar
                  </button>
                  <button
                    type="button"
                    className={topoAtual.id === value ? 'ativa' : ''}
                    onClick={() => escolher(topoAtual.id)}
                  >
                    Toda a categoria ({topoAtual.nome})
                  </button>
                  {subsDe(topoAtual.id).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={s.id === value ? 'ativa' : ''}
                      onClick={() => escolher(s.id)}
                    >
                      {s.nome}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
