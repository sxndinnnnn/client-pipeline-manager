-- Client attachments: files stored in a private storage bucket, plus a table that
-- remembers each file's name, size and owner client. Files are opened through
-- short-lived signed URLs, never public links.

insert into storage.buckets (id, name, public, file_size_limit)
values ('client-attachments', 'client-attachments', false, 26214400) -- 25 MB per file
on conflict (id) do nothing;

-- Same flat "any authenticated teammate" access model as the rest of the app.
create policy "authenticated read client attachments" on storage.objects
  for select to authenticated
  using (bucket_id = 'client-attachments');

create policy "authenticated upload client attachments" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'client-attachments');

create policy "authenticated update client attachments" on storage.objects
  for update to authenticated
  using (bucket_id = 'client-attachments');

create policy "authenticated delete client attachments" on storage.objects
  for delete to authenticated
  using (bucket_id = 'client-attachments');

create table client_attachments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  size_bytes bigint,
  content_type text,
  uploaded_by_email text,
  created_at timestamptz default now()
);

create index on client_attachments (client_id);

alter table client_attachments enable row level security;
create policy "authenticated full access" on client_attachments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
