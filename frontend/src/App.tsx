import { Header, getSystemTheme } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { ChatButton } from './components/ChatButton'
import { IncomePage } from './pages/income/IncomePage'
import { useState } from 'react'

interface Profile {
  id: string;
  name: string;
  avatar: string;
}

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [currentProfile, setCurrentProfile] = useState<Profile>({
    id: '1',
    name: 'Primary Account',
    avatar: 'P',
  })
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getSystemTheme())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const profiles: Profile[] = [
    { id: '1', name: 'Primary Account', avatar: 'P' },
    { id: '2', name: 'Joint Account', avatar: 'J' },
    { id: '3', name: 'Business Account', avatar: 'B' },
  ]

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
  }

  return (
    <div className={`app-shell min-h-screen ${theme === 'dark' ? 'bg-[#0e0e0e] text-white' : 'bg-white text-[#0b1c30]'}`}>
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => console.log('Open settings')}
        onOpenSupport={() => console.log('Open support')}
        theme={theme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <Header
        currentProfile={currentProfile}
        profiles={profiles}
        onSelectProfile={setCurrentProfile}
        onEditProfile={(p) => console.log('Edit financial entity', p)}
        onOpenSearch={() => console.log('Open search')}
        onOpenAddTransaction={() => console.log('Open add transaction')}
        onOpenAlerts={() => console.log('Open alerts')}
        hasAlerts={true}
        theme={theme}
        onThemeChange={handleThemeChange}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main className={`app-content pt-20 md:pt-20 p-6 transition-all duration-200 ${
        sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
      } ${theme === 'dark' ? 'bg-[#0f0f14]' : 'bg-[#f5f5fa]'}`}>
        {currentTab === 'income' ? (
          <IncomePage theme={theme} />
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
      <ChatButton theme={theme} onClick={() => console.log('Open AI chat')} />
    </div>
  )
}

export default App
