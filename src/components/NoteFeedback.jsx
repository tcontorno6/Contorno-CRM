import { useEffect, useState } from 'react'
import { Sparkles, ThumbsUp, ArrowUpRight, Loader2 } from 'lucide-react'
import { getNoteFeedback } from '../utils/coaching'

// Coaching panel for a note. Calls the async wrapper so a real Claude API
// call can be dropped in later without changing this component.
export default function NoteFeedback({ text, lead }) {
  const [fb, setFb] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!text || !text.trim()) {
      setFb(null)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      getNoteFeedback(text, lead).then((res) => {
        if (active) {
          setFb(res)
          setLoading(false)
        }
      })
    }, 250)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [text, lead])

  if (!text || !text.trim()) {
    return (
      <div className="coach-empty">
        <Sparkles size={16} />
        <span>Write a note above and you'll get instant coaching here.</span>
      </div>
    )
  }

  if (loading || !fb) {
    return (
      <div className="coach-empty">
        <Loader2 size={16} className="spin" />
        <span>Reading your note…</span>
      </div>
    )
  }

  const tone = fb.score >= 75 ? 'good' : fb.score >= 50 ? 'ok' : 'low'

  return (
    <div className={`coach coach-${tone}`}>
      <div className="coach-head">
        <div className="coach-title">
          <Sparkles size={16} />
          <span>Claude's read</span>
        </div>
        <div className="coach-score">
          <div className="score-ring" style={{ '--v': `${fb.score}%` }}>
            <span>{fb.score}</span>
          </div>
          <span className="score-label">note quality</span>
        </div>
      </div>

      <p className="coach-summary">{fb.summary}</p>

      {fb.strengths.length > 0 && (
        <div className="coach-section">
          <h5><ThumbsUp size={13} /> What's working</h5>
          <ul>{fb.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}

      {fb.suggestions.length > 0 && (
        <div className="coach-section">
          <h5><ArrowUpRight size={13} /> To improve</h5>
          <ul>{fb.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  )
}
