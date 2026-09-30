export async function parseActivityFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['gpx', 'tcx'].includes(extension)) {
    throw new Error('Choisissez un fichier GPX ou TCX.')
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Le fichier doit faire moins de 25 Mo.')
  }

  const xml = new DOMParser().parseFromString(await file.text(), 'application/xml')
  if (elementsByName(xml, 'parsererror').length) {
    throw new Error('Le fichier d’activité est invalide ou incomplet.')
  }

  const isTcx = extension === 'tcx'
  const points = isTcx ? readTcxPoints(xml) : readGpxPoints(xml)
  points.sort((left, right) => left.time - right.time)
  if (points.length < 2) {
    throw new Error('Le fichier doit contenir au moins deux points horodatés.')
  }

  const durationSeconds = Math.round((points.at(-1).time - points[0].time) / 1000)
  const distanceMeters = isTcx
    ? tcxDistance(points) || gpsDistance(points)
    : gpsDistance(points)
  if (durationSeconds <= 0 || distanceMeters <= 0) {
    throw new Error('Impossible de calculer la durée ou la distance de cette activité.')
  }

  return {
    session_date: new Date(points[0].time).toISOString().slice(0, 10),
    duration_seconds: durationSeconds,
    duration_minutes: Math.max(1, Math.round(durationSeconds / 60)),
    distance_meters: Math.round(distanceMeters),
    average_pace_seconds_per_km: Math.round(durationSeconds / (distanceMeters / 1000)),
    activity_source: 'import',
    source_format: extension.toUpperCase(),
    source_filename: file.name,
  }
}

function readGpxPoints(xml) {
  return elementsByName(xml, 'trkpt').map((element) => ({
    latitude: Number(element.getAttribute('lat')),
    longitude: Number(element.getAttribute('lon')),
    time: timestampOf(firstElement(element, 'time')?.textContent),
  })).filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && point.time)
}

function readTcxPoints(xml) {
  return elementsByName(xml, 'Trackpoint').map((element) => {
    const position = firstElement(element, 'Position')
    const latitude = Number(firstElement(position, 'LatitudeDegrees')?.textContent)
    const longitude = Number(firstElement(position, 'LongitudeDegrees')?.textContent)
    const distance = Number(firstElement(element, 'DistanceMeters')?.textContent)
    return {
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      distance: Number.isFinite(distance) ? distance : null,
      time: timestampOf(firstElement(element, 'Time')?.textContent),
    }
  }).filter((point) => point.time)
}

function tcxDistance(points) {
  const distances = points.map((point) => point.distance).filter(Number.isFinite)
  if (!distances.length) return 0
  const bounds = distances.reduce((current, distance) => ({
    minimum: Math.min(current.minimum, distance),
    maximum: Math.max(current.maximum, distance),
  }), { minimum: Number.POSITIVE_INFINITY, maximum: Number.NEGATIVE_INFINITY })
  return bounds.maximum - bounds.minimum
}

function gpsDistance(points) {
  const positioned = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
  let meters = 0
  for (let index = 1; index < positioned.length; index += 1) {
    meters += haversineDistance(positioned[index - 1], positioned[index])
  }
  return meters
}

function haversineDistance(left, right) {
  const radians = (degrees) => degrees * Math.PI / 180
  const latitudeDelta = radians(right.latitude - left.latitude)
  const longitudeDelta = radians(right.longitude - left.longitude)
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(left.latitude)) * Math.cos(radians(right.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function elementsByName(root, name) {
  return [...new Set([...root.getElementsByTagNameNS('*', name), ...root.getElementsByTagName(name)])]
}

function firstElement(root, name) {
  return root ? elementsByName(root, name)[0] : null
}

function timestampOf(value) {
  const timestamp = Date.parse(value || '')
  return Number.isFinite(timestamp) ? timestamp : null
}