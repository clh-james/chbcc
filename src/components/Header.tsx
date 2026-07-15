// src/components/Header.tsx
import { useState } from "react";
import { useApp } from "../context/AppContext"; // ✅ No react-router imports needed
import {
  Bell,
  Moon,
  Sun,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";

export default function Header() {
  const {
    user,
    isDarkMode,
    toggleDarkMode,
    sidebarOpen,
    setSidebarOpen,
    userRole,
    canAccess,
    signOut,
    setCurrentPage, // ✅ This is already in your AppContext!
  } = useApp();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await signOut();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign out";
      console.error(errorMessage);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between px-4 lg:px-6">
      
      {/* LEFT: Hamburger Menu */}
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* RIGHT: Actions & Profile */}
      <div className="flex items-center gap-2">
        
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm dark:text-white">Notifications</h3>
              </div>
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold dark:text-white leading-tight">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                {userRole || "Staff"}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden md:block" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium dark:text-white truncate">{user?.email}</p>
                <p className="text-xs text-rose-500 mt-0.5">{userRole}</p>
              </div>

              <div className="py-1">
                {/* ✅ FIXED: Use button + setCurrentPage instead of <Link> */}
                {canAccess("settings") && (
                  <button
                    onClick={() => {
                      setCurrentPage("settings"); // ✅ Updates state → renders Settings page
                      setShowDropdown(false);     // ✅ Closes dropdown
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Settings size={16} />
                    Account Settings
                  </button>
                )}

                <button
                  onClick={(e) => {
                    handleSignOut(e);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}