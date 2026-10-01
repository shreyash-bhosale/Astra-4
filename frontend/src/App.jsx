import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import LandingPage from './pages/LandingPage';
import LoginSelectionPage from './pages/LoginSelectionPage';
import CustomerLoginPage from './pages/CustomerLoginPage';
import StaffLoginPage from './pages/StaffLoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerForgotPasswordPage from './pages/CustomerForgotPasswordPage';
import StaffForgotPasswordPage from './pages/StaffForgotPasswordPage';
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
const AIControlCenterPage = lazy(() => import('./pages/AIControlCenterPage'));

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
    const currentPath = window.location.pathname;
    return <Navigate to={`/staff/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  // If a customer tries to open staff dashboard, route them gracefully to customer portal
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
    return <Navigate to={`/customer/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
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
            <Route path="/login" element={<LoginSelectionPage />} />
            
            {/* Customer Authentication */}
            <Route path="/customer/login" element={<CustomerLoginPage />} />
            <Route path="/customer/register" element={<RegisterPage />} />
            <Route path="/customer/forgot-password" element={<CustomerForgotPasswordPage />} />
            
            {/* Staff Authentication */}
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route path="/staff/forgot-password" element={<StaffForgotPasswordPage />} />

            {/* Legacy Auth Fallbacks */}
            <Route path="/register" element={<Navigate to="/customer/register" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/customer/forgot-password" replace />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Customer Portal Routes */}
            <Route path="/customer" element={<CustomerProtectedRoute><CustomerHomePage /></CustomerProtectedRoute>} />
            <Route path="/customer/dashboard" element={<Navigate to="/customer" replace />} />
            <Route path="/customer/issues" element={<CustomerProtectedRoute><CustomerIssuesPage /></CustomerProtectedRoute>} />
            <Route path="/customer/issues/new" element={<CustomerProtectedRoute><RaiseIssuePage /></CustomerProtectedRoute>} />
            <Route path="/customer/issues/:id" element={<CustomerProtectedRoute><CustomerIssueDetailPage /></CustomerProtectedRoute>} />
            <Route path="/customer/orders" element={<CustomerProtectedRoute><CustomerOrdersPage /></CustomerProtectedRoute>} />
            <Route path="/customer/support" element={<CustomerProtectedRoute><CustomerAISupportPage /></CustomerProtectedRoute>} />
            <Route path="/customer/ai-support" element={<Navigate to="/customer/support" replace />} />
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
            <Route path="/control-center" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><AIControlCenterPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/ai-control-center" element={<Navigate to="/control-center" replace />} />
            <Route path="/supervisor" element={<Navigate to="/control-center" replace />} />
            <Route path="/settings" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></StaffProtectedRoute>} />

            {/* Staff Aliases */}
            <Route path="/staff" element={<Navigate to="/dashboard" replace />} />
            <Route path="/staff/dashboard" element={<StaffProtectedRoute><DashboardPage /></StaffProtectedRoute>} />
            <Route path="/staff/tickets" element={<StaffProtectedRoute><TicketsListPage /></StaffProtectedRoute>} />
            <Route path="/staff/tickets/:id" element={<StaffProtectedRoute><TicketWorkspacePage /></StaffProtectedRoute>} />
            <Route path="/staff/approvals" element={<StaffProtectedRoute><ApprovalsPage /></StaffProtectedRoute>} />
            <Route path="/staff/customers" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><CustomersPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/staff/orders" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><OrdersPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/staff/policies" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><PoliciesPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/staff/activity" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><ActivityPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/staff/ai-control-center" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><AIControlCenterPage /></Suspense></StaffProtectedRoute>} />
            <Route path="/staff/settings" element={<StaffProtectedRoute><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></StaffProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
