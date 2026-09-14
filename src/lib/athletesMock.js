const initialAthletes = [
  {
    id: 'SPT-0001',
    firstName: 'Thomas',
    lastName: 'Bernard',
    birthDate: '2001-04-18',
    sport: 'Natation',
    discipline: 'Natation course',
    club: 'Cercle des nageurs de Lyon',
    status: 'Actif',
  },
  {
    id: 'SPT-0002',
    firstName: 'Léa',
    lastName: 'Martin',
    birthDate: '2003-09-07',
    sport: 'Natation',
    discipline: 'Eau libre',
    club: 'Aqua Club Marseille',
    status: 'Actif',
  },
  {
    id: 'SPT-0003',
    firstName: 'Inès',
    lastName: 'Robert',
    birthDate: '2002-01-26',
    sport: 'Athlétisme',
    discipline: 'Sprint',
    club: 'Stade Bordelais',
    status: 'En pause',
  },
]

export const sportOptions = {
  Natation: ['Natation course', 'Eau libre'],
  Athlétisme: ['Sprint', '100 m', '200 m', '400 m'],
}

export const athleteStatusOptions = ['Actif', 'En pause', 'Blessé', 'Inactif']

export function getMockAthletes() {
  return initialAthletes.map((athlete) => ({ ...athlete }))
}

// Demo only: the backend will generate and validate the definitive identifier.
export function createMockAthlete(form, existingAthletes) {
  const nextNumber = existingAthletes.reduce((highest, athlete) => Math.max(highest, Number(athlete.id.replace('SPT-', '')) || 0), initialAthletes.length) + 1
  return {
    ...form,
    id: `SPT-${String(nextNumber).padStart(4, '0')}`,
  }
}