import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function CategoriaEditavel({ categoria, subcategorias, atualizar }) {
  const [aEditar, setAEditar] = useState(false)
  const [nome, setNome] = useState(categoria.nome)
  const [cor, setCor] = useState(categoria.cor ?? '#4f86a0')
  const [erro, setErro] = useState(null)

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

  if (aEditar) {
    return (
      <li>
        <form onSubmit={guardar} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={{ minWidth: '16rem' }}
            required
          />
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
    <li>
      <span className="categoria-cor" style={{ background: categoria.cor }} /> {categoria.nome}
      <button type="button" className="botao-link" onClick={() => setAEditar(true)}>
        Editar
      </button>
      {subcategorias.length > 0 && (
        <ul className="categoria-lista categoria-lista--sub">
          {subcategorias.map((sub) => (
            <CategoriaEditavel key={sub.id} categoria={sub} subcategorias={[]} atualizar={atualizar} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function CategoriesPage() {
  const { household, categorias, regras, atualizar } = useOutletContext()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('despesa')
  const [cor, setCor] = useState('#4f86a0')
  const [parentId, setParentId] = useState('')
  const [erro, setErro] = useState(null)
  const [padraoRegra, setPadraoRegra] = useState('')
  const [categoriaRegra, setCategoriaRegra] = useState('')
  const [erroRegra, setErroRegra] = useState(null)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase
      .from('categories')
      .insert({ household_id: household.id, nome, tipo, cor, parent_id: parentId || null })

    if (error) {
      setErro(error.message)
      return
    }

    setNome('')
    setParentId('')
    atualizar()
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
  const principaisProprias = proprias.filter((c) => !c.parent_id)
  // categoria-mãe pode ser própria ou predefinida — as subcategorias criadas são sempre próprias
  const possiveisMae = categorias.filter((c) => !c.parent_id)
  const subDe = (paiId) => categorias.filter((c) => c.parent_id === paiId)

  return (
    <div>
      <h1>Categorias</h1>

      <form onSubmit={submeter} className="transaction-form">
        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ minWidth: '16rem' }}
          required
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="despesa">Despesa</option>
          <option value="receita">Receita</option>
        </select>
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
        <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} />
        <button type="submit" className="botao-primario">
          Adicionar
        </button>
      </form>
      {erro && <p className="erro">{erro}</p>}

      <h2>As tuas categorias</h2>
      {principaisProprias.length === 0 ? (
        <p>Ainda não criaste categorias próprias.</p>
      ) : (
        <ul className="categoria-lista">
          {principaisProprias.map((c) => (
            <CategoriaEditavel key={c.id} categoria={c} subcategorias={subDe(c.id)} atualizar={atualizar} />
          ))}
        </ul>
      )}

      <h2>Regras automáticas de categorização</h2>
      <p className="login-form__lead">
        Quando a descrição de uma transação contiver o padrão, a categoria é sugerida automaticamente.
      </p>

      <form onSubmit={submeterRegra} className="transaction-form">
        <input
          placeholder="Padrão no texto (ex: Mercadona)"
          value={padraoRegra}
          onChange={(e) => setPadraoRegra(e.target.value)}
          required
        />
        <select value={categoriaRegra} onChange={(e) => setCategoriaRegra(e.target.value)} required>
          <option value="">Categoria a sugerir</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <button type="submit" className="botao-primario">
          Adicionar regra
        </button>
      </form>
      {erroRegra && <p className="erro">{erroRegra}</p>}

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
