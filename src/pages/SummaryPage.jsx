import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'
import { dentroDoMes } from '../lib/datas.js'
import { saldoDaConta } from '../lib/saldo.js'
import CategoryPieChart from '../components/CategoryPieChart.jsx'

export default function SummaryPage() {
  const { household, contas, categorias } = useOutletContext()
  const { user } = useAuth()
  const [transacoes, setTransacoes] = useState([])
  const [despesasFixas, setDespesasFixas] = useState([])
  const [budgetsMensais, setBudgetsMensais] = useState([])
  const [ambito, setAmbito] = useState('tudo') // 'tudo' | 'pessoal' | 'casal'
  const [periodo, setPeriodo] = useState('mes-atual') // 'mes-atual' | 'tudo' | 'intervalo'
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    supabase
      .from('transactions')
      .select('account_id, conta_destino_id, tipo, valor, categoria_id, data')
      .eq('household_id', household.id)
      .then(({ data }) => setTransacoes(data ?? []))

    supabase
      .from('fixed_expenses')
      .select('*')
      .eq('household_id', household.id)
      .eq('ativa', true)
      .then(({ data }) => setDespesasFixas(data ?? []))

    supabase
      .from('budgets')
      .select('limite_mensal')
      .eq('household_id', household.id)
      .eq('tipo', 'mensal')
      .then(({ data }) => setBudgetsMensais(data ?? []))
  }, [household.id])

  const contasPessoais = contas.filter((c) => c.owner_user_id === user.id)
  const contasCasal = contas.filter((c) => c.tipo === 'casal')
  const contasNoAmbito =
    ambito === 'pessoal' ? contasPessoais : ambito === 'casal' ? contasCasal : contas

  const idsContasNoAmbito = new Set(contasNoAmbito.map((c) => c.id))
  const saldoPessoal = contasPessoais.reduce((t, c) => t + saldoDaConta(c, transacoes), 0)
  const saldoCasal = contasCasal.reduce((t, c) => t + saldoDaConta(c, transacoes), 0)
  const patrimonio = saldoPessoal + saldoCasal

  const hoje = new Date()
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)

  const transacoesNoAmbito = transacoes.filter((tx) => idsContasNoAmbito.has(tx.account_id))

  function emPeriodo(dataISO) {
    if (periodo === 'tudo') return true
    if (periodo === 'mes-atual') return dentroDoMes(dataISO, hoje)
    // intervalo: comparação de strings ISO (YYYY-MM-DD) funciona como comparação de datas
    return (!dataInicio || dataISO >= dataInicio) && (!dataFim || dataISO <= dataFim)
  }

  function totaisDoMes(referencia) {
    const doMes = transacoesNoAmbito.filter(
      (tx) => tx.tipo !== 'transferencia' && dentroDoMes(tx.data, referencia)
    )
    const receitas = doMes.filter((tx) => tx.tipo === 'receita').reduce((t, tx) => t + Number(tx.valor), 0)
    const despesas = doMes.filter((tx) => tx.tipo === 'despesa').reduce((t, tx) => t + Number(tx.valor), 0)
    return { receitas, despesas }
  }

  const transacoesNoPeriodo = transacoesNoAmbito.filter(
    (tx) => tx.tipo !== 'transferencia' && emPeriodo(tx.data)
  )
  const atual = {
    receitas: transacoesNoPeriodo.filter((tx) => tx.tipo === 'receita').reduce((t, tx) => t + Number(tx.valor), 0),
    despesas: transacoesNoPeriodo.filter((tx) => tx.tipo === 'despesa').reduce((t, tx) => t + Number(tx.valor), 0),
  }
  const anterior = totaisDoMes(mesAnterior)
  const poupancaMes = atual.receitas - atual.despesas
  const poupancaAnterior = anterior.receitas - anterior.despesas
  const evolucao = poupancaMes - poupancaAnterior

  const despesasPorCategoria = {}
  transacoesNoPeriodo
    .filter((tx) => tx.tipo === 'despesa')
    .forEach((tx) => {
      despesasPorCategoria[tx.categoria_id] = (despesasPorCategoria[tx.categoria_id] ?? 0) + Number(tx.valor)
    })
  const categoriaPorId = Object.fromEntries(categorias.map((c) => [c.id, c]))
  const linhasCategorias = Object.entries(despesasPorCategoria)
    .map(([categoriaId, valor]) => ({ categoria: categoriaPorId[categoriaId], valor }))
    .sort((a, b) => b.valor - a.valor)
  const dadosGrafico = linhasCategorias.map(({ categoria, valor }) => ({
    nome: categoria?.nome ?? 'Sem categoria',
    valor,
    cor: categoria?.cor ?? '#999',
  }))

  const orcamentoMensalTotal = budgetsMensais.reduce((t, b) => t + Number(b.limite_mensal), 0)
  const totaisMesAtual = totaisDoMes(hoje)

  // Insights: sempre comparados mês atual vs mês anterior, independentes do filtro de período acima.
  function despesasPorCategoriaDoMes(referencia) {
    const totais = {}
    transacoesNoAmbito
      .filter((tx) => tx.tipo === 'despesa' && dentroDoMes(tx.data, referencia))
      .forEach((tx) => {
        totais[tx.categoria_id] = (totais[tx.categoria_id] ?? 0) + Number(tx.valor)
      })
    return totais
  }

  const insights = []
  const categoriasMesAtual = despesasPorCategoriaDoMes(hoje)
  const categoriasMesAnterior = despesasPorCategoriaDoMes(mesAnterior)
  const categoriaTopoId = Object.entries(categoriasMesAtual).sort((a, b) => b[1] - a[1])[0]?.[0]

  if (categoriaTopoId && totaisMesAtual.despesas > 0) {
    const nomeCategoriaTopo = categoriaPorId[categoriaTopoId]?.nome ?? 'Sem categoria'
    const valorTopo = categoriasMesAtual[categoriaTopoId]
    const partilha = (valorTopo / totaisMesAtual.despesas) * 100
    insights.push(`${nomeCategoriaTopo} representa ${partilha.toFixed(0)}% das tuas despesas este mês.`)

    const valorAnteriorTopo = categoriasMesAnterior[categoriaTopoId]
    if (valorAnteriorTopo > 0) {
      const variacao = ((valorTopo - valorAnteriorTopo) / valorAnteriorTopo) * 100
      insights.push(
        `Gastaste ${Math.abs(variacao).toFixed(0)}% ${variacao <= 0 ? 'menos' : 'mais'} em ${nomeCategoriaTopo} do que no mês passado.`
      )
    }
  }

  if (anterior.receitas > 0 && atual.receitas > 0) {
    const taxaAtual = (poupancaMes / atual.receitas) * 100
    const taxaAnterior = (poupancaAnterior / anterior.receitas) * 100
    const diferenca = taxaAtual - taxaAnterior
    insights.push(
      `Estás a poupar ${Math.abs(diferenca).toFixed(1)} pontos percentuais ${diferenca >= 0 ? 'acima' : 'abaixo'} da taxa de poupança do mês passado.`
    )
  }

  const diaHoje = hoje.getDate()
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
  const despesasFixasRestantes = despesasFixas
    .filter((d) => (d.dia_vencimento ?? 0) >= diaHoje)
    .reduce((t, d) => t + Number(d.valor), 0)
  const proximasFixas = despesasFixas
    .filter((d) => (d.dia_vencimento ?? 0) >= diaHoje)
    .sort((a, b) => a.dia_vencimento - b.dia_vencimento)
    .slice(0, 5)

  const disponivel = patrimonio - despesasFixasRestantes
  const diasRestantes = Math.max(1, ultimoDiaMes - diaHoje + 1)
  const limiteDiario = disponivel / diasRestantes

  insights.push(
    `Mantendo o ritmo atual, deves terminar o mês com aproximadamente ${disponivel.toFixed(2)} € de saldo disponível.`
  )

  const nomeMes = hoje.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  const rotuloPeriodo =
    periodo === 'mes-atual'
      ? nomeMes
      : periodo === 'tudo'
        ? 'Todo o histórico'
        : `${dataInicio || '...'} a ${dataFim || '...'}`

  return (
    <div>
      <div className="resumo-cabecalho">
        <h1>Resumo</h1>
        <div className="tipo-toggle">
          <button type="button" className={ambito === 'tudo' ? 'ativo' : ''} onClick={() => setAmbito('tudo')}>
            Tudo
          </button>
          <button
            type="button"
            className={ambito === 'pessoal' ? 'ativo' : ''}
            onClick={() => setAmbito('pessoal')}
          >
            A minha conta
          </button>
          <button type="button" className={ambito === 'casal' ? 'ativo' : ''} onClick={() => setAmbito('casal')}>
            Casal
          </button>
        </div>
      </div>

      <div className="resumo-cabecalho">
        <p className="login-form__lead" style={{ textTransform: 'capitalize', margin: 0 }}>
          {rotuloPeriodo}
        </p>
        <div className="tipo-toggle">
          <button
            type="button"
            className={periodo === 'mes-atual' ? 'ativo' : ''}
            onClick={() => setPeriodo('mes-atual')}
          >
            Mês atual
          </button>
          <button type="button" className={periodo === 'tudo' ? 'ativo' : ''} onClick={() => setPeriodo('tudo')}>
            Tudo
          </button>
          <button
            type="button"
            className={periodo === 'intervalo' ? 'ativo' : ''}
            onClick={() => setPeriodo('intervalo')}
          >
            Intervalo
          </button>
        </div>
      </div>

      {periodo === 'intervalo' && (
        <div className="filtro-datas">
          <label>
            De
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </label>
          <label>
            Até
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </label>
        </div>
      )}

      <div className="resumo-grelha">
        <div className="resumo-cartao resumo-cartao--destaque">
          <p className="resumo-cartao__label">Património</p>
          <p className="resumo-cartao__valor">{patrimonio.toFixed(2)} €</p>
          {periodo === 'mes-atual' && (
            <p className={`resumo-evolucao ${evolucao >= 0 ? 'positiva' : 'negativa'}`}>
              {evolucao >= 0 ? '↑' : '↓'} {Math.abs(evolucao).toFixed(2)} € vs. mês passado
            </p>
          )}
        </div>
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Receitas no período</p>
          <p className="resumo-cartao__valor">{atual.receitas.toFixed(2)} €</p>
        </div>
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Despesas no período</p>
          <p className="resumo-cartao__valor">{atual.despesas.toFixed(2)} €</p>
        </div>
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Poupança no período</p>
          <p className="resumo-cartao__valor">{poupancaMes.toFixed(2)} €</p>
        </div>
      </div>

      <div className="resumo-grelha resumo-grelha--contas">
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">👤 A tua conta — Pessoal</p>
          <p className="resumo-cartao__valor">{saldoPessoal.toFixed(2)} €</p>
        </div>
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">🏠 Casal — Conjunto</p>
          <p className="resumo-cartao__valor">{saldoCasal.toFixed(2)} €</p>
        </div>
      </div>

      <div className="resumo-duas-colunas">
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Despesas no período por categoria</p>
          {linhasCategorias.length === 0 ? (
            <p>Sem despesas neste período.</p>
          ) : (
            <>
              <CategoryPieChart dados={dadosGrafico} />
              <ul className="resumo-lista-categorias">
                {linhasCategorias.map(({ categoria, valor }) => (
                  <li key={categoria?.id ?? 'sem-categoria'}>
                    <span>
                      <span className="categoria-cor" style={{ background: categoria?.cor ?? '#999' }} />{' '}
                      {categoria?.nome ?? 'Sem categoria'}
                    </span>
                    <span>{valor.toFixed(2)} €</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Orçamento deste mês</p>
          {orcamentoMensalTotal === 0 ? (
            <p>Ainda não definiste orçamentos mensais.</p>
          ) : (
            <>
              <p className="budget-item__cabecalho">
                <span>
                  {totaisMesAtual.despesas.toFixed(2)} € / {orcamentoMensalTotal.toFixed(2)} €
                </span>
              </p>
              <div className="budget-item__barra">
                <div
                  className="budget-item__progresso"
                  style={{
                    width: `${Math.min(100, Math.round((totaisMesAtual.despesas / orcamentoMensalTotal) * 100))}%`,
                    background: totaisMesAtual.despesas >= orcamentoMensalTotal ? 'var(--danger)' : 'var(--accent)',
                  }}
                />
              </div>
              <p className="login-form__lead">Resta {(orcamentoMensalTotal - totaisMesAtual.despesas).toFixed(2)} €</p>
            </>
          )}
        </div>
      </div>

      <div className="resumo-cartao resumo-cartao--destaque">
        <p className="resumo-cartao__label">Disponível para gastar</p>
        <p className="resumo-cartao__valor">{disponivel.toFixed(2)} €</p>
        <p className="login-form__lead">
          Até ao fim do mês · {limiteDiario.toFixed(2)} € / dia
        </p>
      </div>

      {insights.length > 0 && (
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Insights</p>
          <ul className="resumo-insights">
            {insights.map((texto, i) => (
              <li key={i}>{texto}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="resumo-cartao">
        <p className="resumo-cartao__label">Próximos movimentos</p>
        {proximasFixas.length === 0 ? (
          <p>Sem despesas fixas por vencer este mês.</p>
        ) : (
          <ul className="resumo-lista-categorias">
            {proximasFixas.map((d) => (
              <li key={d.id}>
                <span>Dia {d.dia_vencimento} — {d.descricao}</span>
                <span>-{Number(d.valor).toFixed(2)} €</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
