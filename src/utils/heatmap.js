// Data shaping for the Activity Heatmap page.

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const TIME_BLOCKS = [
  { label: '7a', start: 7, end: 9 },
  { label: '9a', start: 9, end: 11 },
  { label: '11a', start: 11, end: 13 },
  { label: '1p', start: 13, end: 15 },
  { label: '3p', start: 15, end: 17 },
  { label: '5p', start: 17, end: 21 },
]

const dateKey = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Map a raw count to an intensity level 0..4 given the max in the data set.
export const levelFor = (count, max) => {
  if (count <= 0) return 0
  if (max <= 1) return 4
  const r = count / max
  if (r <= 0.25) return 1
  if (r <= 0.5) return 2
  if (r <= 0.75) return 3
  return 4
}

// GitHub-style contribution calendar of interactions per day.
export function buildCalendar(interactions, weeks = 27) {
  const counts = {}
  interactions.forEach((i) => {
    const k = dateKey(new Date(i.date))
    counts[k] = (counts[k] || 0) + 1
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // End on the Saturday of the current week so the last column is full.
  const end = new Date(today)
  end.setDate(today.getDate() + (6 - today.getDay()))
  // Start on a Sunday, `weeks` columns back.
  const start = new Date(end)
  start.setDate(end.getDate() - (weeks * 7 - 1))

  const cols = []
  const cur = new Date(start)
  let max = 0
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const k = dateKey(cur)
      const count = counts[k] || 0
      max = Math.max(max, count)
      col.push({ date: new Date(cur), key: k, count, future: cur > today })
      cur.setDate(cur.getDate() + 1)
    }
    cols.push(col)
  }

  const months = []
  cols.forEach((col, idx) => {
    const m = col[0].date.getMonth()
    if (idx === 0 || cols[idx - 1][0].date.getMonth() !== m) {
      months.push({ idx, label: col[0].date.toLocaleDateString('en-US', { month: 'short' }) })
    }
  })

  return { cols, months, max }
}

// Weekday (rows) x time-block (cols) matrix.
export function buildWeekdayBlocks(interactions) {
  const grid = Array.from({ length: 7 }, () => TIME_BLOCKS.map(() => 0))
  interactions.forEach((i) => {
    const d = new Date(i.date)
    const wd = d.getDay()
    const h = d.getHours()
    const bi = TIME_BLOCKS.findIndex((b) => h >= b.start && h < b.end)
    if (bi >= 0) grid[wd][bi] += 1
  })
  let max = 0
  grid.forEach((row) => row.forEach((c) => (max = Math.max(max, c))))
  return { grid, max }
}

export function activitySummary(interactions) {
  const total = interactions.length

  // Busiest weekday
  const byWeekday = Array(7).fill(0)
  const byBlock = TIME_BLOCKS.map(() => 0)
  interactions.forEach((i) => {
    const d = new Date(i.date)
    byWeekday[d.getDay()] += 1
    const bi = TIME_BLOCKS.findIndex((b) => d.getHours() >= b.start && d.getHours() < b.end)
    if (bi >= 0) byBlock[bi] += 1
  })
  const busiestDayIdx = byWeekday.indexOf(Math.max(...byWeekday))
  const busiestBlockIdx = byBlock.indexOf(Math.max(...byBlock))

  // Active days + current streak
  const days = new Set(interactions.map((i) => dateKey(new Date(i.date))))
  let streak = 0
  const cur = new Date()
  cur.setHours(0, 0, 0, 0)
  // allow streak to count from today or yesterday
  if (!days.has(dateKey(cur))) cur.setDate(cur.getDate() - 1)
  while (days.has(dateKey(cur))) {
    streak += 1
    cur.setDate(cur.getDate() - 1)
  }

  // Last 7 days count
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const last7 = interactions.filter((i) => new Date(i.date) >= weekAgo).length

  return {
    total,
    activeDays: days.size,
    streak,
    last7,
    busiestDay: total ? WEEKDAYS[busiestDayIdx] : '—',
    busiestBlock: total ? TIME_BLOCKS[busiestBlockIdx].label : '—',
  }
}
