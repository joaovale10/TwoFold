import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'

const EMAIL_ADMIN = 'joao.projects.vale@gmail.com'

export default function ConvitesPage() {
  const { user } = useAuth()
  const [convites, setConvites] = useState([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState(null)
  const [linkCopiado, setLinkCopiado] = useState(null)

  async function carregar() {
    const { data } = await supabase.rpc('admin_estado_convites')
    setConvites(data ?? [])
  }

  function estadoDe(c) {
    const expirado = new Date(c.expira_em) < new Date()
    if (c.usado) return 'utilizado'
    if (expirado) return 'expirado'
    if (c.conta_confirmada) return 'email confirmado, a aguardar entrar'
    if (c.conta_criada) return 'conta criada, a aguardar confirmação de email'
    return 'por resgatar'
  }

  useEffect(() => {
    carregar()
  }, [])

  if (user?.email !== EMAIL_ADMIN) return <Navigate to="/" replace />

  function linkDe(codigo) {
    return `${window.location.origin}/convite/${codigo}`
  }

  async function criarEspaco(e) {
    e.preventDefault()
    setErro(null)

    const { error } = await supabase.rpc('admin_criar_espaco', {
      p_nome: nome,
      p_email: email,
    })

    if (error) {
      setErro(error.message)
      return
    }

    setNome('')
    setEmail('')
    carregar()
  }

  async function copiarLink(codigo) {
    await navigator.clipboard.writeText(linkDe(codigo))
    setLinkCopiado(codigo)
    setTimeout(() => setLinkCopiado(null), 2000)
  }

  return (
    <div>
      <h1>Convites</h1>
      <p className="login-form__lead">
        Cria um espaço novo com o email da primeira pessoa (serve para um amigo solteiro ou para o
        1º membro de um casal). Cada convite só pode ser resgatado por esse email e expira ao fim
        de 14 dias. Depois de entrar, essa pessoa pode convidar o/a parceiro(a) para o mesmo espaço
        na página Casal.
      </p>

      <form onSubmit={criarEspaco} className="login-form">
        <label>
          Nome do espaço
          <input
            placeholder="Ex: João & Ana"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </label>
        <label>
          Email da pessoa
          <input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="botao-primario">
          Criar espaço e gerar convite
        </button>
      </form>
      {erro && <p className="erro">{erro}</p>}

      {convites.length === 0 ? (
        <p>Ainda não criaste nenhum convite.</p>
      ) : (
        <table className="transaction-list">
          <thead>
            <tr>
              <th>Espaço</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {convites.map((c) => {
              const expirado = new Date(c.expira_em) < new Date()
              return (
                <tr key={c.id}>
                  <td>{c.household_nome}</td>
                  <td>{c.email}</td>
                  <td>{estadoDe(c)}</td>
                  <td>
                    {!c.usado && !expirado && (
                      <button type="button" className="botao-link" onClick={() => copiarLink(c.codigo)}>
                        {linkCopiado === c.codigo ? 'Copiado!' : 'Copiar link'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
