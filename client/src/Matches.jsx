import { useEffect, useState } from 'react'
import * as api from './api'

export default function Matches() {
  const [matches, setMatches] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getMatches().then(setMatches).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="notice notice--error">{error}</p>
  if (!matches) return <p className="notice">Loading…</p>
  if (!matches.length)
    return (
      <div className="empty">
        <div className="empty__icon">💌</div>
        <h2>No matches yet</h2>
        <p>Matches appear only when you both like each other.</p>
      </div>
    )

  return (
    <ul className="matches">
      {matches.map((m) => (
        <li key={m.id}>
          <img src={m.photo} alt="" />
          <div>
            <strong>
              {m.name}, {m.age}
            </strong>
            <span>{m.city}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
