import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from 'react-router-dom';
import {
  Menu,
  LogOut,
  Home,
  BookOpen,
  Users,
  MessageSquare,
  TrendingUp,
  Settings,
  Bell,
  Calendar,
  CreditCard,
  BarChart3,
  FileText,
  MessageCircle,
} from 'lucide-react';
import './App.css';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BookingPage from './pages/BookingPage';
import PaymentsPage from './pages/PaymentsPage';
import MessagesPage from './pages/MessagesPage';
import ProgressPage from './pages/ProgressPage';
import QuizPage from './pages/QuizPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Role Switcher Component (for testing)
const RoleSwitcher: React.FC = () => {
  const { user, login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || user.role !== 'ADMIN') return null;

  const switchRole = async (email: string, password: string) => {
    try {
      await login(email, password);
      setIsOpen(false);
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition"
      >
        Switch View
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-2 space-y-1">
            <button
              onClick={() => switchRole('lesego@drivemate.co.za', 'Admin@123')}
              className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg text-sm"
            >
              Admin View
            </button>
            <button
              onClick={() => switchRole('sipho.khumalo@drivemate.co.za', 'Instructor@123')}
              className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg text-sm"
            >
              Instructor View
            </button>
            <button
              onClick={() => switchRole('thando.zungu@example.co.za', 'Student@123')}
              className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg text-sm"
            >
              Student View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Navigation Component
const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const menuItems = [
    ...(user.role === 'STUDENT'
      ? [
          { path: '/', label: 'Dashboard', icon: Home },
          { path: '/bookings', label: 'Book Lesson', icon: Calendar },
          { path: '/my-lessons', label: 'My Lessons', icon: BookOpen },
          { path: '/payments', label: 'Payments', icon: CreditCard },
          { path: '/quiz', label: 'K53 Quiz', icon: FileText },
          { path: '/messages', label: 'Messages', icon: MessageCircle },
        ]
      : user.role === 'INSTRUCTOR'
      ? [
          { path: '/', label: 'Dashboard', icon: Home },
          { path: '/schedule', label: 'My Schedule', icon: Calendar },
          { path: '/my-students', label: 'My Students', icon: Users },
          { path: '/messages', label: 'Messages', icon: MessageCircle },
          { path: '/analytics', label: 'Performance', icon: TrendingUp },
        ]
      : [
          { path: '/', label: 'Dashboard', icon: Home },
          { path: '/users', label: 'User Manager', icon: Users },
          { path: '/analytics', label: 'Analytics', icon: BarChart3 },
          { path: '/payments', label: 'Payments', icon: CreditCard },
          { path: '/messages', label: 'Messages', icon: MessageCircle },
        ]),
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/profile', label: 'Profile', icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <div className="text-white font-bold">DriveMate</div>
              <div className="text-emerald-400 text-xs">Driving School</div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <RoleSwitcher />
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <div className="text-white font-medium text-sm">{user.name}</div>
                <div className="text-emerald-400 text-xs">{user.role}</div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user.name.charAt(0)}</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-slate-700 text-slate-300 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700 py-2 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

// Footer Component
const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
        <p>© 2026 DriveMate Driving School Management System. Faculty of Informatics & Design — CPUT Project III</p>
        <p className="mt-2">Technical Lead: Lesego Lebese</p>
      </div>
    </footer>
  );
};

// Main App Component
const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-white">Initializing DriveMate...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {user && <Navbar />}
      <main className={user ? 'pt-16 min-h-screen bg-gradient-to-br from-slate-900 to-slate-800' : ''}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />

          {/* Protected Routes - Student */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
                {user?.role === 'STUDENT' && <StudentDashboard />}
                {user?.role === 'INSTRUCTOR' && <InstructorDashboard />}
                {user?.role === 'ADMIN' && <AdminDashboard />}
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <BookingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-lessons"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <ProgressPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <QuizPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schedule"
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                <BookingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-students"
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                <ProgressPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {user && <Footer />}
    </Router>
  );
};

export default App;

