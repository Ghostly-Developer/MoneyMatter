// Lets the UI run against local mock data instead of the Go backend by
// appending `?mock=true` to the app URL - useful for frontend-only work
// (e.g. `npm run dev` in a browser, without `wails dev`) when a backend
// function isn't available yet.
export function isMockMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('mock') === 'true'
}
