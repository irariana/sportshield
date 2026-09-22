import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const allowedRoles = new Set(['medecin', 'entraineur', 'sportif'])

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) return json({ error: 'Authentification requise.' }, 401)

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Session invalide.' }, 401)

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, federation_id, role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || profile?.role !== 'admin' || !profile.federation_id) {
      return json({ error: 'Seul un administrateur rattache a une federation peut inviter un membre.' }, 403)
    }

    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const role = String(body.role ?? '')
    const fullName = String(body.full_name ?? '').trim()
    const sport = String(body.sport ?? '').trim()

    if (!email || !email.includes('@') || !allowedRoles.has(role)) {
      return json({ error: 'Email ou role invalide.' }, 400)
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const appUrl = Deno.env.get('APP_URL')?.replace(/\/$/, '')
    const redirectTo = appUrl ? `${appUrl}/#/invite` : undefined
    console.log('invite-member: creating invitation', { email, role, federationId: profile.federation_id })
    const { data: invitation, error: invitationError } = await adminClient
      .from('federation_invitations')
      .insert({
        federation_id: profile.federation_id,
        invited_by: userData.user.id,
        email,
        role,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (invitationError) {
      console.error('invite-member: invitation insert failed', invitationError)
      return json({ error: `Création de l'invitation impossible : ${invitationError.message}` }, 400)
    }

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        invitation_id: invitation.id,
        full_name: fullName,
        sport,
      },
    })

    if (inviteError) {
      console.error('invite-member: email delivery failed', inviteError)
      await adminClient.from('federation_invitations').delete().eq('id', invitation.id)
      return json({ error: `Envoi de l'email impossible : ${inviteError.message}` }, 400)
    }

    return json({ data: { id: invitation.id, email, role, expires_at: expiresAt } }, 201)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erreur serveur.' }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
