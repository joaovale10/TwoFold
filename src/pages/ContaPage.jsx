import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'

export default function ContaPage() {
  const { household } = useOutletContext()
  const { user } = useAuth()
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)
  const [aCarregar, setACarregar] = useState(true)

  useEffect(() => {
    supabase
      .from('household_members')
      .select('nome, username')
      .eq('household_id', household.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setNome(data?.nome ?? '')
        setUsername(data?.username ?? '')
        setACarregar(false)
      })
  }, [household.id, user.id])

  async function guardar(e) {
    e.preventDefault()
    setErro(null)
    setSucesso(false)

    const { error } = await supabase
      .from('household_members')
      .update({ nome, username: username.trim() || null })
      .eq('household_id', household.id)
      .eq('user_id', user.id)

    if (error) {
      setErro(
        error.message.includes('duplicate key') || error.code === '23505'
          ? 'Esse username já está a ser usado por outra pessoa.'
          : error.message
      )
      return
    }

    setSucesso(true)
  }

  if (aCarregar) return <p>A carregar...</p>

  return (
    <div>
      <h1>A minha conta</h1>
      <p className="login-form__lead">
        Email: <strong>{user.email}</strong>
      </p>

      <form onSubmit={guardar} className="nova-transacao">
        <div className="nova-transacao__linha nova-transacao__linha--2">
          <label>
            O teu nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Vale" required />
          </label>
          <label>
            Username (opcional)
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: vale"
            />
          </label>
        </div>

        <p className="login-form__lead">
          Se definires um username, podes usá-lo para entrar em vez do email.
        </p>

        {erro && <p className="erro">{erro}</p>}
        {sucesso && <p className="login-form__lead">Guardado.</p>}

        <div className="nova-transacao__acoes">
          <button type="submit" className="botao-primario">
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}
