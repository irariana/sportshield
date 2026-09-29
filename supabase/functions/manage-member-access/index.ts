import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405)

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

    const { data: actor, error: actorError } = await adminClient
      .from('profiles')
      .select('id, federation_id, role, status')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (actorError || actor?.role !== 'admin' || actor.status !== 'actif' || !actor.federation_id) {
      return json({ error: 'Seul un administrateur actif rattaché à une fédération peut gérer les accès.' }, 403)
    }

    const body = await request.json()
    const targetId = String(body.profile_id ?? '')
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId)) {
      return json({ error: 'Identifiant de compte invalide.' }, 400)
    }
    if (targetId === actor.id) return json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' }, 400)

    const { data: target, error: targetError } = await adminClient
      .from('profiles')
      .select('id, federation_id, full_name, email, status')
      .eq('id', targetId)
      .maybeSingle()

    if (targetError || !target || target.federation_id !== actor.federation_id) {
      return json({ error: 'Ce compte est introuvable dans votre fédération.' }, 404)
    }
    if (target.status === 'inactif') return json({ error: 'Ce compte est déjà désactivé.' }, 409)

    const { error: banError } = await adminClient.auth.admin.updateUserById(target.id, { ban_duration: '876000h' })
    if (banError) return json({ error: `Le blocage de la connexion a échoué : ${banError.message}` }, 400)

    let accessError: Error | null = null
    try {
      const result = await adminClient.rpc('deactivate_federation_member', {
        actor_profile_id: actor.id,
        target_profile_id: target.id,
      })
      accessError = result.error
    } catch (error) {
      accessError = error instanceof Error ? error : new Error('Erreur serveur.')
    }

    if (accessError) {
      const { error: rollbackError } = await adminClient.auth.admin.updateUserById(target.id, { ban_duration: 'none' })
      const rollbackMessage = rollbackError ? ' Le compte reste bloqué et nécessite une vérification manuelle.' : ''
      return json({ error: `La désactivation n'a pas été journalisée : ${accessError.message}.${rollbackMessage}` }, 400)
    }

    return json({ data: { id: target.id, status: 'inactif' } })
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
