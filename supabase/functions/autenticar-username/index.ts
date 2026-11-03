// Login e recuperação de password por username, feitos no servidor para o
// email da conta nunca chegar a quem ainda não tem sessão.
import { createClient } from 'npm:@supabase/supabase-js@2'

const url = Deno.env.get('SUPABASE_URL')!
const opcoes = { auth: { autoRefreshToken: false, persistSession: false } }
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, opcoes)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function resposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

async function emailDoUsername(username: string) {
  const { data: membro } = await admin
    .from('household_members')
    .select('user_id')
    .eq('username', username)
    .maybeSingle()
  if (!membro) return null
  const { data } = await admin.auth.admin.getUserById(membro.user_id)
  return data.user?.email ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return resposta({ erro: 'Método não permitido' }, 405)

  const { acao, username, password, redirectTo } = await req.json().catch(() => ({}))
  if (typeof username !== 'string' || !username) return resposta({ erro: 'Pedido inválido' }, 400)

  const email = await emailDoUsername(username)
  // O cliente de login não pode ser o `admin`: signIn substituiria a sua sessão.
  const publico = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, opcoes)

  if (acao === 'entrar') {
    if (!email || typeof password !== 'string') return resposta({ erro: 'Credenciais inválidas.' }, 401)
    const { data, error } = await publico.auth.signInWithPassword({ email, password })
    if (error || !data.session) return resposta({ erro: 'Credenciais inválidas.' }, 401)
    const { access_token, refresh_token } = data.session
    return resposta({ access_token, refresh_token })
  }

  if (acao === 'recuperar') {
    // Responde sempre igual, para não revelar se o username existe.
    if (email) await publico.auth.resetPasswordForEmail(email, { redirectTo })
    return resposta({ ok: true })
  }

  return resposta({ erro: 'Pedido inválido' }, 400)
})
