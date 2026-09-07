import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'

function MenuCategoria({
  podeSubcategoria,
  podeTornarCasal,
  podeApagar,
  onEditar,
  onAdicionarSub,
  onTornarCasal,
  onApagar,
}) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!aberto) return
    function fechar(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [aberto])

  return (
    <div className="categoria-menu" ref={ref}>
      <button
        type="button"
        className="categoria-menu__botao"
        aria-label="Mais opções"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        ⋮
      </button>
      {aberto && (
        <ul className="categoria-menu__lista">
          <li>
            <button
              type="button"
              onClick={() => {
                setAberto(false)
                onEditar()
              }}
            >
              Editar
            </button>
          </li>
          {podeSubcategoria && (
            <li>
              <button
                type="button"
                onClick={() => {
                  setAberto(false)
                  onAdicionarSub()
                }}
              >
                Adicionar subcategoria
              </button>
            </li>
          )}
          {podeTornarCasal && (
            <li>
              <button
                type="button"
                onClick={() => {
                  setAberto(false)
                  onTornarCasal()
                }}
              >
                Tornar casal
              </button>
            </li>
          )}
          {podeApagar && (
            <li>
              <button
                type="button"
                className="categoria-menu__botao-perigo"
                onClick={() => {
                  setAberto(false)
                  onApagar()
                }}
              >
                Apagar
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function LinhaCategoria({
  categoria,
  subcategorias,
  nivel,
  userId,
  onTornarCasal,
  onAdicionarSub,
  onApagar,
  atualizar,
}) {
  const [aEditar, setAEditar] = useState(false)
  const [nome, setNome] = useState(categoria.nome)
  const [cor, setCor] = useState(categoria.cor ?? '#4f86a0')
  const [erro, setErro] = useState(null)
  const [colapsada, setColapsada] = useState(true)

  async function guardar(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase.from('categories').update({ nome, cor }).eq('id', categoria.id)

    if (error) {
      setErro(error.message)
      return
    }

    setAEditar(false)
    atualizar()
  }

  const temSubcategorias = subcategorias.length > 0

  if (aEditar) {
    return (
      <li className={`categoria-linha categoria-linha--nivel${nivel}`}>
        <span className="categoria-linha__chevron-espaco" />
        <form onSubmit={guardar} className="categoria-linha__form-edicao">
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} />
          <button type="submit" className="botao-link">
            Guardar
          </button>
          <button type="button" className="botao-link" onClick={() => setAEditar(false)}>
            Cancelar
          </button>
        </form>
        {erro && <p className="erro">{erro}</p>}
      </li>
    )
  }

  return (
    <>
      <li className={`categoria-linha categoria-linha--nivel${nivel}`}>
        {nivel === 0 && temSubcategorias ? (
          <button
            type="button"
            className="categoria-linha__chevron"
            aria-label={colapsada ? 'Expandir subcategorias' : 'Colapsar subcategorias'}
            onClick={() => setColapsada((v) => !v)}
          >
            {colapsada ? '▶' : '▼'}
          </button>
        ) : (
          <span className="categoria-linha__chevron-espaco" />
        )}
        <span className="categoria-cor" style={{ background: categoria.cor }} />
        <span className="categoria-linha__nome">{categoria.nome}</span>
        <MenuCategoria
          podeSubcategoria={nivel === 0}
          podeTornarCasal={categoria.owner_user_id === userId}
          podeApagar={categoria.owner_user_id === null || categoria.owner_user_id === userId}
          onEditar={() => setAEditar(true)}
          onAdicionarSub={() => onAdicionarSub(categoria)}
          onTornarCasal={() => onTornarCasal(categoria.id)}
          onApagar={() => onApagar(categoria)}
        />
      </li>
      {temSubcategorias &&
        !colapsada &&
        subcategorias.map((sub) => (
          <LinhaCategoria
            key={sub.id}
            categoria={sub}
            subcategorias={[]}
            nivel={1}
            userId={userId}
            onTornarCasal={onTornarCasal}
            onAdicionarSub={onAdicionarSub}
            onApagar={onApagar}
            atualizar={atualizar}
          />
        ))}
    </>
  )
}

function ListaPorTipo({ titulo, categorias, subDe, userId, onTornarCasal, onAdicionarSub, onApagar, atualizar }) {
  if (categorias.length === 0) return null

  return (
    <>
      <p className="categoria-secao-titulo">{titulo}</p>
      <ul className="categoria-arvore">
        {categorias.map((c) => (
          <LinhaCategoria
            key={c.id}
            categoria={c}
            subcategorias={subDe(c.id)}
            nivel={0}
            userId={userId}
            onTornarCasal={onTornarCasal}
            onAdicionarSub={onAdicionarSub}
            onApagar={onApagar}
            atualizar={atualizar}
          />
        ))}
      </ul>
    </>
  )
}

function BlocoCategorias({
  titulo,
  vazio,
  principais,
  subDe,
  userId,
  onTornarCasal,
  onAdicionarSub,
  onApagar,
  atualizar,
}) {
  const receitas = principais.filter((c) => c.tipo === 'receita')
  const despesas = principais.filter((c) => c.tipo === 'despesa')

  return (
    <section className="categoria-bloco">
      <h2>{titulo}</h2>
      {principais.length === 0 ? (
        <p className="login-form__lead">{vazio}</p>
      ) : (
        <>
          <ListaPorTipo
            titulo="Receitas"
            categorias={receitas}
            subDe={subDe}
            userId={userId}
            onTornarCasal={onTornarCasal}
            onAdicionarSub={onAdicionarSub}
            onApagar={onApagar}
            atualizar={atualizar}
          />
          <ListaPorTipo
            titulo="Despesas"
            categorias={despesas}
            subDe={subDe}
            userId={userId}
            onTornarCasal={onTornarCasal}
            onAdicionarSub={onAdicionarSub}
            onApagar={onApagar}
            atualizar={atualizar}
          />
        </>
      )}
    </section>
  )
}

export default function CategoriesPage() {
  const { household, categorias, regras, atualizar } = useOutletContext()
  const { user } = useAuth()
  const [formAberto, setFormAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('despesa')
  const [cor, setCor] = useState('#4f86a0')
  const [parentId, setParentId] = useState('')
  const [visibilidade, setVisibilidade] = useState('casal')
  const [erro, setErro] = useState(null)
  const [padraoRegra, setPadraoRegra] = useState('')
  const [categoriaRegra, setCategoriaRegra] = useState('')
  const [erroRegra, setErroRegra] = useState(null)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase.from('categories').insert({
      household_id: household.id,
      nome,
      tipo,
      cor,
      parent_id: parentId || null,
      owner_user_id: visibilidade === 'individual' ? user.id : null,
    })

    if (error) {
      setErro(error.message)
      return
    }

    setNome('')
    setParentId('')
    setFormAberto(false)
    atualizar()
  }

  async function tornarCasal(id) {
    await supabase.from('categories').update({ owner_user_id: null }).eq('id', id)
    atualizar()
  }

  async function apagarCategoria(categoria) {
    const temSubs = categorias.some((c) => c.parent_id === categoria.id)
    const aviso = temSubs
      ? `Apagar "${categoria.nome}" e as suas subcategorias? As transações associadas ficam sem categoria.`
      : `Apagar "${categoria.nome}"? As transações associadas ficam sem categoria.`
    if (!window.confirm(aviso)) return

    const { error } = await supabase.rpc('apagar_categoria', { p_categoria_id: categoria.id })
    if (error) {
      window.alert(error.message)
      return
    }
    atualizar()
  }

  function adicionarSubcategoria(categoriaMae) {
    setNome('')
    setTipo(categoriaMae.tipo)
    setParentId(categoriaMae.id)
    setVisibilidade(categoriaMae.owner_user_id ? 'individual' : 'casal')
    setFormAberto(true)
  }

  async function submeterRegra(e) {
    e.preventDefault()
    setErroRegra(null)

    const { error } = await supabase
      .from('category_rules')
      .insert({ household_id: household.id, padrao: padraoRegra, categoria_id: categoriaRegra })

    if (error) {
      setErroRegra(error.message)
      return
    }

    setPadraoRegra('')
    setCategoriaRegra('')
    atualizar()
  }

  async function apagarRegra(id) {
    await supabase.from('category_rules').delete().eq('id', id)
    atualizar()
  }

  const proprias = categorias.filter((c) => c.household_id === household.id)
  const principaisCasal = proprias.filter((c) => !c.parent_id && !c.owner_user_id)
  const principaisIndividuais = proprias.filter((c) => !c.parent_id && c.owner_user_id === user.id)
  // categoria-mãe pode ser própria ou predefinida — as subcategorias criadas são sempre próprias
  const possiveisMae = categorias.filter((c) => !c.parent_id)
  const subDe = (paiId) => categorias.filter((c) => c.parent_id === paiId)

  return (
    <div>
      <h1 className="titulo-centrado">Categorias</h1>

      <div className="categoria-acoes">
        <button type="button" className="botao-primario" onClick={() => setFormAberto(true)}>
          + Nova categoria
        </button>
      </div>

      {formAberto && (
        <div className="categoria-modal-fundo" onClick={() => setFormAberto(false)}>
          <div className="categoria-modal" onClick={(e) => e.stopPropagation()}>
            <div className="categoria-modal__cabecalho">
              <h2>Nova categoria</h2>
              <button
                type="button"
                className="botao-link"
                aria-label="Fechar"
                onClick={() => setFormAberto(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submeter} className="nova-transacao">
              <div className="nova-transacao__linha nova-transacao__linha--2">
                <label>
                  Nome
                  <input
                    placeholder="Ex: Ginásio"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Tipo
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                  </select>
                </label>
              </div>

              <div className="nova-transacao__linha nova-transacao__linha--2">
                <label>
                  Categoria-mãe
                  <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                    <option value="">Categoria Principal</option>
                    {possiveisMae
                      .filter((c) => c.tipo === tipo)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          Subcategoria de {c.nome}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Cor
                  <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} />
                </label>
              </div>

              <div className="nova-transacao__linha nova-transacao__linha--2">
                <label>
                  Visibilidade
                  <select value={visibilidade} onChange={(e) => setVisibilidade(e.target.value)}>
                    <option value="casal">Casal (partilhada)</option>
                    <option value="individual">Individual (só eu)</option>
                  </select>
                </label>
              </div>

              {erro && <p className="erro">{erro}</p>}

              <div className="nova-transacao__acoes">
                <button type="submit" className="botao-primario">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BlocoCategorias
        titulo="Categorias casal"
        vazio="Ainda não há categorias casal."
        principais={principaisCasal}
        subDe={subDe}
        userId={user.id}
        onTornarCasal={tornarCasal}
        onAdicionarSub={adicionarSubcategoria}
        onApagar={apagarCategoria}
        atualizar={atualizar}
      />

      <BlocoCategorias
        titulo="As minhas categorias individuais"
        vazio="Ainda não criaste categorias individuais."
        principais={principaisIndividuais}
        subDe={subDe}
        userId={user.id}
        onTornarCasal={tornarCasal}
        onAdicionarSub={adicionarSubcategoria}
        onApagar={apagarCategoria}
        atualizar={atualizar}
      />

      <h2>Regras automáticas de categorização</h2>
      <p className="login-form__lead">
        Quando a descrição de uma transação contiver o padrão, a categoria é sugerida automaticamente.
      </p>

      <form onSubmit={submeterRegra} className="nova-transacao">
        <div className="nova-transacao__linha nova-transacao__linha--2">
          <label>
            Padrão no texto
            <input
              placeholder="Ex: Mercadona"
              value={padraoRegra}
              onChange={(e) => setPadraoRegra(e.target.value)}
              required
            />
          </label>
          <label>
            Categoria a sugerir
            <select value={categoriaRegra} onChange={(e) => setCategoriaRegra(e.target.value)} required>
              <option value="">Escolher categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {erroRegra && <p className="erro">{erroRegra}</p>}

        <div className="nova-transacao__acoes">
          <button type="submit" className="botao-primario">
            Adicionar regra
          </button>
        </div>
      </form>

      {regras.length === 0 ? (
        <p>Ainda não há regras definidas.</p>
      ) : (
        <ul className="categoria-lista">
          {regras.map((r) => {
            const categoria = categorias.find((c) => c.id === r.categoria_id)
            return (
              <li key={r.id}>
                "{r.padrao}" → {categoria?.nome ?? '—'}
                <button type="button" className="botao-link" onClick={() => apagarRegra(r.id)}>
                  Apagar
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
