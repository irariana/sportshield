const coaches = [
  { id: 'COA-0001', firstName: 'Claire', lastName: 'Martin', sport: 'Natation', specialty: 'Natation course' },
  { id: 'COA-0002', firstName: 'Julien', lastName: 'Bernard', sport: 'Natation', specialty: 'Eau libre' },
  { id: 'COA-0003', firstName: 'Sarah', lastName: 'Dubois', sport: 'Athlétisme', specialty: 'Sprint' },
  { id: 'COA-0004', firstName: 'Thomas', lastName: 'Leroy', sport: 'Athlétisme', specialty: 'Sprint' },
]

const initialAssignments = [
  { athleteId: 'SPT-0001', coachId: 'COA-0001', assignedAt: '2026-09-10' },
  { athleteId: 'SPT-0002', coachId: 'COA-0002', assignedAt: '2026-09-10' },
  { athleteId: 'SPT-0003', coachId: 'COA-0003', assignedAt: '2026-09-11' },
]

const initialHistory = [
  { id: 'HIS-0001', athleteId: 'SPT-0001', fromCoachId: null, toCoachId: 'COA-0001', date: '2026-09-10' },
  { id: 'HIS-0002', athleteId: 'SPT-0002', fromCoachId: null, toCoachId: 'COA-0002', date: '2026-09-10' },
  { id: 'HIS-0003', athleteId: 'SPT-0003', fromCoachId: null, toCoachId: 'COA-0003', date: '2026-09-11' },
]

const storageKeys = { assignments: 'sportshield:mock-assignments', history: 'sportshield:mock-assignment-history' }

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback.map((item) => ({ ...item }))
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback.map((item) => ({ ...item }))
  } catch {
    return fallback.map((item) => ({ ...item }))
  }
}

function writeStorage(key, value) {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value))
}

export function getMockCoaches() {
  return coaches.map((coach) => ({ ...coach }))
}

export function getMockAssignments() {
  return readStorage(storageKeys.assignments, initialAssignments)
}

export function getMockAssignmentHistory() {
  return readStorage(storageKeys.history, initialHistory)
}

export function saveMockAssignment(assignment, currentAssignments, currentHistory) {
  const existing = currentAssignments.find((item) => item.athleteId === assignment.athleteId)
  if (existing?.coachId === assignment.coachId) return { error: 'Ce sportif est déjà affecté à cet entraîneur.' }

  const nextAssignments = existing
    ? currentAssignments.map((item) => item.athleteId === assignment.athleteId ? { ...item, coachId: assignment.coachId, assignedAt: assignment.assignedAt } : item)
    : [...currentAssignments, assignment]
  const nextHistory = [{ id: `HIS-${String(currentHistory.length + 1).padStart(4, '0')}`, athleteId: assignment.athleteId, fromCoachId: existing?.coachId ?? null, toCoachId: assignment.coachId, date: assignment.assignedAt }, ...currentHistory]
  writeStorage(storageKeys.assignments, nextAssignments)
  writeStorage(storageKeys.history, nextHistory)
  return { data: { assignments: nextAssignments, history: nextHistory } }
}

export function clearMockAssignmentStorage() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(storageKeys.assignments)
    window.localStorage.removeItem(storageKeys.history)
  }
}