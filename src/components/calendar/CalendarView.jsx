import { useMemo } from 'react'
import {
  addMonths,
  addDays as addDateFnsDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDateKeyDays, getDateTimeDateKey, getDateTimeTime } from '@/lib/dateTime'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const WEEK_ALL_DAY_LANE_HEIGHT = 18
const MAX_WEEK_ALL_DAY_LANES = 2
const MAX_TIMED_GROUPS_PER_DAY = 2

const COLOR_MAP = {
  1: 'bg-blue-400',
  2: 'bg-green-500',
  3: 'bg-purple-400',
  4: 'bg-red-400',
  5: 'bg-yellow-400',
  6: 'bg-orange-400',
  7: 'bg-teal-400',
  8: 'bg-gray-400',
  9: 'bg-indigo-400',
  10: 'bg-lime-500',
  11: 'bg-pink-400',
}

function addDays(dateString, days) {
  return addDateKeyDays(dateString, days)
}

function getEventStyle(event, calendars) {
  if (event.colorId) {
    return { className: COLOR_MAP[event.colorId] || 'bg-indigo-400', style: {} }
  }

  const cal = calendars?.find((c) => c.id === event.calendarId)
  if (cal?.backgroundColor) {
    return { className: '', style: { backgroundColor: cal.backgroundColor } }
  }

  return { className: 'bg-indigo-400', style: {} }
}

function getEventRange(event) {
  const start = event.start?.date || getDateTimeDateKey(event.start?.dateTime)
  const rawEnd = event.end?.date || getDateTimeDateKey(event.end?.dateTime) || start

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '')) {
    return { start: null, end: null }
  }

  const exclusiveEnd = event.end?.date && rawEnd > start ? addDays(rawEnd, -1) : rawEnd
  const end = exclusiveEnd && exclusiveEnd >= start ? exclusiveEnd : start

  return { start, end }
}

function rangeLength({ start, end }) {
  if (!start || !end) return 0
  return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1)
}

function isAllDay(event) {
  return !!event.start?.date
}

function isAllDayOrMultiDay(event) {
  const { start, end } = getEventRange(event)
  return isAllDay(event) || (!!start && !!end && start !== end)
}

function isMultiDayAllDay(event) {
  return isAllDay(event) && rangeLength(getEventRange(event)) > 1
}

function getBadgeTime(event) {
  if (event.start?.date) return '종일'
  return getDateTimeTime(event.start?.dateTime)
}

function groupEventsByTime(events) {
  return events.reduce((groups, event) => {
    const time = getBadgeTime(event)
    const key = time || 'all-day'
    const group = groups.find((item) => item.key === key)

    if (group) {
      group.events.push(event)
    } else {
      groups.push({ key, time, events: [event] })
    }

    return groups
  }, [])
}

function sortEventsForCalendar(a, b) {
  const aRange = getEventRange(a)
  const bRange = getEventRange(b)
  const startCompare = (aRange.start || '').localeCompare(bRange.start || '')
  if (startCompare !== 0) return startCompare

  const lengthCompare = rangeLength(bRange) - rangeLength(aRange)
  if (lengthCompare !== 0) return lengthCompare

  return (a.summary || '').localeCompare(b.summary || '')
}

function clampRangeToWeek(range, weekStart, weekEnd) {
  const start = range.start < weekStart ? weekStart : range.start
  const end = range.end > weekEnd ? weekEnd : range.end
  return { start, end }
}

function getWeekAllDayLayout(events, weekDays) {
  const weekDateStrings = weekDays.map((day) => format(day, 'yyyy-MM-dd'))
  const weekStart = weekDateStrings[0]
  const weekEnd = weekDateStrings[6]
  const hiddenCountByDate = new Map(weekDateStrings.map((date) => [date, 0]))
  const visibleLaneCountByDate = new Map(weekDateStrings.map((date) => [date, 0]))
  const laneEnds = []
  const segments = []

  events
    .filter(isMultiDayAllDay)
    .map((event) => ({ event, range: getEventRange(event) }))
    .filter(({ range }) => range.start && range.end && range.end >= weekStart && range.start <= weekEnd)
    .sort((a, b) => sortEventsForCalendar(a.event, b.event))
    .forEach(({ event, range }) => {
      const segment = clampRangeToWeek(range, weekStart, weekEnd)
      const startIndex = weekDateStrings.indexOf(segment.start)
      const endIndex = weekDateStrings.indexOf(segment.end)
      let lane = laneEnds.findIndex((laneEndIndex) => laneEndIndex < startIndex)

      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(endIndex)
      } else {
        laneEnds[lane] = endIndex
      }

      if (lane >= MAX_WEEK_ALL_DAY_LANES) {
        for (let index = startIndex; index <= endIndex; index += 1) {
          const dateStr = weekDateStrings[index]
          hiddenCountByDate.set(dateStr, (hiddenCountByDate.get(dateStr) || 0) + 1)
        }
        return
      }

      segments.push({
        event,
        lane,
        startIndex,
        endIndex,
        spanDays: endIndex - startIndex + 1,
        continuesBefore: range.start < weekStart,
        continuesAfter: range.end > weekEnd,
      })

      for (let index = startIndex; index <= endIndex; index += 1) {
        const dateStr = weekDateStrings[index]
        visibleLaneCountByDate.set(dateStr, Math.max(visibleLaneCountByDate.get(dateStr) || 0, lane + 1))
      }
    })

  return { segments, hiddenCountByDate, visibleLaneCountByDate }
}

