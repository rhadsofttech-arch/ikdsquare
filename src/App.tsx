import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { StoreSetupModal } from './components/StoreSetupModal';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VendorDashboard } from './pages/VendorDashboard';
import { VendorProfilePage } from './pages/VendorProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserProfilePage } from './pages/UserProfilePage';

const MainLayout: React.FC = () => {
  const { currentPage } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-16 md:pb-0">
      <Header />
      <EmailVerificationBanner />

      <main className="flex-1">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'auth' && <AuthPage />}
        {currentPage === 'forgot-password' && <ForgotPasswordPage />}
        {currentPage === 'reset-password' && <ResetPasswordPage />}
        {currentPage === 'dashboard' && <VendorDashboard />}
        {currentPage === 'store' && <VendorProfilePage />}
        {currentPage === 'admin' && <AdminDashboard />}
        {(currentPage === 'profile' || currentPage === 'user-profile') && <UserProfilePage />}
      </main>

      <Footer />
      <BottomNav />
      <ToastContainer />
      <StoreSetupModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
