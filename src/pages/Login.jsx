import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const { session, signInWithPassword } = useAuth()
  const [identificador, setIdentificador] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)
  const [aEnviar, setAEnviar] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setAEnviar(true)

    let email = identificador.trim()
    if (!email.includes('@')) {
      const { data } = await supabase.rpc('email_de_username', { p_username: email })
      if (!data) {
        setAEnviar(false)
        setErro('Credenciais inválidas.')
        return
      }
      email = data
    }

    const { error } = await signInWithPassword(email, password)

    setAEnviar(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="login-page">
      <section className="login-hero" aria-hidden="true">
        <div className="login-hero__inner">
          <h1 className="login-hero__marca">TwoFold</h1>
          <p className="login-hero__frase">
            O que é teu.
            <br />O que é dele.
            <br /><em>O que é vosso.</em>
          </p>

          <p className="login-hero__sub">
            Cada um com o seu espaço. E um espaço só para os dois.
          </p>
        </div>
      </section>

      <section className="login-panel">
        <form onSubmit={submeter} className="login-form" aria-label="Entrar">
          <h2>Bem-vindo de volta</h2>
          <p className="login-form__lead">Entra para ver as contas do casal.</p>

          <label>
            Email ou username
            <input
              type="text"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Palavra-passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={6}
              required
            />
          </label>

          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" className="botao-primario" disabled={aEnviar}>
            {aEnviar ? 'Um momento...' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  )
}
