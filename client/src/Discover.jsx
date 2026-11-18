import { useCallback, useEffect, useState } from 'react'
import * as api from './api'
import SwipeCard from './SwipeCard'
import Matches from './Matches'

export default function Discover() {
  const [view, setView] = useState('swipe') // 'swipe' | 'matches'
  const [queue, setQueue] = useState(null)
  const [exit, setExit] = useState(null) // 'like' | 'pass' while top card animates out
  const [matched, setMatched] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.getFeed().then(setQueue).catch((e) => setError(e.message))
  }, [])

  const top = queue?.[0]

  // Called once the fly-off animation ends (or immediately on a drag release, which sets exit itself).
  const commit = useCallback(
    async (action, animated) => {
      if (!top || busy) return
      if (!animated) {
        setExit(action) // let the card animate out; onSwipe fires again with animated=true
        return
      }
      setBusy(true)
      try {
        const res = await api.swipe(top.id, action)
        if (res.matched) setMatched(res.profile)
        setQueue((q) => q.filter((p) => p.id !== top.id))
      } catch (e) {
        setError(e.message)
      } finally {
        setExit(null)
        setBusy(false)
      }
    },
    [top, busy]
  )

  const trigger = (action) => !exit && !busy && top && setExit(action)

  useEffect(() => {
    const onKey = (e) => {
      if (matched || view !== 'swipe') return
      if (e.key === 'ArrowRight') trigger('like')
      if (e.key === 'ArrowLeft') trigger('pass')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <section className="discover">
      <header className="seg" role="tablist">
        <button role="tab" aria-selected={view === 'swipe'} onClick={() => setView('swipe')}>
          Swipe
        </button>
        <button role="tab" aria-selected={view === 'matches'} onClick={() => setView('matches')}>
          Matches
        </button>
      </header>

      {view === 'matches' ? (
        <Matches />
      ) : (
        <>
          <div className="stack">
            {error && <p className="notice notice--error">{error}</p>}
            {!queue && !error && <p className="notice">Loading…</p>}
            {queue && !top && (
              <div className="empty">
                <div className="empty__icon">✨</div>
                <h2>You're all caught up</h2>
                <p>No more profiles for now. Check your matches or come back later.</p>
                <button className="btn" onClick={() => setView('matches')}>
                  View matches
                </button>
              </div>
            )}
            {queue?.[1] && <SwipeCard key={queue[1].id} profile={queue[1]} stacked />}
            {top && <SwipeCard key={top.id} profile={top} exit={exit} onSwipe={commit} />}
          </div>

          <div className="actions">
            <button className="round round--pass" aria-label="Pass" disabled={!top || !!exit} onClick={() => trigger('pass')}>
              ✕
            </button>
            <button className="round round--like" aria-label="Like" disabled={!top || !!exit} onClick={() => trigger('like')}>
              ♥
            </button>
          </div>
        </>
      )}

      {matched && (
        <div className="match" role="dialog" aria-modal="true" aria-label="It's a match">
          <h1>It's a match!</h1>
          <p>You and {matched.name} liked each other.</p>
          <img src={matched.photo} alt={matched.name} />
          <button className="btn" onClick={() => setMatched(null)}>
            Keep swiping
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              setMatched(null)
              setView('matches')
            }}
          >
            See matches
          </button>
        </div>
      )}
    </section>
  )
}
