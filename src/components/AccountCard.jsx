import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ICONES_DISPONIVEIS, obterIcone, definirIcone } from '../lib/accountIcons.js'

export default function AccountCard({ conta, saldo, atualizar }) {
  const [icone, setIcone] = useState(() => obterIcone(conta.id))
  const [aEscolherIcone, setAEscolherIcone] = useState(false)
  const [aEditar, setAEditar] = useState(false)
  const [nome, setNome] = useState(conta.nome)
  const [saldoInicial, setSaldoInicial] = useState(String(conta.saldo_inicial))
  const [erro, setErro] = useState(null)

  function escolherIcone(novoIcone) {
    setIcone(novoIcone)
    definirIcone(conta.id, novoIcone)
    setAEscolherIcone(false)
  }

  async function guardar(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase
      .from('accounts')
      .update({ nome, saldo_inicial: Number(saldoInicial) || 0 })
      .eq('id', conta.id)

    if (error) {
      setErro(error.message)
      return
    }

    setAEditar(false)
    atualizar()
  }

  async function alternarAtiva() {
    await supabase.from('accounts').update({ ativa: !conta.ativa }).eq('id', conta.id)
    atualizar()
  }

  if (aEditar) {
    return (
      <form onSubmit={guardar} className="conta-cartao conta-cartao--editar">
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label>
          Saldo inicial
          <input
            type="number"
            step="0.01"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
          />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <div className="conta-cartao__acoes">
          <button type="submit" className="botao-primario">
            Guardar
          </button>
          <button type="button" className="botao-link" onClick={() => setAEditar(false)}>
            Cancelar
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="conta-cartao" style={{ opacity: conta.ativa ? 1 : 0.55 }}>
      <button
        type="button"
        className="conta-cartao__icone"
        onClick={() => setAEscolherIcone((a) => !a)}
        title="Escolher ícone"
      >
        {icone}
      </button>

      {aEscolherIcone && (
        <div className="conta-cartao__seletor-icones">
          {ICONES_DISPONIVEIS.map((i) => (
            <button key={i} type="button" onClick={() => escolherIcone(i)}>
              {i}
            </button>
          ))}
        </div>
      )}

      <p className="conta-cartao__nome">{conta.nome}</p>
      <p className="conta-cartao__saldo">{saldo.toFixed(2)} €</p>

      <div className="conta-cartao__acoes">
        <button type="button" className="botao-link" onClick={() => setAEditar(true)}>
          Editar
        </button>
        <button type="button" className="botao-link" onClick={alternarAtiva}>
          {conta.ativa ? 'Desativar' : 'Reativar'}
        </button>
      </div>
    </div>
  )
}
