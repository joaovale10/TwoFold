# Registo de alterações

Ordem cronológica inversa (mais recente primeiro). Cada entrada resume o que foi feito e porquê — não é um diff, é para saber rapidamente o que mudou sem ter de reler código ou sessões antigas.

## 2026-08-30 — Sidebar: "TwoFold" em destaque, utilizador autenticado junto ao Sair

**Contexto:** último ponto da ronda de feedback do utilizador (mockup em `docs/image-6.png`).

- `AppLayout.jsx`: o topo da sidebar deixou de mostrar `household.nome` — mostra só "TwoFold", agora no tamanho que antes era do nome do household (era pequeno, em maiúsculas, por cima). O nome do household saiu do topo por completo (fica só visível como título das páginas que já o mostram, ex. Resumo).
- Novo bloco junto ao botão "Sair": ícone 👤 + o nome da pessoa autenticada nessa sessão (não o household inteiro) — vai buscar `household_members.nome` do próprio `user.id`, com fallback para o email se ainda não tiver nome definido.

## 2026-08-30 — Categorias autónomas por household + tema dos dropdowns + marca na sidebar

**Contexto:** feedback do utilizador depois de testar a ronda anterior. Também criado `supabase/aplicar-agora.sql` — passa a ser o sítio para pedaços de SQL incrementais por correr, em vez de repetir o `schema.sql` completo.

- **Categorias predefinidas deixam de ser partilhadas/admin-only**: reverte a decisão anterior (só o admin editava as globais). Agora `admin_criar_espaco` chama `clonar_categorias_predefinidas()`, que copia as categorias `household_id null` para dentro do household novo — cada espaço fica com a sua própria cópia, 100% autónoma, editável por qualquer membro (política `categories for update` simplificada de volta para `is_household_member(household_id)`). `CategoriesPage.jsx` volta a mostrar as predefinidas só como referência de leitura (agora redundante para espaços já com a sua cópia).
- **Dropdowns fora do tema**: faltava um estilo base para `select` — `.login-form select` não tinha regra nenhuma e `.transaction-form select` não definia fundo/cor, por isso caíam no estilo nativo do browser (mal em modo escuro). Adicionado um `select { ... }` global em `src/index.css`.
- **Marca "TwoFold" só aparecia no login/convite**, nunca dentro da app autenticada — a sidebar mostrava só o nome do household (dado, não branding). Adicionado "TwoFold" por cima do nome do espaço em `AppLayout.jsx` (`.sidebar__marca`).

## 2026-08-30 — Rebranding "TwoFold" + ajustes de UX (contas, categorias, formulários, convites)

**Contexto:** lote de pedidos do utilizador após testar o fluxo de convites, listados em `docs/roadmap.md` → "Pontos em aberto - 30/08/2026".

- **Rebranding**: nome do site mudado de "Finanças do Casal" para "TwoFold" (`index.html`, manifest PWA em `vite.config.js`, hero do login e da página de convite). O nome "Vale & Clara" que aparece na sidebar é o `households.nome` (dado do household, não a marca) — continua livre.
- **`TransactionForm.jsx`**: redesenhado para um layout em grelha com legendas (linha Valor/Descrição, linha Conta/Categoria (ou Conta destino, em transferências)/Data) e botão "Cancelar", em vez da linha única de inputs sem rótulo. Nova classe `.nova-transacao` em `src/index.css`, reaproveitada também em `FixedExpensesPage.jsx`.
- **`AccountsPage.jsx`/`AccountCard.jsx`**: formulário de criar conta e de editar conta passam a ter campos na vertical com `<label>`, em vez da linha horizontal sem legenda.
- **`CategoriesPage.jsx`**: campo "Nome" mais largo; texto "Categoria principal (sem categoria-mãe)" simplificado para "Categoria Principal"; categorias predefinidas (globais, `household_id null`) passam a ser editáveis — mas só pelo admin, com nova policy de `update` em `categories` (`household_id is null and is_admin()`), já que são partilhadas por todos os espaços.
- **`ConvitesPage.jsx`**: lista trocada por tabela; nova função `admin_estado_convites()` (junta `household_invites` com `auth.users`, inacessível diretamente por RLS) para o admin ver, por convite, se a pessoa já criou conta e/ou já confirmou o email, mesmo antes de resgatar.
- **Falha corrigida**: o ecrã "Sem acesso a nenhum espaço" (`App.jsx`) não tinha forma de sair — ficava-se preso lá se a conta autenticada fosse apagada ou não tivesse household. Adicionado botão "Sair".

