-- Minhas Contas: banco de dados (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase. Pode rodar de novo sem problema.

create table if not exists public.app_config (
  id int primary key default 1 check (id = 1),
  admin_email text not null,
  support_whatsapp text
);

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  name text not null default '',
  work_type text not null default 'clt' check (work_type in ('clt', 'pj')),
  role text not null default 'user' check (role in ('user', 'admin')),
  blocked boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  email text not null,
  subject text not null check (char_length(subject) between 1 and 120),
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'aberto' check (status in ('aberto', 'respondido', 'fechado')),
  reply text,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);
create index if not exists support_tickets_user_idx on public.support_tickets (user_id);

-- Funções auxiliares (security definer evita recursão nas políticas)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and not blocked);
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and not blocked);
$$;

-- Cria o perfil automaticamente no cadastro
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name, work_type, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    case when new.raw_user_meta_data ->> 'work_type' = 'pj' then 'pj' else 'clt' end,
    case when exists (select 1 from app_config where lower(admin_email) = lower(new.email)) then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Usuário comum não pode se promover a admin nem se desbloquear
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    new.role := old.role;
    new.blocked := old.blocked;
    new.email := old.email;
  end if;
  if new.id = auth.uid() and old.role = 'admin' then
    new.role := 'admin';
    new.blocked := false;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile before update on public.profiles
for each row execute function public.protect_profile();

-- Segurança por linha (cada um só vê o que é seu; admin vê perfis e chamados)
alter table public.app_config enable row level security;
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists "config: leitura" on public.app_config;
create policy "config: leitura" on public.app_config for select to authenticated using (true);
drop policy if exists "config: admin altera" on public.app_config;
create policy "config: admin altera" on public.app_config for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "perfil: ver" on public.profiles;
create policy "perfil: ver" on public.profiles for select to authenticated using (id = auth.uid() or is_admin());
drop policy if exists "perfil: alterar" on public.profiles;
create policy "perfil: alterar" on public.profiles for update to authenticated using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());

drop policy if exists "dados: dono" on public.user_data;
create policy "dados: dono" on public.user_data for all to authenticated
  using (user_id = auth.uid() and is_active_user())
  with check (user_id = auth.uid() and is_active_user());

drop policy if exists "chamado: ver" on public.support_tickets;
create policy "chamado: ver" on public.support_tickets for select to authenticated using (user_id = auth.uid() or is_admin());
drop policy if exists "chamado: abrir" on public.support_tickets;
create policy "chamado: abrir" on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid() and is_active_user() and status = 'aberto' and reply is null);
drop policy if exists "chamado: admin responde" on public.support_tickets;
create policy "chamado: admin responde" on public.support_tickets for update to authenticated using (is_admin()) with check (is_admin());

grant select, update on public.app_config to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_data to authenticated;
grant select, insert, update on public.support_tickets to authenticated;
