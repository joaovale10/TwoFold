import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { dentroDoMes } from '../lib/datas.js'
import CategoryPieChart from '../components/CategoryPieChart.jsx'

function ConvidarParceiro({ onConvidado }) {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState(null)
  const [link, setLink] = useState(null)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setLink(null)

    const { data: codigo, error } = await supabase.rpc('convidar_parceiro', { p_email: email })

    if (error) {
      setErro(error.message)
      return
    }

    setLink(`${window.location.origin}/convite/${codigo}`)
    setEmail('')
    onConvidado?.()
  }

  return (
    <div className="resumo-cartao">
      <p className="resumo-cartao__label">Convidar parceiro(a)</p>
      <form onSubmit={submeter} className="login-form">
        <label>
          Email do/a parceiro(a)
          <input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="botao-primario">
          Convidar
        </button>
      </form>
      {erro && <p className="erro">{erro}</p>}
      {link && (
        <p className="login-form__lead">
          Link: <code>{link}</code>
        </p>
      )}
    </div>
  )
}

export default function CouplePage() {
  const { household, contas, categorias } = useOutletContext()
  const [transacoesCasal, setTransacoesCasal] = useState([])
  const [membros, setMembros] = useState([])

  const contasCasalIds = contas.filter((c) => c.tipo === 'casal').map((c) => c.id)

  async function carregarMembros() {
    const { data } = await supabase
      .from('household_members')
      .select('user_id, nome')
      .eq('household_id', household.id)
    setMembros(data ?? [])
  }

  useEffect(() => {
    carregarMembros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id])

  useEffect(() => {
    if (contasCasalIds.length === 0) return
    supabase
      .from('transactions')
      .select('user_id, tipo, valor, categoria_id, data')
      .eq('household_id', household.id)
      .in('account_id', contasCasalIds)
      .in('tipo', ['receita', 'despesa'])
      .then(({ data }) => setTransacoesCasal(data ?? []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id, contas])

  const hoje = new Date()
  const doMes = transacoesCasal.filter((tx) => dentroDoMes(tx.data, hoje))
  const receitas = doMes.filter((tx) => tx.tipo === 'receita').reduce((t, tx) => t + Number(tx.valor), 0)
  const despesas = doMes.filter((tx) => tx.tipo === 'despesa').reduce((t, tx) => t + Number(tx.valor), 0)
  const poupanca = receitas - despesas

  const nomePorUserId = Object.fromEntries(membros.map((m) => [m.user_id, m.nome]))
  const contribuicoes = {}
  doMes
    .filter((tx) => tx.tipo === 'receita')
    .forEach((tx) => {
      contribuicoes[tx.user_id] = (contribuicoes[tx.user_id] ?? 0) + Number(tx.valor)
    })
  const linhasContribuicoes = Object.entries(contribuicoes)
    .map(([userId, valor]) => ({
      nome: nomePorUserId[userId] || 'Sem nome definido',
      valor,
      percentagem: receitas > 0 ? (valor / receitas) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)

  const categoriaPorId = Object.fromEntries(categorias.map((c) => [c.id, c]))
  const despesasPorCategoria = {}
  doMes
    .filter((tx) => tx.tipo === 'despesa')
    .forEach((tx) => {
      despesasPorCategoria[tx.categoria_id] = (despesasPorCategoria[tx.categoria_id] ?? 0) + Number(tx.valor)
    })
  const linhasCategorias = Object.entries(despesasPorCategoria)
    .map(([categoriaId, valor]) => ({ categoria: categoriaPorId[categoriaId], valor }))
    .sort((a, b) => b.valor - a.valor)
  const dadosGrafico = linhasCategorias.map(({ categoria, valor }) => ({
    nome: categoria?.nome ?? 'Sem categoria',
    valor,
    cor: categoria?.cor ?? '#999',
  }))

  const taxaPoupancaMes = receitas > 0 ? (poupanca / receitas) * 100 : 0

  const mesesAnteriores = Array.from({ length: 6 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth() - i, 1))
  const taxasPorMes = mesesAnteriores.map((mes) => {
    const doMesRef = transacoesCasal.filter((tx) => dentroDoMes(tx.data, mes))
    const r = doMesRef.filter((tx) => tx.tipo === 'receita').reduce((t, tx) => t + Number(tx.valor), 0)
    const d = doMesRef.filter((tx) => tx.tipo === 'despesa').reduce((t, tx) => t + Number(tx.valor), 0)
    return r > 0 ? ((r - d) / r) * 100 : 0
  })
  const mediaTaxa6Meses = taxasPorMes.reduce((t, v) => t + v, 0) / taxasPorMes.length
  const diferencaMedia = taxaPoupancaMes - mediaTaxa6Meses

  const nomeMes = hoje.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })

  if (contasCasalIds.length === 0) {
    return (
      <div>
        <h1>Casal</h1>
        <p>Ainda não existe nenhuma conta casal. Cria uma em "Contas".</p>
        {membros.length < 2 && <ConvidarParceiro onConvidado={carregarMembros} />}
      </div>
    )
  }

  return (
    <div>
      <h1>Casal</h1>
      <p className="login-form__lead" style={{ textTransform: 'capitalize' }}>
        {nomeMes} · finanças conjuntas
      </p>

      {membros.length < 2 && <ConvidarParceiro onConvidado={carregarMembros} />}

      <div className="resumo-grelha">
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Receitas</p>
          <p className="resumo-cartao__valor">{receitas.toFixed(2)} €</p>
        </div>
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Despesas</p>
          <p className="resumo-cartao__valor">{despesas.toFixed(2)} €</p>
        </div>
        <div className="resumo-cartao resumo-cartao--destaque">
          <p className="resumo-cartao__label">Poupança / Disponível</p>
          <p className="resumo-cartao__valor">{poupanca.toFixed(2)} €</p>
        </div>
      </div>

      <div className="resumo-duas-colunas">
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Contribuições</p>
          {linhasContribuicoes.length === 0 ? (
            <p>Sem receitas conjuntas este mês.</p>
          ) : (
            <ul className="resumo-lista-categorias">
              {linhasContribuicoes.map((c) => (
                <li key={c.nome}>
                  <span>{c.nome}</span>
                  <span>
                    {c.valor.toFixed(2)} € · {c.percentagem.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Despesas conjuntas por categoria</p>
          {linhasCategorias.length === 0 ? (
            <p>Sem despesas conjuntas este mês.</p>
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
      </div>

      <div className="resumo-cartao">
        <p className="resumo-cartao__label">Taxa de poupança</p>
        <p className="resumo-cartao__valor">{taxaPoupancaMes.toFixed(1)}%</p>
        <p className="login-form__lead">
          Média 6 meses: {mediaTaxa6Meses.toFixed(1)}% · {diferencaMedia >= 0 ? '↑' : '↓'}{' '}
          {Math.abs(diferencaMedia).toFixed(1)} p.p.
        </p>
      </div>
    </div>
  )
}