## 2026-08-30 — SMTP próprio (Brevo) para os emails de confirmação do convite

**Contexto:** os emails de confirmação do fluxo de convite não estavam a chegar. Investigação e correção só de configuração (Supabase/Brevo), sem alterações de código.

- O envio inicial usava o domínio de sandbox do Resend (`resend.dev`), que só permite enviar para o próprio email da conta Resend — qualquer outro destinatário é bloqueado silenciosamente.
- Trocado para **Brevo** (300 emails/dia grátis), com "single sender verification" (só é preciso verificar um email, não um domínio).
- Duas causas do erro `535 "5.7.8 Authentication failed"` nos Auth Logs do Supabase, corrigidas nas SMTP Settings: (1) o campo `Username` tinha o email da conta Brevo em vez do login SMTP especial (`xxxxx@smtp-brevo.com`, visível em Brevo → SMTP & API → SMTP); (2) a restrição de IPs autorizados do Brevo estava ativa e bloqueava os pedidos vindos do servidor do Supabase (IP não fixo/desconhecido) — foi desativada.
- Confirmado a funcionar de ponta a ponta depois destas duas correções.

## 2026-08-30 — Convites: multi-household num só projeto Supabase

**Contexto:** o utilizador quer abrir a app a outros casais amigos (ou pessoas solteiras), mantendo custo zero e sem reescrever a arquitetura no futuro — decidido manter tudo num único projeto Supabase/deploy Vercel (multi-tenant), em vez de um deploy isolado por casal, já que o schema e a RLS já eram genéricos por `household_id`. Depois de uma primeira versão com um link genérico "2 usos", foi revista para convites **ligados a um email específico** (evita que um link reencaminhado deixe um estranho ocupar a vaga de outra pessoa) e para deixar de ser só o admin a convidar: qualquer membro pode convidar o/a parceiro(a) para o seu próprio espaço.

- **Falha de segurança corrigida**: as policies de insert em `households` (`auth.uid() is not null`) e `household_members` (`user_id = auth.uid()`) permitiam a qualquer utilizador autenticado criar households à vontade ou juntar-se a qualquer household cujo `id` descobrisse. Foram removidas; agora só funções `security definer` escrevem nessas tabelas.
- **Nova tabela `household_invites`** (`supabase/schema.sql`): código único, `household_id` obrigatório, `email` obrigatório (o convite só pode ser resgatado por esse email), uso único, expira ao fim de 14 dias.
- **`admin_criar_espaco(p_nome, p_email)`**: só o admin — cria um household novo + o 1º convite (serve tanto para um amigo solteiro como para o 1º membro de um casal).
- **`convidar_parceiro(p_email)`**: qualquer membro de um household — cria um 2º convite para o SEU espaço, limitado a 2 membros.
- **`resgatar_convite(p_codigo, p_nome)`**: valida o convite (`for update` evita resgates concorrentes), confirma que o email da conta criada é o do convite, associa o utilizador em `household_members`.
- **`estado_convite(p_codigo)`** e **`is_admin()`**: funções auxiliares (a primeira acessível a `anon`, para a página pública de registo mostrar o estado do convite antes do login).
- **`AuthContext.jsx`**: adicionado `signUp`.
- **Nova página `AceitarConvitePage.jsx`** (rota pública `/convite/:codigo`): mostra o email fixo do convite, cria a conta via `signUp`, chama `resgatar_convite`.
- **Nova página `ConvitesPage.jsx`** (rota `/convites`, só na sidebar para o email do admin): cria espaços novos por email.
- **`CouplePage.jsx`**: novo bloco "Convidar parceiro(a)", visível quando o household só tem 1 membro.
- **Confirmação de email mantida ativa** (revisão do dia): sem ela, o `signUp` aceitava qualquer email escrito no formulário sem confirmar que a pessoa o controla, o que anulava a garantia do convite estar ligado a um email específico. `AceitarConvitePage.jsx` passa agora `emailRedirectTo` para o próprio link do convite; a pessoa confirma no email, volta à mesma página já com sessão ativa, e só aí é que `resgatar_convite` é chamado (o `nome` introduzido antes do `signUp` é guardado em `localStorage` até esse momento, porque o clique no email é uma nova carga de página). Requer adicionar `<site>/convite/*` à lista de Redirect URLs nas Auth settings do Supabase.

