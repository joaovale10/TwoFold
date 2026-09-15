import {
  somaLiquidos,
  valorTransferir,
  totalItems,
  totalIndividualDoMembro,
  totalPoupancaDoMembro,
  sobraDoMembro,
} from '../lib/orcamentoPlano'

export default function ResumoPlano({ membros, incomes, items }) {
  const soma = somaLiquidos(incomes)
  const totalComum = totalItems(items.filter((i) => i.secao === 'comum'))
  const totalPoupancaHousehold = membros.reduce(
    (s, m) => s + totalPoupancaDoMembro(items, m.user_id),
    0
  )

  return (
    <div className="plano-orcamento__secao">
      <h3>Resumo Final</h3>
      <div className="transaction-list__wrap">
        <table className="transaction-list">
          <thead>
            <tr>
              <th></th>
              {membros.map((m) => (
                <th key={m.user_id}>{m.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {membros.length > 0 && (
              <>
                <tr>
                  <td>Líquido</td>
                  {membros.map((m) => {
                    const income = incomes.find((i) => i.user_id === m.user_id)
                    return <td key={m.user_id}>{Number(income?.liquido ?? 0).toFixed(2)} €</td>
                  })}
                </tr>
                <tr>
                  <td>Conta Comum</td>
                  {membros.map((m) => {
                    const income = incomes.find((i) => i.user_id === m.user_id)
                    if (!income) return <td key={m.user_id}>—</td>
                    const transferir = valorTransferir(income, totalComum, soma)
                    const percent = income.liquido ? (transferir / income.liquido) * 100 : 0
                    return (
                      <td key={m.user_id}>
                        -{transferir.toFixed(2)} € ({percent.toFixed(1)}%)
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td>Individual (inclui poupança)</td>
                  {membros.map((m) => {
                    const income = incomes.find((i) => i.user_id === m.user_id)
                    const individual = totalIndividualDoMembro(items, m.user_id)
                    const percent = income?.liquido ? (individual / income.liquido) * 100 : 0
                    return (
                      <td key={m.user_id}>
                        -{individual.toFixed(2)} € ({percent.toFixed(1)}%)
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td>
                    <strong>Sobra livre/mês</strong>
                  </td>
                  {membros.map((m) => {
                    const income = incomes.find((i) => i.user_id === m.user_id)
                    if (!income) return <td key={m.user_id}>—</td>
                    const transferir = valorTransferir(income, totalComum, soma)
                    const individual = totalIndividualDoMembro(items, m.user_id)
                    const sobra = sobraDoMembro({ liquido: Number(income.liquido), transferir, individual })
                    return (
                      <td key={m.user_id}>
                        <strong>{sobra.toFixed(2)} €</strong>
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td>
                    <strong>% do rendimento livre</strong>
                  </td>
                  {membros.map((m) => {
                    const income = incomes.find((i) => i.user_id === m.user_id)
                    if (!income || !income.liquido) return <td key={m.user_id}>—</td>
                    const transferir = valorTransferir(income, totalComum, soma)
                    const individual = totalIndividualDoMembro(items, m.user_id)
                    const sobra = sobraDoMembro({ liquido: Number(income.liquido), transferir, individual })
                    return <td key={m.user_id}>{((sobra / Number(income.liquido)) * 100).toFixed(1)}%</td>
                  })}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <h3>Poupança Mensal</h3>
      <div className="transaction-list__wrap">
        <table className="transaction-list">
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>Valor</th>
              <th>% do rendimento</th>
            </tr>
          </thead>
          <tbody>
            {membros.map((m) => {
              const income = incomes.find((i) => i.user_id === m.user_id)
              const poupanca = totalPoupancaDoMembro(items, m.user_id)
              const percent = income?.liquido ? (poupanca / income.liquido) * 100 : 0
              return (
                <tr key={m.user_id}>
                  <td>{m.nome}</td>
                  <td>{poupanca.toFixed(2)} €</td>
                  <td>{percent.toFixed(1)}%</td>
                </tr>
              )
            })}
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td>
                <strong>{totalPoupancaHousehold.toFixed(2)} €</strong>
              </td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
