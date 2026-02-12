import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setupInterceptors } from '../lib/api';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    grade: string;
    branch: string;
}

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    grade: string;
    branch: string;
    school?: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    refreshAccessToken: () => Promise<void>;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { student, accessToken, refreshToken } = response.data;

                    set({
                        user: student,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            register: async (data: RegisterData) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/register', data);
                    const { student, accessToken, refreshToken } = response.data;

                    set({
                        user: student,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                const { refreshToken } = get();
                if (refreshToken) {
                    api.post('/auth/logout', { refreshToken }).catch(() => { });
                }

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            refreshAccessToken: async () => {
                const { refreshToken } = get();
                if (!refreshToken) {
                    get().logout();
                    return;
                }

                try {
                    const response = await api.post('/auth/refresh', { refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = response.data;

                    set({ accessToken, refreshToken: newRefreshToken });
                } catch {
                    get().logout();
                }
            },

            setUser: (user: User) => set({ user }),
        }),
        {
            name: 'bactunis-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Setup API interceptors with store access
setupInterceptors(() => useAuthStore.getState());
