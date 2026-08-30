-- Esquema da app "Finanças do Casal"
-- Corre este ficheiro no SQL Editor do Supabase (projeto novo, ligado ao Postgres do projeto).
-- Multi-tenant: N households independentes no mesmo projeto. Sem registo livre —
-- só se entra por convite (household_invites/resgatar_convite, ver mais abaixo) ou,
-- para o household inicial (Vale e Clara), por seeding manual no fim do ficheiro.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Households (espaço partilhado do casal) e respetivos membros
-- ---------------------------------------------------------------------------
create table households (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text, -- nome próprio a mostrar na UI (ex: "Vale", "Clara")
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Função auxiliar (security definer) para evitar recursão nas policies de RLS.
create or replace function is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Accounts: contas casal (partilhadas) e contas pessoais (privadas do dono).
-- Cada um pode criar quantas contas pessoais quiser; as contas casal são
-- sempre visíveis e editáveis por ambos os membros do household.
-- ---------------------------------------------------------------------------
create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  owner_user_id uuid references auth.users (id) on delete cascade, -- null = conta do casal
  tipo text not null check (tipo in ('pessoal', 'casal')),
  nome text not null,
  saldo_inicial numeric(12, 2) not null default 0,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  constraint accounts_pessoal_tem_owner check (
    (tipo = 'pessoal' and owner_user_id is not null) or
    (tipo = 'casal' and owner_user_id is null)
  )
);

