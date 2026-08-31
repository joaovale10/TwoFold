const SECCOES = [
  {
    titulo: 'Resumo',
    texto:
      'A tua página inicial: património, saldo pessoal vs. casal, receitas/despesas/poupança do mês, despesas por categoria, orçamento e "disponível para gastar". Usa o filtro no topo (Tudo/A minha conta/Casal) para ver só o que interessa.',
  },
  {
    titulo: 'Transações',
    texto:
      'Regista despesas, receitas e transferências entre contas. Escolhe a conta no topo do formulário, o resto (valor, categoria, data, descrição) fica nessa mesma linha. Podes editar ou apagar qualquer transação diretamente na lista, e filtrar por datas ou pesquisar por texto.',
  },
  {
    titulo: 'Casal',
    texto:
      'Resumo do mês só das contas casal — quanto cada pessoa contribuiu, despesas conjuntas por categoria, taxa de poupança. Se o teu espaço ainda só tiver 1 pessoa, aparece aqui um botão para convidares o/a parceiro(a) por email.',
  },
  {
    titulo: 'Contas',
    texto:
      'Cria as tuas contas pessoais (só tu vês) e contas casal (partilhadas). Cada conta tem um ícone (só decorativo, escolhes clicando nele), saldo inicial e podes editar ou desativar a qualquer momento — só contas ativas aparecem nos formulários de escolher conta.',
  },
  {
    titulo: 'Categorias',
    texto:
      'Já vêm algumas categorias criadas como ponto de partida — edita, apaga ou cria as tuas à vontade, incluindo subcategorias. Nas "Regras automáticas", defines um padrão de texto (ex. "Continente") que sugere sempre a mesma categoria quando aparece na descrição de uma transação.',
  },
  {
    titulo: 'Despesas Fixas',
    texto:
      'Para despesas que se repetem todos os meses (renda, seguros, subscrições). Defines o dia de vencimento e a app cria automaticamente a transação real desse mês sempre que abres a app — não precisas de lançar isto à mão.',
  },
  {
    titulo: 'Orçamentos',
    texto:
      'Define um limite mensal ou anual por categoria, e acompanha na página o progresso face ao que já gastaste. Quando ultrapassas ou te aproximas do limite, aparece uma notificação no sino da sidebar.',
  },
  {
    titulo: 'Objetivos',
    texto:
      'Cada objetivo de poupança liga-se a uma conta real — o valor "já poupado" é sempre o saldo dessa conta. A app usa o ritmo real dos últimos 6 meses para prever quando vais lá chegar, não só o valor que definiste.',
  },
  {
    titulo: 'A minha conta',
    texto:
      'Clica no teu nome, no fundo da sidebar, para definires o teu nome de exibição e, opcionalmente, um username — depois podes entrar com ele em vez do email.',
  },
]

export default function AjudaPage() {
  return (
    <div>
      <h1>Como funciona a TwoFold</h1>
      <p className="login-form__lead">Um resumo rápido de cada secção — não precisas de mais nada para começar.</p>

      {SECCOES.map((s) => (
        <div key={s.titulo} className="resumo-cartao" style={{ marginBottom: '1rem' }}>
          <p className="resumo-cartao__label">{s.titulo}</p>
          <p>{s.texto}</p>
        </div>
      ))}
    </div>
  )
}
