// Script de uso único para definir/alterar a password de um utilizador
// diretamente via Supabase Admin API, sem depender de emails.
//
// NUNCA commitar a Secret key. Usa-a só localmente, passando-a como
// variável de ambiente na própria linha de comandos.
//
// Uso (PowerShell, a partir da pasta do projeto):
//   $env:SUPABASE_URL="https://vnrsbxgygvccoefojdff.supabase.co"
//   $env:SUPABASE_SECRET_KEY="sb_secret_..."
//   node scripts/reset-password.js email@exemplo.com novaPasswordSegura

import { createClient } from '@supabase/supabase-js'

const [, , email, novaPassword] = process.argv

if (!email || !novaPassword) {
  console.error('Uso: node scripts/reset-password.js <email> <novaPassword>')
  process.exit(1)
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  console.error(
    'Falta definir as variáveis de ambiente SUPABASE_URL e SUPABASE_SECRET_KEY antes de correr este script.'
  )
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: usersData, error: erroLista } = await supabaseAdmin.auth.admin.listUsers()

if (erroLista) {
  console.error('Erro ao listar utilizadores:', erroLista.message)
  process.exit(1)
}

const user = usersData.users.find((u) => u.email === email)

if (!user) {
  console.error(`Não encontrei nenhum utilizador com o email "${email}".`)
  process.exit(1)
}

const { error: erroUpdate } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
  password: novaPassword,
})

if (erroUpdate) {
  console.error('Erro ao atualizar a password:', erroUpdate.message)
  process.exit(1)
}

console.log(`Password atualizada com sucesso para ${email}.`)
