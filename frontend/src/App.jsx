import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardLayout from './layouts/DashboardLayout';
import CustomerLayout from './layouts/CustomerLayout';
import DashboardPage from './pages/DashboardPage';
import TicketsListPage from './pages/TicketsListPage';
import TicketWorkspacePage from './pages/TicketWorkspacePage';
import ApprovalsPage from './pages/ApprovalsPage';

// Customer Portal Pages
import CustomerHomePage from './pages/customer/CustomerHomePage';
import CustomerIssuesPage from './pages/customer/CustomerIssuesPage';
import RaiseIssuePage from './pages/customer/RaiseIssuePage';
import CustomerIssueDetailPage from './pages/customer/CustomerIssueDetailPage';
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage';
import CustomerAISupportPage from './pages/customer/CustomerAISupportPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';

// Code-split secondary dashboard routes
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageLoader() {
  return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      Loading view...
    </div>
  );
}

function LoadingSpinner({ label }) {
  return (
    <div
      style={{
        height: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '2px solid var(--border-subtle)',
          borderTopColor: 'var(--text-primary)',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      <span style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
        {label || 'Checking authentication...'}
      </span>
    </div>
  );
}

// Staff & Management routes (Agents, Managers, Admins)
function StaffProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner label="Authenticating staff console..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a pure customer tries to open staff dashboard, route them gracefully to customer portal
  if (user.role === 'customer') {
    return <Navigate to="/customer" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Consumer / Customer Portal routes
function CustomerProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner label="Connecting to Customer Portal..." />;
  }

  if (!user) {
    const currentPath = window.location.pathname;
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  return <CustomerLayout>{children}</CustomerLayout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Customer Portal Routes */}
            <Route path="/customer" element={<CustomerProtectedRoute><CustomerHomePage /></CustomerProtectedRoute>} />
            <Route path="/customer/issues" element={<CustomerProtectedRoute><CustomerIssuesPage /></CustomerProtectedRoute>} />
            <Route path="/customer/issues/new" element={<CustomerProtectedRoute><RaiseIssuePage /></CustomerProtectedRoute>} />
            <Route path="/customer/issues/:id" element={<CustomerProtectedRoute><CustomerIssueDetailPage /></CustomerProtectedRoute>} />
            <Route path="/customer/orders" element={<CustomerProtectedRoute><CustomerOrdersPage /></CustomerProtectedRoute>} />
            <Route path="/customer/support" element={<CustomerProtectedRoute><CustomerAISupportPage /></CustomerProtectedRoute>} />
            <Route path="/customer/profile" element={<CustomerProtectedRoute><CustomerProfilePage /></CustomerProtectedRoute>} />

            {/* Staff / Admin / Operations Routes */}
            <Route path="/dashboard" element={<StaffProtectedRoute><DashboardPage /></StaffProtectedRoute>} />
            <Route path="/tickets" element={<StaffProtectedRoute><TicketsListPage /></StaffProtectedRoute>} />
            <Route path="/tickets/:id" element={<StaffProtectedRoute><TicketWorkspacePage /></StaffProtectedRoute>} />
            <Route path="/approvals" element={<StaffProtectedRoute><ApprovalsPage /></StaffProtectedRoute>} />
            <Route path="/customers" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><CustomersPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/orders" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><OrdersPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/policies" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><PoliciesPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/activity" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><ActivityPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/settings" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></StaffProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
