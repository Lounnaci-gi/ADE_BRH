import api from './api';

const authService = {
    login: async (username, password) => {
        try {
            const response = await api.post('/login', {
                username,
                password
            });
            
            if (response.data.success) {
                // Stocker les infos utilisateur dans localStorage
                localStorage.setItem('user', JSON.stringify(response.data.user));
                return response.data;
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Erreur de connexion au serveur' };
        }
    },

    logout: () => {
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        return localStorage.getItem('user') !== null;
    }
};

export default authService;