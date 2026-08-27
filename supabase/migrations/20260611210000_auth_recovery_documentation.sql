-- Password recovery email (SMTP) is managed by Supabase Auth (GoTrue), not PostgreSQL.
-- Hosted projects: Dashboard -> Project Settings -> Authentication -> SMTP Settings
-- Local development: supabase/config.toml [auth.email.smtp]
-- Recovery template must include {{ .Token }} for OTP verification flow.
-- Redirect URLs must include /reset-password and /auth/callback in Auth URL config.

COMMENT ON SCHEMA public IS 'Capsood Fuel Report app schema. Auth email/SMTP is configured via Supabase Auth settings, not SQL migrations.';
