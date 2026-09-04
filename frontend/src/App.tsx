import { Header, getSystemTheme } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { ChatButton } from './components/ChatButton'
import { ChatPopup } from './components/ChatPopup'
import { SettingsModal, type BaseCurrency, type ThemeMode } from './components/SettingsModal'
import { SupportModal } from './components/SupportModal'
import { IncomePage } from './pages/income/IncomePage'
import type { AccentColor } from './constants/accentColors'
import { useEffect, useState } from 'react'

interface Profile {
  id: string;
  name: string;
  avatar: string;
  color?: string;
}

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [currentProfile, setCurrentProfile] = useState<Profile>({
    id: '1',
    name: 'Primary Account',
    avatar: 'P',
  })
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => getSystemTheme())
  const theme = themeMode === 'system' ? systemTheme : themeMode
  const [accent, setAccent] = useState<AccentColor>('green')
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>('INR')
  const [dataDirectory, setDataDirectory] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemTheme(mql.matches ? 'dark' : 'light')
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const [profiles, setProfiles] = useState<Profile[]>([
    { id: '1', name: 'Primary Account', avatar: 'P' },
    { id: '2', name: 'Joint Account', avatar: 'J' },
    { id: '3', name: 'Business Account', avatar: 'B' },
  ])

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setThemeMode(newTheme)
  }

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: currentProfile,
      settings: { baseCurrency, themeMode, accent },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'moneymatter-export.json'
    link.click()
    URL.revokeObjectURL(url)
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
        onSelectProfile={setCurrentProfile}
        onEditProfile={(p) => {
          setProfiles((prev) => prev.map((existing) => (existing.id === p.id ? p : existing)))
          setCurrentProfile((prev) => (prev.id === p.id ? p : prev))
        }}
        onAddProfile={(p) => setProfiles((prev) => [...prev, p])}
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
          <IncomePage theme={theme} accent={accent} />
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
        onAccentChange={setAccent}
        baseCurrency={baseCurrency}
        onBaseCurrencyChange={setBaseCurrency}
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
        dataDirectory={dataDirectory}
        onSelectDataDirectory={setDataDirectory}
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
