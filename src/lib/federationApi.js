import { supabase, isSupabaseConfigured } from './supabase'

export async function getCurrentProfile() {
  if (!isSupabaseConfigured) return { data: null, error: null }

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return { data: null, error: authError }

  const profileResult = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle()
  if (profileResult.error || profileResult.data) return profileResult

  const profile = {
    id: authData.user.id,
    full_name: authData.user.user_metadata?.full_name || authData.user.email || 'Administrateur',
    email: authData.user.email,
    role: 'admin',
  }

  return supabase.from('profiles').upsert(profile, { onConflict: 'id' }).select().single()
}

export async function getFederationForCurrentUser() {
  const profileResult = await getCurrentProfile()
  if (profileResult.error || !profileResult.data?.federation_id) {
    return { data: null, error: profileResult.error }
  }

  return supabase.from('federations').select('*').eq('id', profileResult.data.federation_id).maybeSingle()
}

export async function saveFederationForCurrentUser(federation) {
  const profileResult = await getCurrentProfile()
  if (profileResult.error) return profileResult
  if (!profileResult.data) {
    return { data: null, error: new Error('Votre profil administrateur est introuvable. Exécutez le trigger du fichier supabase/schema.sql dans Supabase.') }
  }

  const payload = {
    name: federation.name,
    country: federation.country,
    sports: federation.sports,
    logo_url: federation.logo || null,
  }

  if (profileResult.data.federation_id) {
    return supabase
      .from('federations')
      .update(payload)
      .eq('id', profileResult.data.federation_id)
      .select()
      .single()
  }

  return supabase.rpc('create_federation_for_current_user', {
    federation_name: payload.name,
    federation_country: payload.country,
    federation_sports: payload.sports,
    federation_logo: payload.logo_url,
  })
}

export async function deleteFederationForCurrentUser() {
  const profileResult = await getCurrentProfile()
  if (profileResult.error || !profileResult.data?.federation_id) return profileResult

  const federationResult = await supabase
    .from('federations')
    .delete()
    .eq('id', profileResult.data.federation_id)

  if (federationResult.error) return federationResult

  return supabase.from('profiles').update({ federation_id: null }).eq('id', profileResult.data.id)
}

export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase n’est pas configuré.') }
  return supabase.auth.getUser()
}

export async function getFederationMembers() {
  const profileResult = await getCurrentProfile()
  if (profileResult.error || !profileResult.data?.federation_id) return profileResult

  return supabase
    .from('federation_members')
    .select('*')
    .eq('federation_id', profileResult.data.federation_id)
    .order('created_at', { ascending: false })
}

export async function getFederationInvitations() {
  const profileResult = await getCurrentProfile()
  if (profileResult.error || !profileResult.data?.federation_id) return profileResult

  return supabase
    .from('federation_invitations')
    .select('*')
    .eq('federation_id', profileResult.data.federation_id)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })
}

export async function inviteFederationMember(member) {
  return supabase.functions.invoke('invite-member', { body: member })
}
