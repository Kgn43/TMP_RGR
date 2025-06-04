import apiClient from './axiosSetup';

/**
 * Вход пользователя.
 * @param {object} credentials - Объект с логином и паролем {login, passwd}.
 * @returns {Promise<object>} Данные пользователя от бэкенда {user_id, role_id}.
 */
export const login = async (credentials) => {
    try {
        const response = await apiClient.post('/login', credentials);
        // Бэкенд устанавливает HttpOnly куки.
        return response.data;
    } catch (error) {
        console.error("Login failed:", error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Login failed');
    }
};

/**
 * Выход пользователя.
 * @returns {Promise<object>}
 */
export const logout = async () => {
    try {
        const response = await apiClient.post('/logout');
        // Бэкенд удаляет HttpOnly куки.
        return response.data;
    } catch (error) {
        console.error("Logout failed:", error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Logout failed');
    }
};

/**
 * Проверяет активную сессию и получает данные текущего пользователя.
 * и возвращать информацию о пользователе, если JWT-кука валидна.
 * @returns {Promise<object|null>} 
 * Данные пользователя или null, если сессия неактивна.
 */
export const fetchCurrentUser = async () => {
    try {
        // если JWT куки нет или она невалидна, он вернет 401.
        const response = await apiClient.get('/me');
        return response.data;
    } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 422)) {
            // 401 Unauthorized
            // 422 Unprocessable Entity
            console.log("No active session or token is invalid.");
        } else {
            console.error("Error fetching current user:", error.response ? error.response.data : error.message);
        }
        return null;
    }
};