import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'

export default function AceitarConvitePage() {
  const { codigo } = useParams()
  const { session, signUp } = useAuth()
  const [convite, setConvite] = useState(undefined)
  const [nome, setNome] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)
  const [aEnviar, setAEnviar] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [aResgatar, setAResgatar] = useState(false)
  const [resgatado, setResgatado] = useState(false)

  const chaveNome = `convite_nome_${codigo}`

  useEffect(() => {
    supabase
      .rpc('estado_convite', { p_codigo: codigo })
      .then(({ data }) => setConvite(data?.[0] ?? null))
  }, [codigo])

  // Depois de confirmar o email, a pessoa volta a esta página já com sessão
  // ativa — nesse momento é que se consome o convite.
  useEffect(() => {
    if (!session || !convite || !convite.valido || aResgatar || resgatado) return

    setAResgatar(true)
    const nomeGuardado = localStorage.getItem(chaveNome) || ''

    supabase.rpc('resgatar_convite', { p_codigo: codigo, p_nome: nomeGuardado }).then(({ error }) => {
      setAResgatar(false)
      if (error) {
        setErro(error.message)
        return
      }
      localStorage.removeItem(chaveNome)
      setResgatado(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, convite])

  const invalido = convite === null || (convite && !convite.valido)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setAEnviar(true)

    localStorage.setItem(chaveNome, nome)

    const { error } = await signUp(convite.email, password, {
      emailRedirectTo: `${window.location.origin}/convite/${codigo}`,
    })

    setAEnviar(false)
    if (error) {
      setErro(error.message)
      return
    }
    setEmailEnviado(true)
  }

  return (
    <div className="login-page">
      <section className="login-hero" aria-hidden="true">
        <div className="login-hero__inner">
          <p className="login-hero__eyebrow">TwoFold</p>
          <h1 className="login-hero__headline">
            O que é teu.
            <br />O que é dele.
            <br /><em>O que é vosso.</em>
          </h1>
          <p className="login-hero__sub">Foste convidado a criar o teu próprio espaço.</p>
        </div>
      </section>

      <section className="login-panel">
        {convite === undefined && (
          <div className="login-form">
            <p>A verificar convite...</p>
          </div>
        )}

        {convite !== undefined && invalido && (
          <div className="login-form">
            <h2>Convite inválido</h2>
            <p className="login-form__lead">
              Este convite já expirou, já foi utilizado ou não existe. Pede um novo a quem te
              convidou.
            </p>
          </div>
        )}

        {convite !== undefined && !invalido && session && (
          <div className="login-form">
            {resgatado ? (
              <>
                <h2>Espaço criado!</h2>
                <p className="login-form__lead">A tua conta está pronta.</p>
                <a className="botao-primario" href="/">
                  Ir para a app
                </a>
              </>
            ) : erro ? (
              <>
                <h2>Não foi possível concluir</h2>
                <p className="erro" role="alert">
                  {erro}
                </p>
              </>
            ) : (
              <p>A confirmar o teu email e a criar o teu espaço...</p>
            )}
          </div>
        )}

        {convite !== undefined && !invalido && !session && emailEnviado && (
          <div className="login-form">
            <h2>Confirma o teu email</h2>
            <p className="login-form__lead">
              Enviámos um link de confirmação para <strong>{convite.email}</strong>. Abre-o para
              ativares a tua conta e entrares automaticamente no teu espaço.
            </p>
          </div>
        )}

        {convite !== undefined && !invalido && !session && !emailEnviado && (
          <form onSubmit={submeter} className="login-form" aria-label="Aceitar convite">
            <h2>Cria a tua conta</h2>
            <p className="login-form__lead">
              Vais entrar no espaço "{convite.household_nome}", com a conta {convite.email}.
            </p>

            <label>
              O teu nome
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Vale"
                required
              />
            </label>
            <label>
              Email
              <input type="email" value={convite.email} disabled />
            </label>
            <label>
              Palavra-passe
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {aEnviar ? 'Um momento...' : 'Criar conta'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
