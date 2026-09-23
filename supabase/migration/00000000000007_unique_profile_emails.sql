-- One application profile per email address, case-insensitive.
create unique index if not exists profiles_email_lower_unique
on public.profiles (lower(email))
where email is not null;