function createDayEventBuckets(events, dayStrings) {
  const timedByDate = new Map(dayStrings.map((date) => [date, []]))
  const singleAllDayByDate = new Map(dayStrings.map((date) => [date, []]))
  const visibleDates = new Set(dayStrings)
  const visibleStart = dayStrings[0]
  const visibleEnd = dayStrings[dayStrings.length - 1]

  events.forEach((event) => {
    const range = getEventRange(event)
    if (!range.start || !range.end || range.end < visibleStart || range.start > visibleEnd) return

    if (isAllDay(event) && !isMultiDayAllDay(event)) {
      if (visibleDates.has(range.start)) {
        singleAllDayByDate.get(range.start)?.push(event)
      }
      return
    }

    if (!isAllDayOrMultiDay(event) && visibleDates.has(range.start)) {
      timedByDate.get(range.start)?.push(event)
    }
  })

  return { timedByDate, singleAllDayByDate }
}

export default function CalendarView({
  events,
  calendars,
  currentMonth,
  onMonthChange,
  onDayClick,
  onDayDoubleClick,
  selectedDate,
}) {
  const {
    firstDay,
    lastDay,
    rowCount,
    days,
    weeks,
    dayStrings,
  } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const rangeStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const weekCount = Math.ceil((getDay(monthStart) + monthEnd.getDate()) / 7)
    const rangeEnd = addDateFnsDays(rangeStart, weekCount * 7 - 1)
    const monthDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd })

    return {
      firstDay: monthStart,
      lastDay: monthEnd,
      rowCount: weekCount,
      days: monthDays,
      weeks: Array.from({ length: weekCount }, (_, rowIndex) => monthDays.slice(rowIndex * 7, rowIndex * 7 + 7)),
      dayStrings: monthDays.map((day) => format(day, 'yyyy-MM-dd')),
    }
  }, [currentMonth])
  const { timedByDate, singleAllDayByDate } = useMemo(
    () => createDayEventBuckets(events, dayStrings),
    [events, dayStrings],
  )
  const weekLayouts = useMemo(() => {
    return new Map(weeks.map((weekDays) => [
      format(weekDays[0], 'yyyy-MM-dd'),
      getWeekAllDayLayout(events, weekDays),
    ]))
  }, [events, weeks])
  const allDayLaneHeight = MAX_WEEK_ALL_DAY_LANES * WEEK_ALL_DAY_LANE_HEIGHT

  return (
    <section className={`flex w-full flex-1 flex-col overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm md:min-h-0 ${
      selectedDate ? 'min-h-[520px]' : 'h-full min-h-0'
    }`}>
      <div className="flex items-center justify-center gap-3 border-b border-[#92bdc0] bg-[#99ccff] px-4 py-3">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="rounded-full bg-[#f0f5ff] p-2 text-[#0044cc] hover:bg-[#cce0ff] active:bg-[#c9dfe1]"
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="w-32 text-center text-lg font-bold text-[#0044cc]">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="rounded-full bg-[#f0f5ff] p-2 text-[#0044cc] hover:bg-[#cce0ff] active:bg-[#c9dfe1]"
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b border-[#bbd5f5] bg-[#eef3ff]">
        {DAYS.map((day, index) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-semibold ${
              index === 0 ? 'text-[#ba7373]' : index === 6 ? 'text-[#4f7f91]' : 'text-[#4477cc]'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-white/90">
        {weeks.map((weekDays) => {
          const weekKey = format(weekDays[0], 'yyyy-MM-dd')
          const { segments, hiddenCountByDate, visibleLaneCountByDate } = weekLayouts.get(weekKey)

          return (
            <div key={weekKey} className="relative grid min-h-0 flex-1 grid-cols-7">
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isOutsideMonth = day < firstDay || day > lastDay
                const timedEvents = timedByDate.get(dateStr) || []
                const singleAllDayEvents = singleAllDayByDate.get(dateStr) || []
                const dayEventGroups = groupEventsByTime([...singleAllDayEvents, ...timedEvents])
                const hiddenAllDayCount = hiddenCountByDate.get(dateStr) || 0
                const reservedAllDayLaneCount = visibleLaneCountByDate.get(dateStr) || 0
                const reservedAllDayHeight = reservedAllDayLaneCount * WEEK_ALL_DAY_LANE_HEIGHT
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const today = isToday(day)
                const dayOfWeek = getDay(day)

                return (
                  <button
                    type="button"
                    key={dateStr}
                    onClick={() => onDayClick(day)}
                    onDoubleClick={() => onDayDoubleClick?.(day)}
                    className={`flex min-h-0 flex-col items-center overflow-hidden border-b border-r border-[#d5e8ff] p-1 text-left transition-colors sm:p-1.5 ${
                      isSelected
                        ? 'bg-[#e6f2f3]'
                        : isOutsideMonth
                          ? 'bg-[#f5f9ff]/75 text-[#8aa3c8] hover:bg-[#eef5ff]'
                          : 'bg-white/90 hover:bg-[#f0f5ff] active:bg-[#eaf1f2]'
                    }`}
                  >
                    <span
                      className={`mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold md:h-8 md:w-8 ${
                        today
                          ? 'bg-[#0044cc] text-white'
                          : isSelected
                            ? 'text-[#0044cc]'
                            : isOutsideMonth
                              ? 'text-[#8aa3c8]'
                              : dayOfWeek === 0
                                ? 'text-[#ba7373]'
                                : dayOfWeek === 6
                                  ? 'text-[#4f7f91]'
                                  : 'text-[#3355aa]'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    <div
                      className="flex w-full min-w-0 flex-col gap-1 overflow-hidden"
                      style={{ paddingTop: reservedAllDayHeight + (hiddenAllDayCount > 0 ? 12 : 2) }}
                    >
                      {hiddenAllDayCount > 0 && (
                        <div className="-mt-3 px-1 text-[10px] leading-tight text-[#5577bb]">
                          <span className="hidden sm:inline">종일 </span>+{hiddenAllDayCount}
                        </div>
                      )}

                      {dayEventGroups.slice(0, MAX_TIMED_GROUPS_PER_DAY).map((group) => {
                        const event = group.events[0]
                        const { className, style } = getEventStyle(event, calendars)
                        const isDone = group.events.every((item) => item.status === 'done')
                        const isHigh = group.events.some((item) => item.priority === 'high')
                        const suffix = group.events.length > 1 ? ` 외${group.events.length - 1}` : ''

                        return (
                          <div
                            key={`${dateStr}_${group.key}`}
                            className={`truncate rounded px-1.5 py-0.5 text-[10px] leading-tight text-white ${isDone ? 'line-through opacity-70' : ''} ${isHigh ? 'bg-[#e85252]' : className}`}
                            style={isHigh ? {} : style}
                          >
                            {group.time && <span className="hidden font-semibold sm:inline">{group.time} </span>}
                            {event.summary || '(제목 없음)'}{suffix}
                          </div>
                        )
                      })}
                      {dayEventGroups.length > MAX_TIMED_GROUPS_PER_DAY && (
                        <div className="px-1 text-[10px] text-[#5577bb]">
                          +{dayEventGroups.length - MAX_TIMED_GROUPS_PER_DAY}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}

              <div
                className="pointer-events-none absolute inset-x-0"
                style={{ top: 38, height: allDayLaneHeight }}
                aria-hidden="true"
              >
                {segments.map((segment) => {
                  const { event } = segment
                  const { className, style } = getEventStyle(event, calendars)
                  const isDone = event.status === 'done'
                  const isHigh = event.priority === 'high'
                  const left = `${(segment.startIndex / 7) * 100}%`
                  const width = `${(segment.spanDays / 7) * 100}%`

                  return (
                    <div
                      key={`${weekKey}_${event.id || event.summary}_${segment.startIndex}_${segment.lane}`}
                      className={`absolute overflow-hidden px-1 py-0.5 text-[10px] font-semibold leading-tight text-white ${segment.continuesBefore ? 'rounded-l-none' : 'rounded-l'} ${segment.continuesAfter ? 'rounded-r-none' : 'rounded-r'} ${isDone ? 'line-through opacity-70' : ''} ${isHigh ? 'bg-[#e85252]' : className}`}
                      style={{
                        ...(isHigh ? {} : style),
                        left: `calc(${left} + 3px)`,
                        width: `calc(${width} - 6px)`,
                        top: segment.lane * WEEK_ALL_DAY_LANE_HEIGHT,
                        height: WEEK_ALL_DAY_LANE_HEIGHT - 2,
                      }}
                      title={event.summary || '(제목 없음)'}
                    >
                      <span
                        className="calendar-flow-window block h-full overflow-hidden"
                        style={{ opacity: segment.continuesBefore || segment.continuesAfter ? 0.78 : 1 }}
                      >
                        <span
                          className="calendar-flow-track"
                          style={{ animationDuration: `${Math.max(5, segment.spanDays * 2)}s` }}
                        >
                          <span className="calendar-flow-copy">
                            {event.summary || '(제목 없음)'}
                          </span>
                          <span className="calendar-flow-copy" aria-hidden="true">
                            {event.summary || '(제목 없음)'}
                          </span>
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
