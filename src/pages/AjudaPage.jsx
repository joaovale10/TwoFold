const SECCOES = [
  {
    icone: '🏠',
    titulo: 'Resumo',
    texto:
      'A tua página inicial: património, saldo pessoal vs. casal, receitas/despesas/poupança do mês, despesas por categoria, orçamento e "disponível para gastar". Usa o filtro no topo (Tudo/A minha conta/Casal) para ver só o que interessa.',
  },
  {
    icone: '💳',
    titulo: 'Transações',
    texto:
      'Regista despesas, receitas e transferências entre contas. Escolhe a conta no topo do formulário, o resto (valor, categoria, data, descrição) fica nessa mesma linha. Podes editar ou apagar qualquer transação diretamente na lista, e filtrar por datas ou pesquisar por texto.',
  },
  {
    icone: '❤️',
    titulo: 'Casal',
    texto:
      'Resumo do mês só das contas casal — quanto cada pessoa contribuiu, despesas conjuntas por categoria, taxa de poupança. Se o teu espaço ainda só tiver 1 pessoa, aparece aqui um botão para convidares o/a parceiro(a) por email.',
  },
  {
    icone: '📩',
    titulo: 'Convidar o/a parceiro(a)',
    texto:
      'Enquanto o teu espaço só tiver 1 pessoa, a página Casal mostra o cartão "Convidar parceiro(a)". Mete o email dele/dela e recebes um link (algo como .../convite/xxxxx) — copia e envia por WhatsApp, email, etc., a app não o envia por ti. A outra pessoa abre o link, cria a password e confirma o email; a partir daí fica automaticamente como o 2º membro do mesmo espaço, com acesso às contas casal e às suas próprias contas pessoais. O convite expira ao fim de 14 dias e cada espaço só pode ter 2 membros.',
  },
  {
    icone: '🏦',
    titulo: 'Contas',
    texto:
      'Cria as tuas contas pessoais (só tu vês) e contas casal (partilhadas). Cada conta tem um ícone (só decorativo, escolhes clicando nele), saldo inicial e podes editar ou desativar a qualquer momento — só contas ativas aparecem nos formulários de escolher conta.',
  },
  {
    icone: '🏷️',
    titulo: 'Categorias',
    texto:
      'Já vêm algumas categorias criadas como ponto de partida — edita, apaga ou cria as tuas à vontade, incluindo subcategorias. Nas "Regras automáticas", defines um padrão de texto (ex. "Continente") que sugere sempre a mesma categoria quando aparece na descrição de uma transação.',
  },
  {
    icone: '🔁',
    titulo: 'Despesas Fixas',
    texto:
      'Para despesas que se repetem todos os meses (renda, seguros, subscrições). Defines o dia de vencimento e a app cria automaticamente a transação real desse mês sempre que abres a app — não precisas de lançar isto à mão.',
  },
  {
    icone: '📊',
    titulo: 'Orçamentos',
    texto:
      'Define um limite mensal ou anual por categoria, e acompanha na página o progresso face ao que já gastaste. Quando ultrapassas ou te aproximas do limite, aparece uma notificação no sino da sidebar.',
  },
  {
    icone: '🎯',
    titulo: 'Objetivos',
    texto:
      'Cada objetivo de poupança liga-se a uma conta real — o valor "já poupado" é sempre o saldo dessa conta. A app usa o ritmo real dos últimos 6 meses para prever quando vais lá chegar, não só o valor que definiste.',
  },
  {
    icone: '👤',
    titulo: 'A minha conta',
    texto:
      'Clica no teu nome, no fundo da sidebar, para definires o teu nome de exibição, um username opcional (para entrares com ele em vez do email) e o nome do teu espaço — útil se hoje és só tu e mais tarde passares a partilhar com alguém. Se instalaste a app no telemóvel e não vês as novidades mais recentes, usa aqui o botão "Forçar atualização".',
  },
]

export default function AjudaPage() {
  return (
    <div>
      <h1>Como funciona a TwoFold</h1>
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
            <p className="ajuda-item__texto">{s.texto}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
