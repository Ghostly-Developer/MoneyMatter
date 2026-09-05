import { Header, getSystemTheme } from './components/Header'
import type { Profile } from './components/ProfileModal'
import { Sidebar } from './components/Sidebar'
import { ChatButton } from './components/ChatButton'
import { ChatPopup } from './components/ChatPopup'
import { SettingsModal, type BaseCurrency, type ThemeMode } from './components/SettingsModal'
import { SupportModal } from './components/SupportModal'
import { IncomePage } from './pages/income/IncomePage'
import type { AccentColor } from './constants/accentColors'
import { useEffect, useMemo, useState } from 'react'
import { CreateProfile, DeleteProfile, ExportProfileData, ListProfiles, RenameProfile, UpdateProfile } from '../wailsjs/go/main/App'
import { profile } from '../wailsjs/go/models'
import { isMockMode } from './utils/mock'
import { MOCK_PROFILES } from './mocks/profiles'

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark']
const ACCENT_COLORS: AccentColor[] = ['green', 'violet', 'orange']
const BASE_CURRENCIES: BaseCurrency[] = ['INR', 'EUR', 'USD']

function isThemeMode(v: string): v is ThemeMode {
  return (THEME_MODES as string[]).includes(v)
}
function isAccentColor(v: string): v is AccentColor {
  return (ACCENT_COLORS as string[]).includes(v)
}
function isBaseCurrency(v: string): v is BaseCurrency {
  return (BASE_CURRENCIES as string[]).includes(v)
}

// Placeholder shown for the brief moment before the real profile list has
// loaded from the backend (`ListProfiles`) - every fresh install already has
// a seeded "guest" profile, so this resolves almost immediately.
const PLACEHOLDER_PROFILE = new profile.Profile({ id: '', name: 'Loading…', color: '' })

function toDisplayProfile(p: profile.Profile): Profile {
  return {
    id: p.id,
    name: p.name,
    avatar: (p.name.trim().charAt(0) || '?').toUpperCase(),
    color: p.color || undefined,
  }
}

const TAB_STORAGE_KEY = 'moneymatter.currentTab'

