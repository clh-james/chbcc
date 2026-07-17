import type { ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { user, userRole, loading, isDarkMode: isDark } = useApp();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRole) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
        <div className={`rounded-2xl border p-8 text-center max-w-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Authentication Required</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
        <div className={`rounded-2xl border p-8 text-center max-w-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Access Denied</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>You don't have permission to view this page. Your role is: <span className="font-medium capitalize">{userRole}</span></p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
