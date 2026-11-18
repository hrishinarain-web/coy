async function request(path, opts) {
  const res = await fetch(`/api${path}`, {
    headers: { 'content-type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export const getFeed = () => request('/feed').then((d) => d.profiles)
export const getMatches = () => request('/matches').then((d) => d.matches)
export const swipe = (profileId, action) =>
  request('/swipe', { method: 'POST', body: JSON.stringify({ profileId, action }) })
