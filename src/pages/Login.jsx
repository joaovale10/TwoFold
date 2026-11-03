import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const { session, signInWithPassword, resetPasswordForEmail } = useAuth()
  const [identificador, setIdentificador] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)
  const [aEnviar, setAEnviar] = useState(false)
  const [modo, setModo] = useState('entrar') // 'entrar' | 'recuperar'
  const [emailRecuperacao, setEmailRecuperacao] = useState('')
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function entrarComUsername(username) {
    const { data, error } = await supabase.functions.invoke('autenticar-username', {
      body: { acao: 'entrar', username, password },
    })
    if (error) return { message: 'Credenciais inválidas.' }
    return (await supabase.auth.setSession(data)).error
  }

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setAEnviar(true)

    const valor = identificador.trim()
    const error = valor.includes('@')
      ? (await signInWithPassword(valor, password)).error
      : await entrarComUsername(valor)

    setAEnviar(false)
    if (error) setErro(error.message)
  }

  async function submeterRecuperacao(e) {
    e.preventDefault()
    setErro(null)
    setAEnviar(true)

    const valor = emailRecuperacao.trim()
    const redirectTo = `${window.location.origin}/redefinir-password`
    const { error } = valor.includes('@')
      ? await resetPasswordForEmail(valor, redirectTo)
      : await supabase.functions.invoke('autenticar-username', {
          body: { acao: 'recuperar', username: valor, redirectTo },
        })

    setAEnviar(false)
    if (error) {
      setErro(error.message)
      return
    }
    setPedidoEnviado(true)
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
        {modo === 'entrar' && (
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

            <button
              type="button"
              className="botao-link"
              onClick={() => {
                setErro(null)
                setModo('recuperar')
              }}
            >
              Esqueceste-te da password?
            </button>
          </form>
        )}

        {modo === 'recuperar' && (
          <div className="login-form">
            <h2>Recuperar password</h2>

            {pedidoEnviado ? (
              <p className="login-form__lead">
                Se existir uma conta com esse email/username, enviámos um link para redefinires a
                password. Verifica a caixa de entrada (e o spam).
              </p>
            ) : (
              <form onSubmit={submeterRecuperacao} aria-label="Recuperar password">
                <p className="login-form__lead">
                  Indica o teu email ou username e enviamos-te um link para definires uma nova
                  password.
                </p>

                <label>
                  Email ou username
                  <input
                    type="text"
                    value={emailRecuperacao}
                    onChange={(e) => setEmailRecuperacao(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </label>

                {erro && (
                  <p className="erro" role="alert">
                    {erro}
                  </p>
                )}

                <button type="submit" className="botao-primario" disabled={aEnviar}>
                  {aEnviar ? 'Um momento...' : 'Enviar link'}
                </button>
              </form>
            )}

            <button
              type="button"
              className="botao-link"
              onClick={() => {
                setErro(null)
                setPedidoEnviado(false)
                setModo('entrar')
              }}
            >
              Voltar a entrar
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
