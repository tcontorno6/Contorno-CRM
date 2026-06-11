import { Fragment } from 'react'
import { Activity, Flame, CalendarDays, Clock, TrendingUp } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { PageHeader } from '../components/ui'
import {
  WEEKDAYS, TIME_BLOCKS, levelFor,
  buildCalendar, buildWeekdayBlocks, activitySummary,
} from '../utils/heatmap'

export default function Heatmap() {
  const { interactions } = useStore()
  const cal = buildCalendar(interactions, 27)
  const wb = buildWeekdayBlocks(interactions)
  const sum = activitySummary(interactions)

  return (
    <div className="page">
      <PageHeader
        title="Activity Heatmap"
        subtitle="Your outreach rhythm — when you're consistent, and when you go quiet."
      />

      <div className="hm-stats">
        <HmStat icon={Activity} label="Total interactions" value={sum.total} />
        <HmStat icon={TrendingUp} label="Last 7 days" value={sum.last7} accent="#2563eb" />
        <HmStat icon={Flame} label="Current streak" value={`${sum.streak} day${sum.streak === 1 ? '' : 's'}`} accent="#f59e0b" />
        <HmStat icon={CalendarDays} label="Busiest day" value={sum.busiestDay} accent="#16a34a" />
        <HmStat icon={Clock} label="Peak time" value={sum.busiestBlock} accent="#8b5cf6" />
      </div>

      <div className="card">
        <div className="card-head">
          <h3><CalendarDays size={16} /> Activity calendar</h3>
          <Legend />
        </div>
        <div className="cal-scroll">
          <div className="cal">
            <div className="cal-weekdays">
              {WEEKDAYS.map((d, i) => (
                <span key={d} className="cal-wd">{i % 2 === 1 ? d : ''}</span>
              ))}
            </div>
            <div className="cal-grid-wrap">
              <div className="cal-months">
                {cal.cols.map((_, idx) => {
                  const m = cal.months.find((mm) => mm.idx === idx)
                  return <span key={idx} className="cal-month">{m ? m.label : ''}</span>
                })}
              </div>
              <div className="cal-cols">
                {cal.cols.map((col, ci) => (
                  <div key={ci} className="cal-col">
                    {col.map((cell) => (
                      <span
                        key={cell.key}
                        className={`cal-cell ${cell.future ? 'lv-future' : `lv-${levelFor(cell.count, cal.max)}`}`}
                        title={
                          cell.future
                            ? ''
                            : `${cell.count} interaction${cell.count === 1 ? '' : 's'} · ${cell.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
                        }
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3><Clock size={16} /> When you connect — by day & time</h3>
          <Legend />
        </div>
        <div className="wb-scroll">
          <div className="wb">
            <div className="wb-corner" />
            {TIME_BLOCKS.map((b) => (
              <div key={b.label} className="wb-col-label">{b.label}</div>
            ))}
            {WEEKDAYS.map((d, wd) => (
              <Fragment key={d}>
                <div className="wb-row-label">{d}</div>
                {wb.grid[wd].map((c, ci) => (
                  <div
                    key={ci}
                    className={`wb-cell lv-${levelFor(c, wb.max)}`}
                    title={`${c} interaction${c === 1 ? '' : 's'} · ${d} ${TIME_BLOCKS[ci].label}`}
                  >
                    {c > 0 ? c : ''}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
        <p className="hm-hint">
          Use this to protect your best outreach windows. Quiet rows or columns are easy wins —
          block recurring time there to keep your pipeline fed.
        </p>
      </div>
    </div>
  )
}

function HmStat({ icon: Icon, label, value, accent }) {
  return (
    <div className="hm-stat">
      <span className="hm-stat-icon" style={accent ? { background: `${accent}1a`, color: accent } : undefined}>
        <Icon size={16} />
      </span>
      <div>
        <div className="hm-stat-value">{value}</div>
        <div className="hm-stat-label">{label}</div>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="hm-legend">
      <span>Less</span>
      {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`legend-cell lv-${l}`} />)}
      <span>More</span>
    </div>
  )
}
