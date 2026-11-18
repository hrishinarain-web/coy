import { useRef, useState } from 'react'

const THRESHOLD = 110 // px of horizontal drag that commits a swipe

/**
 * One draggable profile card. Pointer events cover touch + mouse.
 * `onSwipe(action)` fires after the fly-off animation; `exit` lets the parent
 * trigger the same animation from the buttons / keyboard.
 */
export default function SwipeCard({ profile, exit, onSwipe, stacked }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false })
  const start = useRef(null)

  const dir = exit ? (exit === 'like' ? 1 : -1) : 0
  const x = dir ? dir * 700 : drag.x
  const rotate = dir ? dir * 25 : drag.x / 18
  const intent = dir ? exit : drag.x > 40 ? 'like' : drag.x < -40 ? 'pass' : null
  const strength = Math.min(1, Math.abs(drag.x) / THRESHOLD)

  const down = (e) => {
    if (stacked || exit) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
    setDrag({ x: 0, y: 0, active: true })
  }
  const move = (e) => {
    if (!start.current) return
    setDrag({ x: e.clientX - start.current.x, y: (e.clientY - start.current.y) * 0.3, active: true })
  }
  const up = () => {
    if (!start.current) return
    start.current = null
    if (Math.abs(drag.x) > THRESHOLD) onSwipe(drag.x > 0 ? 'like' : 'pass')
    else setDrag({ x: 0, y: 0, active: false })
  }

  return (
    <article
      className={`card${stacked ? ' card--stacked' : ''}${drag.active ? ' card--dragging' : ''}`}
      style={
        stacked
          ? undefined
          : { transform: `translate(${x}px, ${drag.y}px) rotate(${rotate}deg)`, opacity: dir ? 0 : 1 }
      }
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onTransitionEnd={(e) => {
        if (exit && e.propertyName === 'transform') onSwipe(exit, true)
      }}
      aria-label={`${profile.name}, ${profile.age}`}
    >
      <img src={profile.photo} alt="" draggable={false} />
      <div className="card__shade" />
      {!stacked && (
        <>
          <span className="stamp stamp--like" style={{ opacity: intent === 'like' ? (dir ? 1 : strength) : 0 }}>
            LIKE
          </span>
          <span className="stamp stamp--pass" style={{ opacity: intent === 'pass' ? (dir ? 1 : strength) : 0 }}>
            PASS
          </span>
        </>
      )}
      <div className="card__info">
        <h2>
          {profile.name}, <span>{profile.age}</span>
        </h2>
        <p className="card__city">{profile.city}</p>
        <p className="card__bio">{profile.bio}</p>
        <ul className="chips">
          {profile.interests.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}
