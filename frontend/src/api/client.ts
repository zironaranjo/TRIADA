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
};