-- Função auxiliar: o utilizador atual pode aceder a esta conta?
-- (é a conta casal do household, ou é uma conta pessoal dele/dela)
create or replace function can_access_account(target_account_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from accounts
    where id = target_account_id
      and is_household_member(household_id)
      and (owner_user_id is null or owner_user_id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Categories: predefinidas (household_id null, globais) + personalizadas por household
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households (id) on delete cascade, -- null = categoria global
  parent_id uuid references categories (id), -- não nulo = subcategoria
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  cor text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Regras de categorização automática: se a descrição da transação contiver
-- `padrao` (case-insensitive), sugere-se `categoria_id` no formulário.
-- ---------------------------------------------------------------------------
create table category_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  padrao text not null,
  categoria_id uuid not null references categories (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Transactions: a privacidade segue a da conta (account_id) — uma transação
-- de uma conta pessoal só é visível a quem é dono dessa conta.
-- ---------------------------------------------------------------------------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  conta_destino_id uuid references accounts (id), -- só preenchido quando tipo = 'transferencia'
  user_id uuid not null references auth.users (id) on delete cascade, -- quem registou
  tipo text not null check (tipo in ('receita', 'despesa', 'transferencia')),
  valor numeric(12, 2) not null check (valor > 0),
  categoria_id uuid references categories (id),
  data date not null default current_date,
  descricao text,
  created_at timestamptz not null default now(),
  constraint transactions_transferencia_valida check (
    (tipo = 'transferencia' and conta_destino_id is not null and conta_destino_id <> account_id and categoria_id is null) or
    (tipo in ('receita', 'despesa') and conta_destino_id is null)
  )
);

create index transactions_household_data_idx on transactions (household_id, data desc);
create index transactions_account_idx on transactions (account_id);
create index transactions_conta_destino_idx on transactions (conta_destino_id);

-- ---------------------------------------------------------------------------
-- Budgets: mensais/anuais, por categoria. Partilhados por todo o household.
-- ---------------------------------------------------------------------------
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  tipo text not null default 'mensal' check (tipo in ('mensal', 'anual')),
  categoria_id uuid not null references categories (id),
  limite_mensal numeric(12, 2) not null check (limite_mensal > 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Objetivos de poupança: ligados a uma conta real (normalmente dedicada à
-- poupança) — o valor já poupado é o saldo dessa conta. Partilhados por
-- todo o household.
-- ---------------------------------------------------------------------------
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  account_id uuid not null references accounts (id),
  nome text not null,
  valor_objetivo numeric(12, 2) not null check (valor_objetivo > 0),
  data_limite date,
  contribuicao_mensal numeric(12, 2),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Despesas fixas: despesas recorrentes mensais (renda, seguros, streaming...)
-- Partilhadas por todo o household. Ao abrir a app, gera-se automaticamente
-- uma transação real por cada mês em falta até hoje (ver src/lib/recorrentes.js);
-- `ultima_geracao` guarda o mês do último vencimento já lançado, para não duplicar.
-- ---------------------------------------------------------------------------
create table fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  account_id uuid not null references accounts (id),
  categoria_id uuid references categories (id),
  descricao text not null,
  valor numeric(12, 2) not null check (valor > 0),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 31),
  data_inicio date not null default current_date,
  ultima_geracao date,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Convites: cada convite está ligado a UM email específico e só pode ser
-- resgatado por essa conta — não é um link livremente reenviável. O admin usa
-- `admin_criar_espaco` para criar um espaço novo (serve tanto para um amigo
-- solteiro como para o 1º membro de um casal); qualquer membro de um household
-- pode depois usar `convidar_parceiro` para convidar um 2º email para o MESMO
-- espaço (limitado a 2 membros).
-- ---------------------------------------------------------------------------
create table household_invites (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default encode(gen_random_bytes(9), 'hex'),
  household_id uuid not null references households (id) on delete cascade,
  email text not null,
  usado boolean not null default false,
  expira_em timestamptz not null default (now() + interval '14 days'),
  criado_por uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

-- Só este email pode gerir convites (admin único da app, por agora).
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.jwt() ->> 'email' = 'joao.projects.vale@gmail.com';
$$;

-- Info pública mínima para a página /convite/:codigo mostrar antes do registo,
-- sem dar acesso à tabela inteira (quem tem o código já devia saber que é para
-- este email, mas isto evita erros de digitação antes de criar a conta).
create or replace function estado_convite(p_codigo text)
returns table (household_nome text, email text, valido boolean)
language sql
security definer
set search_path = public
as $$
  select h.nome, i.email, (not i.usado and i.expira_em > now())
  from household_invites i
  join households h on h.id = i.household_id
  where i.codigo = p_codigo;
$$;

-- Clona as categorias predefinidas (household_id null) para dentro de um
-- household, para que fiquem 100% autónomas e livremente editáveis por esse
-- espaço — não ficam partilhadas/só-do-admin. Assume que as predefinidas não
-- têm subcategorias (é o caso hoje); se um dia passarem a ter, esta função
-- passa a precisar de mapear parent_id também.
create or replace function clonar_categorias_predefinidas(p_household_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into categories (household_id, nome, tipo, cor)
  select p_household_id, nome, tipo, cor
  from categories
  where household_id is null;
$$;

-- Só é chamada internamente (admin_criar_espaco); ninguém a deve poder
-- invocar diretamente, já que faz insert bypassando RLS para QUALQUER household_id.
revoke execute on function clonar_categorias_predefinidas(uuid) from public;

-- Só o admin cria espaços novos (amigo solteiro ou 1º membro de um casal).
create or replace function admin_criar_espaco(p_nome text, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_codigo text;
begin
  if not is_admin() then
    raise exception 'Só o admin pode criar espaços novos';
  end if;

  insert into households (nome) values (coalesce(p_nome, 'Novo espaço')) returning id into v_household_id;
  perform clonar_categorias_predefinidas(v_household_id);

  insert into household_invites (household_id, email, criado_por)
  values (v_household_id, p_email, auth.uid())
  returning codigo into v_codigo;

  return v_codigo;
end;
$$;

-- Qualquer membro pode convidar um 2º email para o SEU PRÓPRIO espaço,
-- limitado a 2 membros (o casal).
create or replace function convidar_parceiro(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_total_membros int;
  v_codigo text;
begin
  select household_id into v_household_id
  from household_members
  where user_id = auth.uid()
  limit 1;

  if v_household_id is null then
    raise exception 'Não pertences a nenhum espaço';
  end if;

  if p_email = auth.jwt() ->> 'email' then
    raise exception 'Não podes convidar o teu próprio email';
  end if;

  select count(*) into v_total_membros from household_members where household_id = v_household_id;
  if v_total_membros >= 2 then
    raise exception 'Este espaço já tem 2 membros';
  end if;

  insert into household_invites (household_id, email, criado_por)
  values (v_household_id, p_email, auth.uid())
  returning codigo into v_codigo;

  return v_codigo;
end;
$$;

-- Único caminho para escrever em household_members a partir do cliente.
-- `for update` evita 2 resgates concorrentes do mesmo código.
create or replace function resgatar_convite(p_codigo text, p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite household_invites%rowtype;
begin
  select * into v_invite
  from household_invites
  where codigo = p_codigo
  for update;

  if not found then
    raise exception 'Convite inválido';
  end if;

  if v_invite.usado then
    raise exception 'Convite já foi utilizado';
  end if;

  if v_invite.expira_em < now() then
    raise exception 'Convite expirado';
  end if;

  if v_invite.email <> auth.jwt() ->> 'email' then
    raise exception 'Este convite não é para este email';
  end if;

  insert into household_members (household_id, user_id, nome) values (v_invite.household_id, auth.uid(), p_nome);

  update household_invites set usado = true where id = v_invite.id;

  return v_invite.household_id;
end;
$$;

-- Vista para o admin acompanhar os convites: junta com auth.users (não
-- acessível diretamente via RLS) para saber se a pessoa já criou conta e/ou
-- já confirmou o email, mesmo antes de resgatar o convite.
create or replace function admin_estado_convites()
returns table (
  id uuid,
  codigo text,
  email text,
  household_nome text,
  usado boolean,
  expira_em timestamptz,
  created_at timestamptz,
  conta_criada boolean,
  conta_confirmada boolean
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.codigo, i.email, h.nome, i.usado, i.expira_em, i.created_at,
    (u.id is not null) as conta_criada,
    (u.email_confirmed_at is not null) as conta_confirmada
  from household_invites i
  join households h on h.id = i.household_id
  left join auth.users u on u.email = i.email
  where is_admin()
  order by i.created_at desc;
$$;

grant execute on function estado_convite(text) to authenticated, anon;
grant execute on function admin_criar_espaco(text, text) to authenticated;
grant execute on function convidar_parceiro(text) to authenticated;
grant execute on function resgatar_convite(text, text) to authenticated;
grant execute on function admin_estado_convites() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table households enable row level security;
alter table household_members enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table fixed_expenses enable row level security;
alter table savings_goals enable row level security;
alter table category_rules enable row level security;
alter table household_invites enable row level security;

create policy "membros veem o seu household"
  on households for select
  using (is_household_member(id));

create policy "membros veem os outros membros do seu household"
  on household_members for select
  using (is_household_member(household_id));

-- Sem policy de insert em households/household_members: só as funções
-- security definer (admin_criar_espaco, convidar_parceiro, resgatar_convite)
-- escrevem nestas tabelas. O mesmo vale para household_invites — sem policy
-- de insert, só de select (a validação do código antes do registo usa a
-- função estado_convite, não select direto).

create policy "admin vê todos os convites, membros veem os do seu espaço"
  on household_invites for select
  using (is_admin() or is_household_member(household_id));

create policy "membros veem a conta casal e as suas próprias contas"
  on accounts for all
  using (is_household_member(household_id) and (owner_user_id is null or owner_user_id = auth.uid()))
  with check (is_household_member(household_id) and (owner_user_id is null or owner_user_id = auth.uid()));

create policy "toda a gente vê categorias globais ou do seu household"
  on categories for select
  using (household_id is null or is_household_member(household_id));

create policy "membros gerem categorias do household"
  on categories for insert
  with check (is_household_member(household_id));

-- Cada household edita livremente as SUAS categorias (as predefinidas são
-- clonadas para dentro do household em admin_criar_espaco/convidar_parceiro,
-- não ficam partilhadas — cada espaço tem autonomia total sobre as suas).
create policy "membros editam as categorias do seu household"
  on categories for update
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "membros veem transações das contas a que têm acesso"
  on transactions for all
  using (
    is_household_member(household_id)
    and can_access_account(account_id)
    and (conta_destino_id is null or can_access_account(conta_destino_id))
  )
  with check (
    is_household_member(household_id)
    and can_access_account(account_id)
    and (conta_destino_id is null or can_access_account(conta_destino_id))
  );

create policy "membros gerem orçamentos do household"
  on budgets for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "membros gerem objetivos de poupança do household"
  on savings_goals for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "membros gerem regras de categorização do household"
  on category_rules for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "membros gerem despesas fixas do household"
  on fixed_expenses for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- Categorias predefinidas (globais, household_id = null)
-- ---------------------------------------------------------------------------
insert into categories (nome, tipo, cor) values
  ('Casa', 'despesa', '#6366f1'),
  ('Alimentação', 'despesa', '#22c55e'),
  ('Transportes', 'despesa', '#f59e0b'),
  ('Lazer', 'despesa', '#ec4899'),
  ('Saúde', 'despesa', '#ef4444'),
  ('Poupança', 'despesa', '#0ea5e9'),
  ('Salário', 'receita', '#16a34a'),
  ('Outros', 'despesa', '#a3a3a3');

-- ---------------------------------------------------------------------------
-- Seeding do Vale + Clara (correr depois de criar os 2 utilizadores em
-- Authentication > Users no painel do Supabase — não há registo pela app).
-- Substitui os dois UUIDs abaixo pelos "User UID" reais de cada conta.
-- ---------------------------------------------------------------------------
-- insert into households (nome) values ('Vale & Clara') returning id; -- guarda o id devolvido

-- insert into household_members (household_id, user_id, nome) values
--   ('<household_id>', '<user_id_vale>', 'Vale'),
--   ('<household_id>', '<user_id_clara>', 'Clara');

-- insert into accounts (household_id, owner_user_id, tipo, nome) values
--   ('<household_id>', null, 'casal', 'Conta Casal'),
--   ('<household_id>', '<user_id_vale>', 'pessoal', 'Conta Pessoal — Vale'),
--   ('<household_id>', '<user_id_clara>', 'pessoal', 'Conta Pessoal — Clara');
