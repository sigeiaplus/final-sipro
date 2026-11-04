-- ANTES: confirme se a tabela já existe.
--   select to_regclass('public.usuarios');   -- null = não existe
-- Este script só cria. Não altera nem apaga nada existente.

create table if not exists public.usuarios (
  id         uuid primary key default gen_random_uuid(),
  cpf        varchar(11) not null unique check (cpf ~ '^[0-9]{11}$'),
  nome       text not null,
  senha_hash text not null,
  perfil     text not null default 'usuario',
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.usuarios_set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists usuarios_updated_at on public.usuarios;
create trigger usuarios_updated_at
before update on public.usuarios
for each row execute function public.usuarios_set_updated_at();

-- RLS ligado e SEM políticas: o navegador (chave publicável) não lê nada.
-- Só o servidor acessa, com a chave secreta.
alter table public.usuarios enable row level security;
revoke all on public.usuarios from anon, authenticated;

-- Primeiro usuário (gere o hash com: npm run hash -- "SuaSenha"):
-- insert into public.usuarios (cpf, nome, senha_hash, perfil)
-- values ('SOMENTE_NUMEROS', 'Nome', 'HASH_AQUI', 'admin');
