// src/layouts/AdminLayout.tsx
import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="pt-[90px] ml-[250px] p-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;