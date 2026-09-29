import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function getTabStorageKey() {
	const tabIdKey = 'sportshield.auth.tab-id'
	let tabId = window.sessionStorage.getItem(tabIdKey)
	if (!tabId) {
		tabId = window.crypto.randomUUID()
		window.sessionStorage.setItem(tabIdKey, tabId)
	}
	return `sportshield-auth-${tabId}`
}

export const supabase = isSupabaseConfigured
	? createClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				storage: window.sessionStorage,
				storageKey: getTabStorageKey(),
			},
		})
	: null
