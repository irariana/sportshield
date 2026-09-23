-- Let an invited authenticated user resolve only their own pending invitation.
create or replace function public.get_federation_invitation_context(invitation_id uuid)
returns table (role public.app_role, email text)
language sql
security definer
set search_path = public
as $$
  select invitation.role, invitation.email
  from public.federation_invitations invitation
  where invitation.id = get_federation_invitation_context.invitation_id
    and lower(invitation.email) = lower((select email from auth.users where id = auth.uid()))
    and invitation.accepted_at is null
    and invitation.expires_at > now();
$$;

grant execute on function public.get_federation_invitation_context(uuid) to authenticated;

create or replace function public.get_current_federation_invitation_context()
returns table (id uuid, role public.app_role, email text)
language sql
security definer
set search_path = public
as $$
  select invitation.id, invitation.role, invitation.email
  from public.federation_invitations invitation
  where lower(invitation.email) = lower((select email from auth.users where id = auth.uid()))
    and invitation.accepted_at is null
    and invitation.expires_at > now()
  order by invitation.created_at desc
  limit 1;
$$;

grant execute on function public.get_current_federation_invitation_context() to authenticated;
