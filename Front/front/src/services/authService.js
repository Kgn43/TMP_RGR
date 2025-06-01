import apiClient from './axiosSetup'; // Используем настроенный Axios

/**
 * Вход пользователя.
 * @param {object} credentials - Объект с логином и паролем (например, { login, passwd }).
 * @returns {Promise<object>} Данные пользователя от бэкенда (например, { user_id, role_id, message }).
 */
export const login = async (credentials) => {
    try {
        const response = await apiClient.post('/login', credentials);
        // Бэкенд устанавливает HttpOnly куки.
        // Ответ от бэкенда может содержать полезную информацию о пользователе.
        return response.data; // Например, { message: "Login successful", user_id: "1", role_id: 1 }
    } catch (error) {
        console.error("Login failed:", error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Login failed');
    }
};

/**
 * Выход пользователя.
 * @returns {Promise<object>} Ответ от бэкенда.
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
 * Этот эндпоинт ('/me' или '/check-auth') должен быть защищен @jwt_required() на бэкенде
 * и возвращать информацию о пользователе, если JWT-кука валидна.
 * @returns {Promise<object|null>} Данные пользователя или null, если сессия неактивна.
 */
export const fetchCurrentUser = async () => {
    try {
        // Предположим, у вас есть эндпоинт /api/me, который возвращает данные пользователя
        // если JWT кука валидна. Если куки нет или она невалидна, он вернет 401.
        const response = await apiClient.get('/me'); // Создай такой эндпоинт на бэкенде
        return response.data; // Например, { user_id: "1", username: "user", role_id: 1 }
    } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 422)) {
            // 401 Unauthorized (нет токена, истек, невалиден)
            // 422 Unprocessable Entity (может быть из-за CSRF, если /me требует его, но GET обычно нет)
            console.log("No active session or token is invalid.");
        } else {
            console.error("Error fetching current user:", error.response ? error.response.data : error.message);
        }
        return null; // Сессия не активна или произошла ошибка
    }
};