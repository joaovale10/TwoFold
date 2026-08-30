-- Pedaços de SQL para correres agora no SQL Editor do Supabase, isolados do
-- supabase/schema.sql completo (que é só para um projeto novo, do zero).
-- Este ficheiro é substituído/limpo a cada nova ronda — o que já correste
-- não precisa de ser corrido outra vez, mas corre tudo o que aqui estiver.

-- 1) Categorias: cada household edita livremente as SUAS categorias.
-- (Se já correste uma versão anterior desta policy com "admin edita as
-- predefinidas", este `drop` remove-a antes de criar a nova.)
drop policy if exists "membros editam as suas, admin edita as predefinidas" on categories;
drop policy if exists "membros editam as categorias do seu household" on categories;

create policy "membros editam as categorias do seu household"
  on categories for update
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

-- 2) Clonar as categorias predefinidas para dentro de um household, para
-- ficarem 100% autónomas e livremente editáveis por esse espaço (deixam de
-- ser partilhadas/só-do-admin).
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

revoke execute on function clonar_categorias_predefinidas(uuid) from public;

-- 3) admin_criar_espaco passa a clonar as predefinidas para o household novo
-- automaticamente (para os PRÓXIMOS espaços criados a partir de agora).
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

-- 4) Vista para o admin em /convites: junta com auth.users para saber se a
-- pessoa já criou conta e/ou confirmou o email, mesmo antes de resgatar.
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

grant execute on function admin_estado_convites() to authenticated;

-- 5) OPCIONAL, só se já tiveres households criados ANTES desta alteração
-- (ex: espaços de teste sem categorias próprias ainda) e quiseres dar-lhes
-- também a sua cópia autónoma das predefinidas. Substitui o UUID:
-- select clonar_categorias_predefinidas('<household_id>');
