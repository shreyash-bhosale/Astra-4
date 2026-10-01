const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('resolveai_token');
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
