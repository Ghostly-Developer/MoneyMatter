import { Header } from './components/Header'
import { Footer } from './components/Footer'

function App() {
    return (
    <div className="app-shell">
      <Header />
      <main className="app-content">
        <h1>Welcome to the App</h1>
      </main>
      <Footer />
    </div>
    )
}

export default App
