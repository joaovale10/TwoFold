import { supabase } from './supabaseClient'
import { dataLocalISO } from './datas'

function* mesesEntre(inicio, fim) {
  const atual = { ano: inicio.ano, mes: inicio.mes }
  while (atual.ano < fim.ano || (atual.ano === fim.ano && atual.mes <= fim.mes)) {
    yield { ano: atual.ano, mes: atual.mes }
    atual.mes += 1
    if (atual.mes > 11) {
      atual.mes = 0
      atual.ano += 1
    }
  }
}

function proximoMes({ ano, mes }) {
  return mes === 11 ? { ano: ano + 1, mes: 0 } : { ano, mes: mes + 1 }
}

// Cria as transações reais em falta para cada despesa fixa ativa, desde o
// último vencimento gerado (ou data_inicio) até hoje. Idempotente: cada
// despesa fixa guarda `ultima_geracao`, por isso correr isto várias vezes
// (ex: ambos os membros a abrir a app) não duplica transações já lançadas.
export async function gerarTransacoesRecorrentes(householdId, userId) {
  const { data: despesas } = await supabase
    .from('fixed_expenses')
    .select('*')
    .eq('household_id', householdId)
    .eq('ativa', true)

  const hoje = new Date()

  for (const despesa of despesas ?? []) {
    const referencia = despesa.ultima_geracao ? new Date(despesa.ultima_geracao) : new Date(despesa.data_inicio)
    let inicio = { ano: referencia.getFullYear(), mes: referencia.getMonth() }
    if (despesa.ultima_geracao) inicio = proximoMes(inicio)

    const fim = { ano: hoje.getFullYear(), mes: hoje.getMonth() }

    const novasTransacoes = []
    let ultimaDataGerada = null

    for (const { ano, mes } of mesesEntre(inicio, fim)) {
      const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate()
      const dia = Math.min(despesa.dia_vencimento, ultimoDiaMes)
      const dataVencimento = new Date(ano, mes, dia)
      if (dataVencimento > hoje) break

      novasTransacoes.push({
        household_id: householdId,
        account_id: despesa.account_id,
        user_id: userId,
        tipo: 'despesa',
        valor: despesa.valor,
        categoria_id: despesa.categoria_id,
        data: dataLocalISO(dataVencimento),
        descricao: despesa.descricao,
        fixed_expense_id: despesa.id,
      })
      ultimaDataGerada = dataLocalISO(dataVencimento)
    }

    if (novasTransacoes.length === 0) continue

    // A BD garante uma transação por despesa e data, mesmo com os dois membros a abrir a app ao mesmo tempo.
    const { error: erroInsert } = await supabase
      .from('transactions')
      .upsert(novasTransacoes, { onConflict: 'fixed_expense_id,data', ignoreDuplicates: true })
    if (erroInsert) {
      console.error('Falha ao gerar transações recorrentes:', erroInsert)
      continue
    }

    await supabase.from('fixed_expenses').update({ ultima_geracao: ultimaDataGerada }).eq('id', despesa.id)
  }
}
