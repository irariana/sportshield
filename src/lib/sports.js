// Liste de référence des sports proposés par SportShield.
// C'est la seule liste de choix disponible dans « Paramètres de la fédération »
// (colonne public.federations.sports) : toute l'application s'y aligne.
export const FEDERATION_SPORTS = ['Route', 'Semi-marathon', 'Marathon', 'Trail']

export function toSportLabel(value) {
  return typeof value === 'string' ? value.trim() : ''
}

// Choix réellement proposés : on ne retient que les sports retenus par la
// fédération qui font partie de la liste de référence. Une fédération qui n'a
// rien enregistré (ou dont les valeurs ne correspondent plus au catalogue)
// retombe sur la liste de référence : les pages d'inscription proposent donc
// toujours exactement les mêmes choix que les paramètres de la fédération.
export function resolveFederationSports(sports) {
  const configured = Array.isArray(sports)
    ? sports.map(toSportLabel).filter((sport) => FEDERATION_SPORTS.includes(sport))
    : []
  const unique = [...new Set(configured)]
  return unique.length ? unique : [...FEDERATION_SPORTS]
}

// Options d'un formulaire de modification : on conserve la valeur courante même
// si elle ne fait plus partie des choix de la fédération (données historiques)
// afin de ne jamais vider silencieusement un profil existant.
export function sportSelectOptions(sports, currentValue) {
  const options = resolveFederationSports(sports)
  const current = toSportLabel(currentValue)
  return current && !options.includes(current) ? [current, ...options] : options
}
