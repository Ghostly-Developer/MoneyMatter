import { profile } from '../../wailsjs/go/models'

// Stand-in for the `ListProfiles` backend response, used when `isMockMode()`
// is on. Shapes match `profiles` table columns in internal/profile/store.go.
export const MOCK_PROFILES: profile.Profile[] = [
  new profile.Profile({
    id: 'mock-guest',
    name: 'Guest',
    color: '#10b981',
    currency: 'INR',
    baseTheme: 'system',
    themeColor: 'green',
    isAdmin: true,
    notifications: [],
  }),
  new profile.Profile({
    id: 'mock-alex',
    name: 'Alex',
    color: '#6366f1',
    currency: 'USD',
    baseTheme: 'dark',
    themeColor: 'violet',
    isAdmin: false,
    notifications: [],
  }),
]
