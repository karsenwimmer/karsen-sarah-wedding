create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  household_name text not null,
  primary_first_name text not null,
  primary_last_name text not null,
  primary_email text not null,
  normalized_email text not null,
  primary_phone text,
  street_address text not null,
  unit text,
  city text not null,
  province_state text not null,
  postal_zip text not null,
  country text not null default 'Canada',
  notes text,
  communication_consent boolean not null,
  physical_invitation_sent boolean not null default false,
  internal_notes text,
  confirmation_email_status text,
  couple_notification_status text,
  last_email_error text,
  rsvp_token_hash text,
  rsvp_token_created_at timestamptz,
  rsvp_token_revoked_at timestamptz,
  rsvp_short_code text,
  rsvp_enabled boolean not null default false,
  rsvp_completed_at timestamptz,
  rsvp_last_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_primary_email_length check (char_length(primary_email) <= 320),
  constraint households_normalized_email_not_blank check (char_length(normalized_email) > 0),
  constraint households_communication_consent_required check (communication_consent is true)
);

create unique index if not exists households_normalized_email_key
  on public.households (normalized_email);

create unique index if not exists households_rsvp_token_hash_key
  on public.households (rsvp_token_hash)
  where rsvp_token_hash is not null;

create unique index if not exists households_rsvp_short_code_key
  on public.households (rsvp_short_code)
  where rsvp_short_code is not null;

create index if not exists households_created_at_idx on public.households (created_at desc);
create index if not exists households_updated_at_idx on public.households (updated_at desc);
create index if not exists households_invitation_sent_idx on public.households (physical_invitation_sent);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_members_display_order_nonnegative check (display_order >= 0)
);

create index if not exists household_members_household_order_idx
  on public.household_members (household_id, display_order);

create table if not exists public.submission_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete set null,
  event_type text not null,
  source text not null default 'public_form',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists submission_events_household_created_idx
  on public.submission_events (household_id, created_at desc);

create index if not exists submission_events_event_type_idx
  on public.submission_events (event_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists households_set_updated_at on public.households;
create trigger households_set_updated_at
  before update on public.households
  for each row
  execute function public.set_updated_at();

drop trigger if exists household_members_set_updated_at on public.household_members;
create trigger household_members_set_updated_at
  before update on public.household_members
  for each row
  execute function public.set_updated_at();

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.submission_events enable row level security;

revoke all on public.households from anon, authenticated;
revoke all on public.household_members from anon, authenticated;
revoke all on public.submission_events from anon, authenticated;

comment on table public.households is
  'Wedding household mailing records. Public writes must go through trusted server-side code; no anonymous RLS policies are intentionally defined.';

comment on column public.households.rsvp_token_hash is
  'Future RSVP passwordless access token hash. Never store the plaintext RSVP token.';

comment on column public.households.rsvp_short_code is
  'Future human-readable RSVP fallback code. Generate randomly, normalize case/hyphens when validating, and rate-limit attempts.';
