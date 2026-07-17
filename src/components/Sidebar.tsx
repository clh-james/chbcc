// src/components/Sidebar.tsx
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Users,
  UserCog,
  Package,
  Scissors,
  Star,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Building2,
  Settings,
} from "lucide-react";
import { useApp, Page } from "../context/AppContext";

const navItems: Array<{
  id: Page;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "pos", label: "POS & Billing", icon: CreditCard },
  { id: "customers", label: "Customers", icon: Users },
  { id: "staff", label: "Staff", icon: UserCog },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "services", label: "Services", icon: Scissors },
  { id: "memberships", label: "Memberships", icon: Star },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "branches", label: "Branches", icon: Building2 },
  { id: "settings", label: "Settings", icon: Settings },
];

function NavItems({ isMobile }: { isMobile: boolean }) {
  const {
    currentPage,
    setCurrentPage,
    sidebarOpen,
    setSidebarOpen,
    isDarkMode,
    canAccess,
    userRole,
  } = useApp();

  const accessibleItems = userRole
    ? navItems.filter((item) => canAccess(item.id))
    : navItems;

  return (
    <>
      {/* Logo Section - Now inside nav for proper scrolling/positioning */}
      <div className="flex flex-col items-center justify-center py-6 px-4 mb-2">
        <div className={`${sidebarOpen ? "w-48 h-auto" : "w-10 h-10"} mx-auto transition-all duration-300`}>
          <img
            src="/logo.png"
            alt="Chloe House Of Beauty"
            className="w-full h-full object-contain"
          />
        </div>
        {sidebarOpen && (
          <p className={`mt-2 text-xs font-bold tracking-wider uppercase ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Gluta Spa & Wellness
          </p>
        )}
      </div>

      {/* Navigation Items */}
      <div className="space-y-1 px-3">
        {accessibleItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
              title={!sidebarOpen ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative ${
                active
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20"
                  : isDarkMode
                  ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              
              {/* Tooltip for collapsed state */}
              {!sidebarOpen && !isMobile && (
                <div
                  className={`absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg ${
                    isDarkMode ? "bg-gray-800 text-white border border-gray-700" : "bg-gray-900 text-white"
                  }`}
                >
                  {item.label}
                  {/* Tooltip Arrow */}
                  <div className={`absolute top-1/2 -left-1 -mt-1 w-2 h-2 rotate-45 ${isDarkMode ? "bg-gray-800 border-l border-b border-gray-700" : "bg-gray-900"}`} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Indicator (Only when expanded) */}
      {sidebarOpen && userRole && (
        <div className={`mt-auto pt-6 pb-4 px-6 text-xs font-medium ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
          Signed in as <span className="capitalize text-rose-500 font-bold">{userRole}</span>
        </div>
      )}
    </>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, isDarkMode } = useApp();

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 z-40 flex-col transition-all duration-300 ease-in-out hidden lg:flex ${
          sidebarOpen ? "w-64" : "w-20"
        } ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-r shadow-xl`}
        style={{ top: "70px", height: "calc(100vh - 70px)" }} // ✅ KEY FIX: Starts below header
      >
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
          <NavItems isMobile={false} />
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        } border-r shadow-2xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Mobile Header Close Button */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Menu</span>
          <button 
            onClick={() => setSidebarOpen(false)}
            className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
          >
            ✕
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-2">
          <NavItems isMobile={true} />
        </nav>
      </aside>
    </>
  );
}