## 2026-08-28 — Refactor de limpeza + correção de saldo em Transações

**Contexto:** revisão completa do código pedida pelo utilizador (remover duplicação, comentar o necessário, documentar a estrutura).

- **Novo `src/lib/saldo.js`** (`saldoDaConta(conta, transacoes)`): centraliza o cálculo de saldo de conta (saldo inicial + movimentos, com tratamento correto de transferências). Substituiu 4 cópias quase idênticas do mesmo código em `notifications.js`, `AccountsPage.jsx`, `GoalsPage.jsx` e `SummaryPage.jsx`.
- **Novo `src/lib/datas.js`** (`dentroDoMes(dataISO, referencia)`): substituiu 3 cópias em `notifications.js`, `CouplePage.jsx` e `SummaryPage.jsx`.
- **`TransactionList.jsx`**: `sinalEcor(tx, contaEmFoco)` deixou de ser chamada duas vezes por linha da tabela (calculada uma vez, desestruturada em `sinal`/`cor`).
- **`AppLayout.jsx`**: os links de navegação normais e os de Orçamentos usavam duas formas diferentes de marcar "ativo" (`NavLink isActive` vs. comparação manual de `location.pathname`) sem motivo — unificados para usar sempre `isActive` do `NavLink`.
- **Bug corrigido em `TransactionsPage.jsx`**: o "Saldo da conta" mostrado no topo da página estava a ignorar o `saldo_inicial` da conta e, quando havia filtro de datas ativo, também ignorava os movimentos fora do intervalo filtrado — mostrando um valor que não era o saldo real da conta, só a soma dos movimentos visíveis na tabela. Agora a página carrega separadamente o histórico completo de transações do household (`todasTransacoes`, sem filtro de data nem limite de 50) só para este cálculo, e usa `saldoDaConta` sobre a conta real (com o `saldo_inicial` verdadeiro). A tabela de transações (`transacoesDaConta`) continua a respeitar o filtro de datas/pesquisa normalmente — só o saldo deixou de depender desse filtro.
- **Novo `docs/guia-codigo.md`**: mapa de todos os ficheiros de `src/` e `scripts/`, o que cada um faz, e os padrões a manter (usar `saldoDaConta`/`dentroDoMes` partilhados, só contas ativas nos dropdowns, etc.).

Verificado com `npm run lint` (0 erros, 1 aviso pré-existente sem relação) e `npm run build` (sucesso) após cada alteração.

## 2026-08-27/28 — Ver `docs/log-sessao-2026-08-27.md`

Sessão anterior a esta (correção do sinal/saldo de transferências, limpeza de CSS, guia de partilha do projeto com um amigo). Guardado num ficheiro à parte por ter sido reconstruído a partir da memória do claude-mem, não escrito no momento.
