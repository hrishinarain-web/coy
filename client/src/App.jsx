import { useState } from 'react'
import Discover from './Discover'

export default function App() {
  const [tab, setTab] = useState('discover')
  return (
    <div className="app">
      <main>
        {/* Home stays blank by design; Discover is mounted only while active, so it refetches on return. */}
        {tab === 'discover' && <Discover />}
      </main>
      <nav className="tabbar">
        <button aria-current={tab === 'home'} onClick={() => setTab('home')}>
          <span>⌂</span>Home
        </button>
        <button aria-current={tab === 'discover'} onClick={() => setTab('discover')}>
          <span>♥</span>Discover
        </button>
      </nav>
    </div>
  )
}
