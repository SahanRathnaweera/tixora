import { Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import SiteBackground from './components/SiteBackground';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminVerifyPage from './pages/AdminVerifyPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteBackground />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminVerifyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute adminOnly>
                <AdminEventsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}