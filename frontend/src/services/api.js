import { handleClientMock } from './clientMockStore';

const getApiBase = () => {
  // If running in browser
  if (typeof window !== 'undefined' && window.location) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const envUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();

    // If deployed on Vercel or any non-localhost domain
    if (!isLocalhost) {
      // If envUrl is empty or accidentally points to localhost/loopback, always route to same-origin /api
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return '/api';
      }
      const clean = envUrl.replace(/\/+$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }

    // On local machine
    if (envUrl) {
      const clean = envUrl.replace(/\/+$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
  }

  // Default local fallback
  return 'http://localhost:5001/api';
};

const API_BASE = getApiBase();

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    const local = localStorage.getItem('resolveai_token');
    if (local) return local;
    try {
      const supaAuth = localStorage.getItem('resolveai-supabase-auth');
      if (supaAuth) {
        const parsed = JSON.parse(supaAuth);
        return parsed?.access_token || parsed?.currentSession?.access_token || null;
      }
    } catch (e) {}
    return null;
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('resolveai_token', token);
    } else {
      localStorage.removeItem('resolveai_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`API Error (HTTP ${response.status}): ${text.substring(0, 120)}`);
        }
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      // If network fails (e.g. backend unreachable or blocked by CORS),
      // fall back to client demo store so offline testing works cleanly
      if (err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.warn(`[ResolveAI] Backend unavailable at ${url}. Seamlessly using client demo store.`);
        return handleClientMock(endpoint, options);
      }
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth
  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  resetPassword(data) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  // Tickets
  getTickets(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tickets${query ? `?${query}` : ''}`);
  }

  getTicket(id) {
    return this.request(`/tickets/${id}`);
  }

  createTicket(ticketData) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  }

  updateTicket(id, updates) {
    return this.request(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  deleteTicket(id) {
    return this.request(`/tickets/${id}`, {
      method: 'DELETE'
    });
  }

  runWorkflow(ticketId) {
    return this.request(`/tickets/${ticketId}/run`, {
      method: 'POST'
    });
  }

  getTicketRuns(ticketId) {
    return this.request(`/tickets/${ticketId}/runs`);
  }

  // Email Notifications
  getTicketEmails(ticketId) {
    return this.request(`/tickets/${ticketId}/emails`);
  }

  sendTicketUpdateEmail(ticketId, data) {
    return this.request(`/tickets/${ticketId}/send-update`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  retryEmail(emailId) {
    return this.request(`/emails/${emailId}/retry`, {
      method: 'POST'
    });
  }

  getEmailStatus() {
    return this.request('/emails/status');
  }

  sendAdminTestEmail(to) {
    return this.request('/emails/test', {
      method: 'POST',
      body: to ? JSON.stringify({ to }) : undefined
    });
  }

  getEmailLogs(limit = 25) {
    return this.request(`/emails/logs?limit=${limit}`);
  }

  // Approvals
  getApprovals(status) {
    const q = status ? `?status=${status}` : '';
    return this.request(`/approvals${q}`);
  }

  evaluateApproval(id) {
    return this.request(`/approvals/${id}/evaluate`, {
      method: 'POST'
    });
  }

  aiDecideApproval(id) {
    return this.request(`/approvals/${id}/ai-decide`, {
      method: 'POST'
    });
  }

  approve(id) {
    return this.request(`/approvals/${id}/approve`, {
      method: 'POST'
    });
  }

  reject(id, reason) {
    return this.request(`/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Customers & Orders
  getCustomers() {
    return this.request('/customers');
  }

  getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  getOrders() {
    return this.request('/orders');
  }

  // Policies
  getPolicies() {
    return this.request('/policies');
  }

  createPolicy(policyData) {
    return this.request('/policies', {
      method: 'POST',
      body: JSON.stringify(policyData)
    });
  }

  updatePolicy(id, updates) {
    return this.request(`/policies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // Customer Portal Endpoints
  getCustomerProfile() {
    return this.request('/customer/me');
  }

  getCustomerTickets() {
    return this.request('/customer/tickets');
  }

  createCustomerTicket(ticketData) {
    return this.request('/customer/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  }

  getCustomerTicket(id) {
    return this.request(`/customer/tickets/${id}`);
  }

  getCustomerTicketTimeline(id) {
    return this.request(`/customer/tickets/${id}/timeline`);
  }

  getCustomerOrders() {
    return this.request('/customer/orders');
  }

  getCustomerNotifications() {
    return this.request('/customer/notifications');
  }

  sendCustomerChatMessage(message) {
    return this.request('/customer/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  updateCustomerPreferences(preferences) {
    return this.request('/customer/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    });
  }

  deleteCustomerAccount() {
    return this.request('/customer/account', {
      method: 'DELETE'
    });
  }

  // Manager Command Center Upgrades
  assignTicket(ticketId, userId) {
    return this.request(`/tickets/${ticketId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  addTicketInternalNote(ticketId, note) {
    return this.request(`/tickets/${ticketId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
  }

  globalSearch(query) {
    return this.request(`/system/search?q=${encodeURIComponent(query)}`);
  }

  // Activity & System
  getActivity() {
    return this.request('/activity');
  }

  getAgenticMetrics() {
    return this.request('/activity/metrics');
  }

  getHealth() {
    return this.request('/health');
  }

  getSettings() {
    return this.request('/settings');
  }

  updateSettings(data) {
    return this.request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Supervisor Agent & AI Control Center
  getSupervisorStatus() {
    return this.request('/supervisor/status');
  }

  getSupervisorAgents() {
    return this.request('/supervisor/agents');
  }

  getSupervisorWorkflows() {
    return this.request('/supervisor/workflows');
  }

  getSupervisorEvents() {
    return this.request('/supervisor/events');
  }

  sendSupervisorQuery(query) {
    return this.request('/supervisor/query', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }

  // Policy-Bounded Autonomous AI Mode
  getAutonomySettings() {
    return this.request('/autonomy/settings');
  }

  updateAutonomySettings(settings) {
    return this.request('/autonomy/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }

  enableAutonomousMode() {
    return this.request('/autonomy/enable', {
      method: 'POST'
    });
  }

  disableAutonomousMode() {
    return this.request('/autonomy/disable', {
      method: 'POST'
    });
  }

  pauseAutonomousMode() {
    return this.request('/autonomy/pause', {
      method: 'POST'
    });
  }

  resumeAutonomousMode() {
    return this.request('/autonomy/resume', {
      method: 'POST'
    });
  }

  emergencyStopAutonomy() {
    return this.request('/autonomy/emergency-stop', {
      method: 'POST'
    });
  }

  resetDemo() {
    return this.request('/reset', {
      method: 'POST'
    });
  }
}

export const api = new ApiClient();
