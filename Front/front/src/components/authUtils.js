/**
 * Выполняет выход пользователя: очищает токены и перенаправляет на страницу входа.
 * @param {function} navigate - Функция navigate из react-router-dom для перенаправления.
 *                             Если не передана, будет использован window.location.href.
 */
export const performLogout = (navigate) => {
    console.log("Выполняется выход пользователя...");
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Уведомляем другие компоненты (например, Navigation) об изменении статуса аутентификации
    window.dispatchEvent(new Event('authChange'));

    // Перенаправляем на страницу входа
    if (navigate) {
        navigate('/login', { replace: true }); // replace: true чтобы не добавлять в историю
    } else {
        // Фоллбэк, если navigate не доступен (например, из интерцептора axios, где нет хуков)
        // Убедимся, что мы не на странице логина, чтобы избежать цикла
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    // Здесь также можно было бы отправить запрос на API для инвалидации токена на сервере,
    // но для этого нужен токен, который мы только что удалили, или refresh токен,
    // и это требует отдельной логики, если сервер поддерживает отзыв.
};