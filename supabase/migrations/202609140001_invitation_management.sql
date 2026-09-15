alter table public.households
  add column if not exists invitation_source text,
  add column if not exists invitation_status text,
  add column if not exists invitation_package text;

update public.households
set
  invitation_source = coalesce(invitation_source, 'save_the_date'),
  invitation_status = coalesce(invitation_status, 'needs_review'),
  invitation_package = coalesce(invitation_package, 'full_celebration');

alter table public.households
  alter column invitation_source set default 'manual',
  alter column invitation_source set not null,
  alter column invitation_status set default 'needs_review',
  alter column invitation_status set not null,
  alter column invitation_package set default 'full_celebration',
  alter column invitation_package set not null,
  alter column primary_first_name drop not null,
  alter column primary_last_name drop not null,
  alter column primary_email drop not null,
  alter column normalized_email drop not null,
  alter column street_address drop not null,
  alter column city drop not null,
  alter column province_state drop not null,
  alter column postal_zip drop not null,
  alter column country drop not null,
  alter column communication_consent set default false;

alter table public.households
  drop constraint if exists households_communication_consent_required,
  drop constraint if exists households_invitation_source_check,
  drop constraint if exists households_invitation_status_check,
  drop constraint if exists households_invitation_package_check;

alter table public.households
  add constraint households_invitation_source_check
    check (invitation_source in ('save_the_date', 'manual', 'bulk_church')),
  add constraint households_invitation_status_check
    check (invitation_status in ('needs_review', 'ready', 'invitation_sent')),
  add constraint households_invitation_package_check
    check (invitation_package in ('church_celebration', 'full_celebration'));

create index if not exists households_invitation_status_idx
  on public.households (invitation_status);

create index if not exists households_invitation_package_idx
  on public.households (invitation_package);

create index if not exists households_invitation_source_idx
  on public.households (invitation_source);

comment on column public.households.invitation_source is
  'How the household entered the invitation list: save-the-date submission, manual entry, or shared church invitation.';

comment on column public.households.invitation_status is
  'Administrative preparation state before RSVP codes and invitations are issued.';

comment on column public.households.invitation_package is
  'Events visible to this household: church celebration or the full celebration including the venue.';

create or replace function public.admin_save_household(
  p_household_id uuid,
  p_household jsonb,
  p_members jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  saved_household_id uuid;
begin
  if jsonb_typeof(p_members) is distinct from 'array'
    or jsonb_array_length(p_members) < 1
    or jsonb_array_length(p_members) > 12 then
    raise exception 'A household must contain between 1 and 12 members.';
  end if;

  if p_household_id is null then
    insert into public.households (
      household_name,
      primary_first_name,
      primary_last_name,
      primary_email,
      normalized_email,
      primary_phone,
      street_address,
      unit,
      city,
      province_state,
      postal_zip,
      country,
      communication_consent,
      physical_invitation_sent,
      internal_notes,
      invitation_source,
      invitation_status,
      invitation_package
    )
    values (
      p_household->>'household_name',
      nullif(p_household->>'primary_first_name', ''),
      nullif(p_household->>'primary_last_name', ''),
      nullif(p_household->>'primary_email', ''),
      nullif(p_household->>'normalized_email', ''),
      nullif(p_household->>'primary_phone', ''),
      nullif(p_household->>'street_address', ''),
      nullif(p_household->>'unit', ''),
      nullif(p_household->>'city', ''),
      nullif(p_household->>'province_state', ''),
      nullif(p_household->>'postal_zip', ''),
      nullif(p_household->>'country', ''),
      false,
      (p_household->>'invitation_status') = 'invitation_sent',
      nullif(p_household->>'internal_notes', ''),
      p_household->>'invitation_source',
      p_household->>'invitation_status',
      p_household->>'invitation_package'
    )
    returning id into saved_household_id;
  else
    update public.households
    set
      household_name = p_household->>'household_name',
      primary_first_name = nullif(p_household->>'primary_first_name', ''),
      primary_last_name = nullif(p_household->>'primary_last_name', ''),
      primary_email = nullif(p_household->>'primary_email', ''),
      normalized_email = nullif(p_household->>'normalized_email', ''),
      primary_phone = nullif(p_household->>'primary_phone', ''),
      street_address = nullif(p_household->>'street_address', ''),
      unit = nullif(p_household->>'unit', ''),
      city = nullif(p_household->>'city', ''),
      province_state = nullif(p_household->>'province_state', ''),
      postal_zip = nullif(p_household->>'postal_zip', ''),
      country = nullif(p_household->>'country', ''),
      physical_invitation_sent = (p_household->>'invitation_status') = 'invitation_sent',
      internal_notes = nullif(p_household->>'internal_notes', ''),
      invitation_source = p_household->>'invitation_source',
      invitation_status = p_household->>'invitation_status',
      invitation_package = p_household->>'invitation_package'
    where id = p_household_id
    returning id into saved_household_id;

    if saved_household_id is null then
      raise exception 'Household not found.';
    end if;
  end if;

  delete from public.household_members
  where household_id = saved_household_id;

  insert into public.household_members (household_id, first_name, last_name, display_order)
  select
    saved_household_id,
    trim(member->>'first_name'),
    trim(member->>'last_name'),
    (member_position - 1)::integer
  from jsonb_array_elements(p_members) with ordinality as rows(member, member_position);

  return saved_household_id;
end;
$$;

revoke all on function public.admin_save_household(uuid, jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.admin_save_household(uuid, jsonb, jsonb)
  to service_role;

comment on function public.admin_save_household(uuid, jsonb, jsonb) is
  'Atomically creates or updates one admin-managed household and its invited members. Service role only.';
