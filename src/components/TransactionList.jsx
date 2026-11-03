import MenuAcoes from './MenuAcoes'
import { nomeCompletoCategoria } from '../lib/categorias'

const formatoValor = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
const formatoMes = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' })
const formatoMesCurto = new Intl.DateTimeFormat('pt-PT', { month: 'short' })

function porMes(transacoes) {
  const grupos = []
  for (const tx of transacoes) {
    const chave = tx.data.slice(0, 7)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.chave === chave) ultimo.linhas.push(tx)
    else grupos.push({ chave, linhas: [tx] })
  }
  return grupos
}

function detalhe(tx, categorias) {
  if (tx.tipo === 'transferencia') {
    return `${tx.accounts?.nome ?? 'Conta privada'} → ${tx.conta_destino?.nome ?? 'Conta privada'}`
  }
  return [nomeCompletoCategoria(categorias, tx.categoria_id), tx.accounts?.nome, tx.etiqueta].filter(Boolean).join(' · ')
}

export default function TransactionList({ transactions, categorias = [], onEditar, onApagar }) {
  return porMes(transactions).map(({ chave, linhas }) => {
    const [ano, mes] = chave.split('-').map(Number)
    return (
      <section key={chave} className="transacoes-mes" aria-label={formatoMes.format(new Date(ano, mes - 1, 1))}>
        <h2 className="transacoes-mes__titulo">{formatoMes.format(new Date(ano, mes - 1, 1))}</h2>
        <ul className="despesas-lista__linhas">
          {linhas.map((tx) => {
            const dia = Number(tx.data.slice(8, 10))
            const sinal = tx.tipo === 'receita' ? '+' : tx.tipo === 'despesa' ? '−' : ''
            const titulo = tx.descricao || (tx.tipo === 'transferencia' ? 'Transferência' : tx.categories?.nome) || '—'
            return (
              <li key={tx.id} className="despesa-linha">
                <span className="despesa-linha__data">
                  <strong>{dia}</strong>
                  {formatoMesCurto.format(new Date(ano, mes - 1, dia)).replace('.', '')}
                </span>
                <i
                  className="despesa-linha__cor"
                  style={{ background: tx.tipo === 'transferencia' ? 'var(--muted)' : tx.categories?.cor ?? 'var(--border)' }}
                  aria-hidden="true"
                />
                <span className="despesa-linha__texto">
                  <span className="despesa-linha__descricao">{titulo}</span>
                  <span className="despesa-linha__detalhe">{detalhe(tx, categorias)}</span>
                </span>
                <span className={`despesa-linha__valor despesa-linha__valor--${tx.tipo}`}>
                  {sinal}
                  {formatoValor.format(tx.valor)}
                </span>
                <MenuAcoes
                  rotulo={`Ações de ${titulo}`}
                  acoes={[
                    { rotulo: 'Editar', onClick: () => onEditar(tx) },
                    { rotulo: 'Apagar', perigo: true, onClick: () => onApagar(tx) },
                  ]}
                />
              </li>
            )
          })}
        </ul>
      </section>
    )
  })
}
