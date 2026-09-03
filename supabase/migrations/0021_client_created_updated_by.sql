-- Track who created/last updated each client, for display on the client
-- detail header. Stores the email directly (same pattern as audit_log)
-- since auth.users isn't queryable via the client-side REST API.
alter table clients add column created_by_email text;
alter table clients add column updated_by_email text;
