// src/App.tsx
import { AppProvider, useApp } from './context/AppContext'; // ✅ Removed unused useState import
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import POS from './pages/POS';
import Customers from './pages/Customers';
import StaffManagement from './pages/StaffManagement';
import Inventory from './pages/Inventory';
import Memberships from './pages/Memberships';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import SMS from './pages/SMS';
import Branches from './pages/Branches';
import Services from './pages/Services';
import Settings from './pages/Settings';
import SignIn from './pages/SignIn';

function AppContent() {
  const { currentPage, isDarkMode, sidebarOpen, user, loading } = useApp();

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-950' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'appointments': return <Appointments />;
      case 'pos': return <POS />;
      case 'customers': return <Customers />;
      case 'staff': return <StaffManagement />;
      case 'inventory': return <Inventory />;
      case 'services': return <Services />;
      case 'memberships': return <Memberships />;
      case 'reports': return <Reports />;
      case 'analytics': return <Analytics />;
      case 'sms': return <SMS />;
      case 'branches': return <Branches />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {/* Fixed Header - Always on top */}
      <Header />
      
      {/* Sidebar - Positioned below header via its own CSS */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 ease-in-out min-h-screen
          pt-[70px] 
          ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'} 
          pl-0`}
      >
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}