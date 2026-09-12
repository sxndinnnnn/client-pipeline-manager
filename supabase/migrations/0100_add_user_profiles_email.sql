-- Denormalized copy of the user's email on user_profiles, so pages that only
-- have an email on file (clients.created_by_email/updated_by_email) can still
-- look up a display name without an admin/service-role call.
alter table user_profiles add column email text;
