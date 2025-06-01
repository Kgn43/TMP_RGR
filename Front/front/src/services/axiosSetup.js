import axios from 'axios';

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

const apiClient = axios.create({
    baseURL: 'https://109.120.155.17/api',
    withCredentials: true,
});

apiClient.interceptors.request.use(
    (config) => {
        const methodsRequiringCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'];
        if (config.method && methodsRequiringCSRF.includes(config.method.toUpperCase())) {
            const csrfToken = getCookie('csrf_access_token');
            if (csrfToken) {
                config.headers['X-CSRF-TOKEN'] = csrfToken;
            } else {
                console.warn('CSRF token not found. Request might fail or lead to logout.');
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//Response Interceptor для обработки глобальных ошибок
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const currentPath = window.location.pathname;

        if (error.response) {
            const { status, data } = error.response;
            const errorMessage = data?.message || data?.details || 'Произошла ошибка.';

            const isLoginAttempt = originalRequest.url === '/login';

            if (status === 401 && !isLoginAttempt && currentPath !== '/login') {
                console.error('Axios Interceptor (apiClient): 401 Unauthorized.', data);
                // alert(`Сессия истекла или недействительна (${errorMessage}). Пожалуйста, войдите снова.`);
                window.dispatchEvent(new CustomEvent('forceLogout', { detail: { message: `Сессия истекла или недействительна (${errorMessage}). Пожалуйста, войдите снова.` } }));
            } else if (status === 422 && data?.error_code === "INVALID_TOKEN" && !isLoginAttempt && currentPath !== '/login') {
                console.error('Axios Interceptor (apiClient): 422 Invalid Token (potential CSRF issue or malformed token).', data);
                // alert(`Проблема с токеном (${errorMessage}). Пожалуйста, войдите снова.`);
                window.dispatchEvent(new CustomEvent('forceLogout', { detail: { message: `Проблема с токеном (${errorMessage}). Пожалуйста, войдите снова.` } }));
            }
        } else if (error.request && currentPath !== '/login') {
            console.error("Axios Interceptor (apiClient): Network error - No response received", error.request);
        } else if (currentPath !== '/login') {
            console.error('Axios Interceptor (apiClient): Request setup error', error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;