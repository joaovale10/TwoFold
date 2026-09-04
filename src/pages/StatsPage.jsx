import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'
import { dentroDoAno, dentroDoMes } from '../lib/datas.js'
import MonthlyBarChart from '../components/MonthlyBarChart.jsx'

export default function StatsPage() {
  const { household, contas, categorias } = useOutletContext()
  const { user } = useAuth()
  const [transacoes, setTransacoes] = useState([])
  const [ambito, setAmbito] = useState('tudo') // 'tudo' | 'pessoal' | 'casal'
  const [periodo, setPeriodo] = useState('mes-atual') // 'mes-atual' | 'ano-atual' | 'total'
  const [modoLista, setModoLista] = useState('categoria') // 'categoria' | 'subcategoria'

  useEffect(() => {
    supabase
      .from('transactions')
      .select('account_id, tipo, valor, categoria_id, data')
      .eq('household_id', household.id)
      .is('apagada_em', null)
      .then(({ data }) => setTransacoes(data ?? []))
  }, [household.id])

  const contasPessoais = contas.filter((c) => c.owner_user_id === user.id)
  const contasCasal = contas.filter((c) => c.tipo === 'casal')
  const contasNoAmbito =
    ambito === 'pessoal' ? contasPessoais : ambito === 'casal' ? contasCasal : contas
  const idsContasNoAmbito = new Set(contasNoAmbito.map((c) => c.id))

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()

  const transacoesNoAmbito = transacoes.filter(
    (tx) => idsContasNoAmbito.has(tx.account_id) && tx.tipo !== 'transferencia'
  )

  function emPeriodo(dataISO) {
    if (periodo === 'mes-atual') return dentroDoMes(dataISO, hoje)
    if (periodo === 'ano-atual') return dentroDoAno(dataISO, hoje)
    return true
  }

  const transacoesNoPeriodo = transacoesNoAmbito.filter((tx) => emPeriodo(tx.data))
  const despesasTotais = transacoesNoPeriodo
    .filter((tx) => tx.tipo === 'despesa')
    .reduce((t, tx) => t + Number(tx.valor), 0)
  const entradas = transacoesNoPeriodo
    .filter((tx) => tx.tipo === 'receita')
    .reduce((t, tx) => t + Number(tx.valor), 0)

  const despesasPorMes = Array(12).fill(0)
  transacoesNoAmbito
    .filter((tx) => tx.tipo === 'despesa' && dentroDoAno(tx.data, hoje))
    .forEach((tx) => {
      despesasPorMes[new Date(tx.data).getMonth()] += Number(tx.valor)
    })

  const categoriaPorId = Object.fromEntries(categorias.map((c) => [c.id, c]))
  function categoriaAgrupadora(categoriaId) {
    const cat = categoriaPorId[categoriaId]
    if (!cat) return null
    if (modoLista === 'subcategoria' || !cat.parent_id) return cat
    return categoriaPorId[cat.parent_id] ?? cat
  }

  const grupos = {}
  transacoesNoPeriodo
    .filter((tx) => tx.tipo === 'despesa')
    .forEach((tx) => {
      const cat = categoriaAgrupadora(tx.categoria_id)
      const chave = cat?.id ?? 'sem-categoria'
      if (!grupos[chave]) grupos[chave] = { nome: cat?.nome ?? 'Sem categoria', valor: 0, movimentos: 0 }
      grupos[chave].valor += Number(tx.valor)
      grupos[chave].movimentos += 1
    })
  const linhasLista = Object.values(grupos).sort((a, b) => b.valor - a.valor)

  const rotuloPeriodo =
    periodo === 'mes-atual'
      ? hoje.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
      : periodo === 'ano-atual'
        ? `${anoAtual}`
        : 'Todo o histórico'

  return (
    <div>
      <h1 className="titulo-centrado">Stats</h1>

      <div className="resumo-cabecalho">
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
        <div className="tipo-toggle">
          <button
            type="button"
            className={periodo === 'mes-atual' ? 'ativo' : ''}
            onClick={() => setPeriodo('mes-atual')}
          >
            Mês atual
          </button>
          <button
            type="button"
            className={periodo === 'ano-atual' ? 'ativo' : ''}
            onClick={() => setPeriodo('ano-atual')}
          >
            Ano Atual
          </button>
          <button type="button" className={periodo === 'total' ? 'ativo' : ''} onClick={() => setPeriodo('total')}>
            Total
          </button>
        </div>
      </div>

      <p className="login-form__lead rotulo-periodo" style={{ textTransform: 'capitalize', textAlign: 'center' }}>
        {rotuloPeriodo}
      </p>

      <div className="resumo-cartao">
        <p className="resumo-cartao__label">Despesas totais</p>
        <p className="resumo-cartao__valor stats-valor-total">{despesasTotais.toFixed(2)} €</p>
        <MonthlyBarChart dados={despesasPorMes} mesDestacado={periodo === 'mes-atual' ? hoje.getMonth() : -1} />
      </div>

      <div className="resumo-grelha">
        <div className="resumo-cartao">
          <p className="resumo-cartao__label">Entradas</p>
          <p className="resumo-cartao__valor">{entradas.toFixed(2)} €</p>
        </div>
      </div>

      <div className="tipo-toggle">
        <button
          type="button"
          className={modoLista === 'categoria' ? 'ativo' : ''}
          onClick={() => setModoLista('categoria')}
        >
          Categoria
        </button>
        <button
          type="button"
          className={modoLista === 'subcategoria' ? 'ativo' : ''}
          onClick={() => setModoLista('subcategoria')}
        >
          Sub-categoria
        </button>
      </div>

      <div className="resumo-cartao">
        {linhasLista.length === 0 ? (
          <p>Sem despesas neste período.</p>
        ) : (
          <ul className="stats-lista">
            {linhasLista.map((linha) => (
              <li key={linha.nome}>
                <span>
                  <strong>{linha.nome}</strong>
                  <br />
                  <span className="login-form__lead">{linha.movimentos} movimentos</span>
                </span>
                <span className="stats-lista__valores">
                  <strong>{linha.valor.toFixed(2)} €</strong>
                  <br />
                  <span className="login-form__lead">
                    {despesasTotais > 0 ? ((linha.valor / despesasTotais) * 100).toFixed(1) : '0.0'}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