function App() {
  const [currentTab, setCurrentTabState] = useState(
    () => (typeof window !== 'undefined' && window.localStorage.getItem(TAB_STORAGE_KEY)) || 'dashboard'
  )
  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab)
    try {
      window.localStorage.setItem(TAB_STORAGE_KEY, tab)
    } catch {
      // localStorage unavailable (e.g. private mode) - tab just won't survive a refresh
    }
  }
  const [rawProfiles, setRawProfiles] = useState<profile.Profile[]>([])
  const [currentProfileId, setCurrentProfileId] = useState('')
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => getSystemTheme())
  const theme = themeMode === 'system' ? systemTheme : themeMode
  const [accent, setAccent] = useState<AccentColor>('green')
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>('INR')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const currentProfileRaw = useMemo(
    () => rawProfiles.find((p) => p.id === currentProfileId) ?? rawProfiles[0] ?? PLACEHOLDER_PROFILE,
    [rawProfiles, currentProfileId]
  )
  const currentProfile = useMemo(() => toDisplayProfile(currentProfileRaw), [currentProfileRaw])
  const profiles = useMemo(() => rawProfiles.map(toDisplayProfile), [rawProfiles])

  // Load every known profile from the local SQLite store on startup and
  // default to whichever one is marked admin (the seeded "guest" profile
  // starts out admin, see internal/profile/store.go).
  useEffect(() => {
    if (isMockMode()) {
      setRawProfiles(MOCK_PROFILES)
      setCurrentProfileId((MOCK_PROFILES.find((p) => p.isAdmin) ?? MOCK_PROFILES[0]).id)
      return
    }
    let cancelled = false
    ListProfiles()
      .then((list) => {
        if (cancelled || list.length === 0) return
        setRawProfiles(list)
        setCurrentProfileId((list.find((p) => p.isAdmin) ?? list[0]).id)
      })
      .catch((err) => console.error('Failed to load profiles:', err))
    return () => {
      cancelled = true
    }
  }, [])

  // Base currency/theme/accent are stored per-profile (`profiles.currency`/
  // `base_theme`/`theme_color`) - adopt them whenever the active profile
  // changes (including the initial load above).
  useEffect(() => {
    if (!currentProfileRaw.id) return
    if (isThemeMode(currentProfileRaw.baseTheme)) setThemeMode(currentProfileRaw.baseTheme)
    if (isAccentColor(currentProfileRaw.themeColor)) setAccent(currentProfileRaw.themeColor)
    if (isBaseCurrency(currentProfileRaw.currency)) setBaseCurrency(currentProfileRaw.currency)
  }, [currentProfileRaw.id, currentProfileRaw.baseTheme, currentProfileRaw.themeColor, currentProfileRaw.currency])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemTheme(mql.matches ? 'dark' : 'light')
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  // Persists a settings change (theme/accent/currency) onto the active
  // profile's DB row. Fire-and-forget from the UI's perspective - these
  // controls already update their own local state immediately.
  const persistProfilePatch = (patch: Partial<Pick<profile.Profile, 'currency' | 'baseTheme' | 'themeColor'>>) => {
    if (!currentProfileRaw.id) return
    const merged = new profile.Profile({ ...currentProfileRaw, ...patch })
    if (isMockMode()) {
      setRawProfiles((prev) => prev.map((p) => (p.id === merged.id ? merged : p)))
      return
    }
    UpdateProfile(merged)
      .then((updated) => setRawProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p))))
      .catch((err) => console.error('Failed to save profile settings:', err))
  }

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode)
    persistProfilePatch({ baseTheme: mode })
  }
  const handleThemeChange = (newTheme: 'dark' | 'light') => handleThemeModeChange(newTheme)
  const handleAccentChange = (newAccent: AccentColor) => {
    setAccent(newAccent)
    persistProfilePatch({ themeColor: newAccent })
  }
  const handleBaseCurrencyChange = (currency: BaseCurrency) => {
    setBaseCurrency(currency)
    persistProfilePatch({ currency })
  }

  const handleAddProfile = async (p: Profile) => {
    const draft = new profile.Profile({
      name: p.name,
      color: p.color ?? '',
      currency: baseCurrency,
      baseTheme: themeMode,
      themeColor: accent,
      isAdmin: false,
      notifications: [],
    })
    const created = isMockMode() ? new profile.Profile({ ...draft, id: `mock-${Date.now()}` }) : await CreateProfile(draft)
    setRawProfiles((prev) => [...prev, created])
  }

  const handleEditProfile = async (p: Profile) => {
    const raw = rawProfiles.find((r) => r.id === p.id)
    if (!raw) return
    let updated: profile.Profile
    if (isMockMode()) {
      updated = new profile.Profile({ ...raw, name: p.name, color: p.color ?? '' })
    } else {
      updated = raw.name !== p.name ? await RenameProfile(raw.id, p.name) : raw
      updated = await UpdateProfile(new profile.Profile({ ...updated, color: p.color ?? '' }))
    }
    setRawProfiles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  const handleDeleteProfile = async (p: Profile) => {
    if (isMockMode()) {
      if (p.name === 'Guest') throw new Error('Cannot delete the guest profile')
      if (rawProfiles.length <= 1) throw new Error('Cannot delete the only profile')
    } else {
      await DeleteProfile(p.id)
    }
    const next = rawProfiles.filter((r) => r.id !== p.id)
    setRawProfiles(next)
    if (currentProfileId === p.id) {
      setCurrentProfileId((next.find((r) => r.isAdmin) ?? next[0])?.id ?? '')
    }
  }

  const handleExportData = () => {
    if (!currentProfileRaw.id) return
    if (isMockMode()) {
      console.log('Mock mode: skipping export for', currentProfileRaw.name)
      return
    }
    ExportProfileData(currentProfileRaw.id)
      .then(({ filename, data }) => {
        const blob = new Blob([new Uint8Array(data)], { type: 'application/zip' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      })
      .catch((err) => console.error('Failed to export profile data:', err))
  }

  return (
    <div className={`app-shell min-h-screen ${theme === 'dark' ? 'bg-[#0e0e0e] text-white' : 'bg-white text-[#0b1c30]'}`}>
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSupport={() => setSupportOpen(true)}
        theme={theme}
        accent={accent}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <Header
        currentProfile={currentProfile}
        profiles={profiles}
        onSelectProfile={(p) => setCurrentProfileId(p.id)}
        onEditProfile={handleEditProfile}
        onAddProfile={handleAddProfile}
        onDeleteProfile={handleDeleteProfile}
        onOpenSearch={() => console.log('Open search')}
        onOpenAddTransaction={() => console.log('Open add transaction')}
        onOpenAlerts={() => console.log('Open alerts')}
        hasAlerts={true}
        theme={theme}
        onThemeChange={handleThemeChange}
        accent={accent}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main className={`app-content pt-20 md:pt-20 p-6 transition-all duration-200 ${
        sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
      } ${theme === 'dark' ? 'bg-[#0f0f14]' : 'bg-[#f5f5fa]'}`}>
        {currentTab === 'income' ? (
          <IncomePage theme={theme} accent={accent} currency={baseCurrency} profileId={currentProfileRaw.id} />
        ) : (
          <>
            <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-[#0b1c30]'}`}>
              Welcome to MoneyMatter
            </h1>
            <p className={theme === 'dark' ? 'text-[#c7c4d7]' : 'text-[#464554]'}>
              Current Tab: {currentTab}
            </p>
            <p className={theme === 'dark' ? 'text-[#c7c4d7]' : 'text-[#464554]'}>
              Current Profile: {currentProfile.name}
            </p>
            <p className={theme === 'dark' ? 'text-[#c7c4d7]' : 'text-[#464554]'}>
              Current Theme: {theme}
            </p>
          </>
        )}
      </main>
      {!chatOpen && <ChatButton theme={theme} accent={accent} onClick={() => setChatOpen(true)} />}
      <ChatPopup isOpen={chatOpen} onClose={() => setChatOpen(false)} theme={theme} accent={accent} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        accent={accent}
        onAccentChange={handleAccentChange}
        baseCurrency={baseCurrency}
        onBaseCurrencyChange={handleBaseCurrencyChange}
        themeMode={themeMode}
        onThemeModeChange={handleThemeModeChange}
        onExportData={handleExportData}
      />
      <SupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        theme={theme}
        accent={accent}
      />
    </div>
  )
}

export default App
