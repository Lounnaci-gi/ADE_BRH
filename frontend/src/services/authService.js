import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const authService = {
    login: async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, {
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
            throw error.response?.data || { error: 'Erreur de connexion' };
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