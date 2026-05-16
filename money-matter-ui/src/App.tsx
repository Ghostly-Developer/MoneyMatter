import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PageHeader } from './components/PageHeader';
import { NetWorthCard } from './components/NetWorthCard';
import { SpendingVelocityCard } from './components/SpendingVelocityCard';
import { AssetAllocationCard } from './components/AssetAllocationCard';
import { QuickInsightsCard } from './components/QuickInsightsCard';
import { PerformanceCard } from './components/PerformanceCard';
import { TransactionTable } from './components/TransactionTable';
import { Footer } from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="dark">
      <Header />
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="md:ml-64 pt-24 pb-20 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 md:px-[40px]">
          {/* Page Header */}
          <PageHeader />
          
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-[16px]">
            {/* Net Worth Snapshot */}
            <NetWorthCard />
            
            {/* Spending Velocity Tracker */}
            <SpendingVelocityCard />
            
            {/* Multi-Asset Allocation */}
            <AssetAllocationCard />
            
            {/* Quick Insights Card */}
            <QuickInsightsCard />
            
            {/* Performance Card */}
            <PerformanceCard />
            
            {/* Transaction Feed */}
            <TransactionTable />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;

