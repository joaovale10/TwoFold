import { supabase } from './supabaseClient'
import { dentroDoMes } from './datas.js'
import { saldoDaConta } from './saldo.js'

// Gera a lista de notificações do momento (não fica guardada — recalculada sempre que é pedida).
export async function gerarNotificacoes(householdId) {
  const hoje = new Date()

  const [{ data: budgets }, { data: fixas }, { data: objetivos }, { data: transacoes }] = await Promise.all([
    supabase
      .from('budgets')
      .select('*, categories (nome)')
      .eq('household_id', householdId)
      .eq('tipo', 'mensal'),
    supabase.from('fixed_expenses').select('*').eq('household_id', householdId).eq('ativa', true),
    supabase.from('savings_goals').select('*, accounts (saldo_inicial)').eq('household_id', householdId),
    supabase
      .from('transactions')
      .select('account_id, conta_destino_id, tipo, valor, categoria_id, data')
      .eq('household_id', householdId)
      .is('apagada_em', null),
  ])

  const notificacoes = []

  const despesasMes = (transacoes ?? []).filter((tx) => tx.tipo === 'despesa' && dentroDoMes(tx.data, hoje))
  for (const b of budgets ?? []) {
    const gasto = despesasMes
      .filter((tx) => tx.categoria_id === b.categoria_id)
      .reduce((t, tx) => t + Number(tx.valor), 0)
    const racio = gasto / Number(b.limite_mensal)
    const nomeCategoria = b.categories?.nome ?? 'categoria'

    if (racio >= 1) {
      notificacoes.push({
        id: `orcamento-${b.id}`,
        nivel: 'vermelho',
        texto: `Orçamento de ${nomeCategoria} ultrapassado (${gasto.toFixed(2)} € / ${Number(b.limite_mensal).toFixed(2)} €)`,
      })
    } else if (racio >= 0.8) {
      notificacoes.push({
        id: `orcamento-${b.id}`,
        nivel: 'laranja',
        texto: `Restam ${(Number(b.limite_mensal) - gasto).toFixed(2)} € no orçamento de ${nomeCategoria}`,
      })
    }
  }

  const diaHoje = hoje.getDate()
  for (const f of fixas ?? []) {
    const dia = f.dia_vencimento ?? 0
    if (dia >= diaHoje && dia <= diaHoje + 7) {
      notificacoes.push({
        id: `fixa-${f.id}`,
        nivel: 'laranja',
        texto: `${f.descricao} vence no dia ${dia} (${Number(f.valor).toFixed(2)} €)`,
      })
    }
  }

  for (const o of objetivos ?? []) {
    const valorAtual = saldoDaConta({ id: o.account_id, saldo_inicial: o.accounts?.saldo_inicial ?? 0 }, transacoes ?? [])
    const percentagem = (valorAtual / Number(o.valor_objetivo)) * 100

    if (percentagem >= 100) {
      notificacoes.push({ id: `objetivo-${o.id}`, nivel: 'verde', texto: `Objetivo "${o.nome}" atingido! 🎉` })
    } else if (percentagem >= 75) {
      notificacoes.push({
        id: `objetivo-${o.id}`,
        nivel: 'verde',
        texto: `Objetivo "${o.nome}" já atingiu ${percentagem.toFixed(0)}%`,
      })
    }
  }

  return notificacoes
}
