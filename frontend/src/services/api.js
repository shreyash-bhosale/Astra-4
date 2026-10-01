import { handleClientMock } from './clientMockStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      // If network fails (e.g. backend not deployed yet or mixed content on Vercel preview),
      // seamlessly fall back to client mock store so the live demo stays 100% functional
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

  // Approvals
  getApprovals(status) {
    const q = status ? `?status=${status}` : '';
    return this.request(`/approvals${q}`);
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

  getHealth() {
    return this.request('/health');
  }

  getSettings() {
    return this.request('/settings');
  }

  resetDemo() {
    return this.request('/reset', {
      method: 'POST'
    });
  }
}

export const api = new ApiClient();
