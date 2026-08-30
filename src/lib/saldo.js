// Saldo de uma conta = saldo inicial + soma dos movimentos que lhe pertencem.
// Transferências só contam para a conta de origem (saída) ou de destino (entrada) da
// própria transferência — nunca somam como receita/despesa.
export function saldoDaConta(conta, transacoes) {
  return transacoes.reduce((saldo, tx) => {
    if (tx.tipo === 'transferencia') {
      if (tx.account_id === conta.id) return saldo - Number(tx.valor)
      if (tx.conta_destino_id === conta.id) return saldo + Number(tx.valor)
      return saldo
    }
    if (tx.account_id !== conta.id) return saldo
    return saldo + (tx.tipo === 'receita' ? Number(tx.valor) : -Number(tx.valor))
  }, Number(conta.saldo_inicial))
}
