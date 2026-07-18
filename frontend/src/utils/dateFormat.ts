export function formatDateShortIt(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateTimeCompactIt(dateTime: string) {
  return dateTime.slice(0, 16).replace('T', ' ')
}

export function formatMeseIt(mese: string) {
  const [anno, month] = mese.split('-').map(Number)
  const label = new Date(anno, month - 1, 1).toLocaleDateString('it-IT', {
    month: 'long',
  })
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${anno}`
}
