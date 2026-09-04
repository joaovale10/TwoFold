const SECCOES = [
  {
    icone: '🏠',
    titulo: 'Resumo',
    topicos: [
      'A tua página inicial: património, saldo pessoal vs. casal.',
      'Receitas, despesas e poupança do mês, com despesas por categoria.',
      'Orçamento mensal e "disponível para gastar".',
      'Filtro no topo (Tudo/A minha conta/Casal) para ver só o que interessa.',
    ],
  },
  {
    icone: '💳',
    titulo: 'Transações',
    topicos: [
      'Regista despesas, receitas e transferências entre contas.',
      'Escolhe a conta no topo do formulário; valor, categoria, data e descrição ficam na mesma linha.',
      'Edita ou apaga qualquer transação diretamente na lista.',
      'Filtra por datas ou pesquisa por texto.',
    ],
  },
  {
    icone: '❤️',
    titulo: 'Casal',
    topicos: [
      'Resumo do mês só das contas casal.',
      'Quanto cada pessoa contribuiu e as despesas conjuntas por categoria.',
      'Taxa de poupança do casal.',
      'Se o espaço só tiver 1 pessoa, aparece aqui o botão para convidar o/a parceiro(a).',
    ],
  },
  {
    icone: '📩',
    titulo: 'Convidar o/a parceiro(a)',
    topicos: [
      'Enquanto o espaço só tiver 1 pessoa, a página Casal mostra o cartão "Convidar parceiro(a)".',
      'Mete o email dele/dela e recebes um link (algo como .../convite/xxxxx).',
      'Copia e envia o link tu mesmo (WhatsApp, email, etc.) — a app não o envia.',
      'A outra pessoa abre o link, cria a password e confirma o email.',
      'Fica automaticamente como o 2º membro do espaço, com acesso às contas casal e às suas próprias contas pessoais.',
      'O convite expira ao fim de 14 dias; cada espaço só pode ter 2 membros.',
    ],
  },
  {
    icone: '🏦',
    titulo: 'Contas',
    topicos: [
      'Cria contas pessoais (só tu vês) e contas casal (partilhadas).',
      'Cada conta tem um ícone só decorativo, que escolhes clicando nele.',
      'Define o saldo inicial e edita ou desativa a conta a qualquer momento.',
      'Só contas ativas aparecem nos formulários de escolher conta.',
    ],
  },
  {
    icone: '📈',
    titulo: 'Stats',
    topicos: [
      'Vista mais analítica que o Resumo: alterna entre Mês atual, Ano atual ou Total.',
      'Gráfico de barras com a evolução das despesas mês a mês (o mês atual fica destacado).',
      'Lista de categorias/subcategorias ordenada por peso, com nº de movimentos e % do total.',
    ],
  },
  {
    icone: '🏷️',
    titulo: 'Categorias',
    topicos: [
      'Já vêm algumas categorias criadas como ponto de partida.',
      'Edita, apaga ou cria as tuas à vontade, incluindo subcategorias.',
      'Em "Regras automáticas", define um padrão de texto (ex. "Continente") que sugere sempre a mesma categoria quando aparece na descrição de uma transação.',
    ],
  },
  {
    icone: '🔁',
    titulo: 'Despesas Fixas',
    topicos: [
      'Para despesas que se repetem todos os meses (renda, seguros, subscrições).',
      'Defines o dia de vencimento.',
      'A app cria automaticamente a transação real desse mês sempre que abres a app — não precisas de lançar à mão.',
    ],
  },
  {
    icone: '📊',
    titulo: 'Orçamentos',
    topicos: [
      'Define um limite mensal ou anual por categoria.',
      'Acompanha na página o progresso face ao que já gastaste.',
      'Quando ultrapassas ou te aproximas do limite, aparece uma notificação no sino da sidebar.',
    ],
  },
  {
    icone: '🎯',
    titulo: 'Objetivos',
    topicos: [
      'Cada objetivo de poupança liga-se a uma conta real.',
      'O valor "já poupado" é sempre o saldo dessa conta.',
      'A previsão de quando vais lá chegar usa o ritmo real dos últimos 6 meses, não só o valor que definiste.',
    ],
  },
  {
    icone: '👤',
    titulo: 'A minha conta',
    topicos: [
      'Clica no teu nome, no fundo da sidebar, para abrir esta página.',
      'Define o teu nome de exibição, um username opcional (para entrares com ele em vez do email) e o nome do teu espaço.',
      'Se instalaste a app no telemóvel e não vês as novidades mais recentes, usa o botão "Forçar atualização".',
      'Se te esqueceres da password, usa o link "Esqueceste-te da password?" na página de login — recebes um email para definires uma nova.',
    ],
  },
]

export default function AjudaPage() {
  return (
    <div>
      <h1 className="titulo-centrado">Como funciona a TwoFold</h1>
      <p className="login-form__lead">Toca numa secção para abrir. Um resumo rápido — não precisas de mais nada para começar.</p>

      <div className="ajuda-lista">
        {SECCOES.map((s) => (
          <details key={s.titulo} className="ajuda-item">
            <summary className="ajuda-item__cabecalho">
              <span className="ajuda-item__icone" aria-hidden="true">
                {s.icone}
              </span>
              <span className="ajuda-item__titulo">{s.titulo}</span>
            </summary>
            <ul className="ajuda-item__lista">
              {s.topicos.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  )
}
