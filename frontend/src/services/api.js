import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the Render backend.
// In local dev, it falls back to '/api' which Vite proxies to localhost:4000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // Abort the request if it takes longer than 30 seconds
});

// ── JWT interceptor: attach Bearer token to every request ─────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('novacrm_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Auto-redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('novacrm_token');
      localStorage.removeItem('novacrm_company');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerCompany = (data)     => api.post('/auth/register', data);
export const loginCompany    = (data)     => api.post('/auth/login', data);
export const getMyProfile    = ()         => api.get('/auth/me');

// ── Customers ─────────────────────────────────────────────────────────────────
// Fetch a list of customers, optionally passing filters like { page: 1, limit: 10 }
export const getCustomers   = (params) => api.get('/customers', { params });
export const getCustomerById = (id)    => api.get(`/customers/${id}`);
export const addCustomer    = (data)   => api.post('/customers', data);
export const updateCustomer = (id, d)  => api.put(`/customers/${id}`, d);
export const deleteCustomer = (id)     => api.delete(`/customers/${id}`);

// Handles uploading a CSV file by wrapping it in a FormData object
export const importCSV      = (file)   => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/customers/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders  = (params) => api.get('/orders', { params });
export const addOrder   = (data)   => api.post('/orders', data); // e.g., data: { customer_id: 1, amount: 500 }

// ── Segments ──────────────────────────────────────────────────────────────────
// Segments are logic rules used to filter customers (e.g., "spend > 1000")
export const getSegments     = ()       => api.get('/segments');
export const createSegment   = (data)   => api.post('/segments', data);
// Checks how many customers currently match a saved segment ID
export const previewSegment  = (id)     => api.get(`/segments/${id}/preview`);
// Checks how many customers match a set of rules BEFORE saving them
export const previewRules    = (rules)  => api.post('/segments/preview', { rules });
export const deleteSegment   = (id)     => api.delete(`/segments/${id}`);

// ── Campaigns ─────────────────────────────────────────────────────────────────
export const getCampaigns    = ()       => api.get('/campaigns');
export const getCampaignById = (id)     => api.get(`/campaigns/${id}`);
export const createCampaign  = (data)   => api.post('/campaigns', data);
// Triggers the actual sending of messages to the targeted segment
export const sendCampaign    = (id)     => api.post(`/campaigns/${id}/send`);
// Permanently deletes a campaign and all its communications/receipts
export const deleteCampaign  = (id)     => api.delete(`/campaigns/${id}`);

// ── Analytics ─────────────────────────────────────────────────────────────────
// Fetches high-level metrics (total revenue, total customers, etc.) for the Dashboard
export const getAnalyticsSummary  = ()    => api.get('/analytics/summary');
// Fetches detailed funnel metrics (sent, delivered, opened, clicked) for a specific campaign
export const getCampaignAnalytics = (id)  => api.get(`/analytics/${id}`);

// ── AI ────────────────────────────────────────────────────────────────────────
// Sends the conversation history to the backend to get a response from the AI assistant
export const aiChat = (messages) => api.post('/ai/chat', { messages });

export default api;
