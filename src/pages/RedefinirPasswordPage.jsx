import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function RedefinirPasswordPage() {
  const { session, loading, updateUser } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState(null)
  const [aEnviar, setAEnviar] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [linkInvalido, setLinkInvalido] = useState(false)

  useEffect(() => {
    if (!loading && !session) setLinkInvalido(true)
  }, [loading, session])

  async function submeter(e) {
    e.preventDefault()
    setErro(null)

    if (password !== confirmar) {
      setErro('As passwords não coincidem.')
      return
    }

    setAEnviar(true)
    const { error } = await updateUser({ password })
    setAEnviar(false)

    if (error) {
      setErro(error.message)
      return
    }
    setConcluido(true)
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
          <p className="login-hero__sub">Define uma nova password.</p>
        </div>
      </section>

      <section className="login-panel">
        {loading && (
          <div className="login-form">
            <p>A verificar o link...</p>
          </div>
        )}

        {!loading && linkInvalido && (
          <div className="login-form">
            <h2>Link inválido ou expirado</h2>
            <p className="login-form__lead">
              Pede um novo link em "Esqueceste-te da password?" na página de entrada.
            </p>
            <a className="botao-primario" href="/login">
              Voltar ao login
            </a>
          </div>
        )}

        {!loading && !linkInvalido && concluido && (
          <div className="login-form">
            <h2>Password alterada!</h2>
            <p className="login-form__lead">Já podes entrar com a nova password.</p>
            <a className="botao-primario" href="/">
              Ir para a app
            </a>
          </div>
        )}

        {!loading && !linkInvalido && !concluido && (
          <form onSubmit={submeter} className="login-form" aria-label="Definir nova password">
            <h2>Nova password</h2>

            <label>
              Nova palavra-passe
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
            <label>
              Confirmar palavra-passe
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
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
              {aEnviar ? 'Um momento...' : 'Guardar nova password'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
