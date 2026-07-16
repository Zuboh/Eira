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
