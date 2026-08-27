function getEventStartSortKey(event) {
  if (event.start?.dateTime) return event.start.dateTime
  if (event.start?.date) return `${event.start.date}T00:00:00`
  return ''
}

function getDoneRank(event) {
  return event.status === 'done' ? 1 : 0
}

export function compareCalendarEvents(a, b) {
  const doneCompare = getDoneRank(a) - getDoneRank(b)
  if (doneCompare !== 0) return doneCompare

  const startCompare = getEventStartSortKey(a).localeCompare(getEventStartSortKey(b))
  if (startCompare !== 0) return startCompare

  return (a.summary || '').localeCompare(b.summary || '')
}

export function sortCalendarEvents(events) {
  return [...events].sort(compareCalendarEvents)
}
