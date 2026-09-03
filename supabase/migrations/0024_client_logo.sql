-- Client logos: a public storage bucket + a column on clients pointing
-- at the uploaded file's public URL.
alter table clients add column logo_url text;

insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

-- Same flat "any authenticated teammate" access model as the rest of the app.
create policy "authenticated upload client logos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'client-logos');

create policy "authenticated update client logos" on storage.objects
  for update to authenticated
  using (bucket_id = 'client-logos');

create policy "authenticated delete client logos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'client-logos');

create policy "public read client logos" on storage.objects
  for select using (bucket_id = 'client-logos');
