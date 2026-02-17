import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api.triadak.io' : 'http://localhost:3000');

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Owners API
export const ownersApi = {
    getAll: () => api.get('/owners'),
    getOne: (id: string) => api.get(`/owners/${id}`),
    create: (data: any) => api.post('/owners', data),
    update: (id: string, data: any) => api.patch(`/owners/${id}`, data),
};

// Properties API
export const propertiesApi = {
    getAll: () => api.get('/properties'),
    getOne: (id: string) => api.get(`/properties/${id}`),
    create: (data: any) => api.post('/properties', data),
};

// Bookings API
export const bookingsApi = {
    getAll: () => api.get('/bookings'),
    getOne: (id: string) => api.get(`/bookings/${id}`),
    create: (data: any) => api.post('/bookings', data),
    syncCalendar: (propertyId: string) => api.post(`/bookings/sync/${propertyId}`),
};

// Subscriptions API
export const subscriptionsApi = {
    createCheckout: (data: { userId: string; email: string; planId: string; interval: string }) =>
        api.post('/subscriptions/create-checkout', data),
    createPortal: (stripeCustomerId: string) =>
        api.post('/subscriptions/portal', { stripeCustomerId }),
    verifySession: (sessionId: string) =>
        api.get(`/subscriptions/verify-session?session_id=${sessionId}`),
    getCommissionRate: (planId: string) =>
        api.get(`/subscriptions/commission-rate?planId=${planId}`),
};

// Connect API (Stripe Connect for receiving guest payments)
export const connectApi = {
    onboard: (userId: string) => api.post('/connect/onboard', { userId }),
    getStatus: (userId: string) => api.get(`/connect/status?userId=${userId}`),
    getDashboardLink: (userId: string) => api.get(`/connect/dashboard-link?userId=${userId}`),
};

// Channel Manager API
export const channelsApi = {
    getConnections: (propertyId?: string) =>
        api.get('/channels/connections' + (propertyId ? `?propertyId=${propertyId}` : '')),
    getConnection: (id: string) => api.get(`/channels/connections/${id}`),
    createConnection: (data: any) => api.post('/channels/connections', data),
    updateConnection: (id: string, data: any) => api.put(`/channels/connections/${id}`, data),
    deleteConnection: (id: string) => api.delete(`/channels/connections/${id}`),
    syncConnection: (id: string) => api.post(`/channels/connections/${id}/sync`),
    syncAll: () => api.post('/channels/sync-all'),
    getSyncLogs: (connectionId?: string, limit?: number) =>
        api.get('/channels/sync-logs' + (connectionId ? `?connectionId=${connectionId}` : '') + (limit ? `${connectionId ? '&' : '?'}limit=${limit}` : '')),
    getStats: () => api.get('/channels/stats'),
    testLodgifyKey: (apiKey: string) => api.post('/channels/lodgify/test', { apiKey }),
};
