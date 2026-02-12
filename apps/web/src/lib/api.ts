import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Setup interceptors after store is available (called from authStore)
export const setupInterceptors = (getState: () => any) => {
    // Request interceptor
    api.interceptors.request.use(
        (config) => {
            const { accessToken } = getState();
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    await getState().refreshAccessToken();
                    const { accessToken } = getState();
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch {
                    getState().logout();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
            }

            return Promise.reject(error);
        }
    );
};

export default api;
