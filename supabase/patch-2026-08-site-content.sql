-- Fairy House — patch : contenu éditable des pages vitrine (CMS). Idempotent.
create table if not exists site_content (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
alter table site_content enable row level security;
drop policy if exists site_content_public on site_content;
create policy site_content_public on site_content for select using (true);
drop policy if exists site_content_admin on site_content;
create policy site_content_admin on site_content for all using (is_admin()) with check (is_admin());
notify pgrst, 'reload schema';
