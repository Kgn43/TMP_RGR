import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Для перенаправления после входа
import '../stiles/LoginPage.css'; // Создадим этот файл для стилей

const LoginPage = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({}); // Теперь это объект для ошибок по полям
    const [generalError, setGeneralError] = useState(''); // Для общих ошибок
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({}); // Сбрасываем ошибки полей
        setGeneralError(''); // Сбрасываем общую ошибку
        setIsLoading(true);

        if (!login.trim() || !password.trim()) {
            setErrors({
                login: !login.trim() ? 'Логин не может быть пустым.' : '',
                password: !password.trim() ? 'Пароль не может быть пустым.' : ''
            });
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:15000/api/login', { // Убедитесь, что URL и поле 'passwd' верны
                login: login,
                passwd: password 
            });

            const { access_token} = response.data;

            localStorage.setItem('accessToken', access_token);
            
            window.dispatchEvent(new Event('authChange'));
            
            // Можно добавить уведомление об успехе через toast-библиотеку
            setIsLoading(false);
            navigate('/issues'); // Или на другую страницу после входа

        } catch (err) {
            setIsLoading(false);
            if (err.response) {
                // Сервер ответил с кодом ошибки (4xx, 5xx)
                const apiError = err.response.data;
                console.error("Ошибка API:", apiError);

                if (err.response.status === 401) { // Неверный логин/пароль
                    setGeneralError(apiError.message || apiError.details || 'Неверный логин или пароль.');
                } else if (err.response.status === 422 && apiError.errors) { // Ошибки валидации полей
                    setErrors(apiError.errors); // apiError.errors должен быть объектом { field: message }
                    setGeneralError(apiError.message || 'Пожалуйста, исправьте ошибки в форме.');
                } else if (err.response.status === 400 && apiError.message) { // Общий Bad Request
                    setGeneralError(apiError.message + (apiError.details ? ` (${apiError.details})` : ''));
                } else {
                    // Другие ошибки 4xx/5xx
                    setGeneralError(apiError.message || 'Произошла ошибка на сервере. Попробуйте позже.');
                }
            } else if (err.request) {
                // Запрос был сделан, но ответ не был получен (проблема сети)
                console.error("Сетевая ошибка:", err.request);
                setGeneralError('Не удалось подключиться к серверу. Проверьте ваше интернет-соединение.');
            } else {
                // Что-то другое пошло не так при настройке запроса
                console.error("Ошибка настройки запроса:", err.message);
                setGeneralError('Произошла непредвиденная ошибка.');
            }
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-container">
                <h1>Вход в систему</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login-input">Логин</label>
                        <input
                            type="text"
                            id="login-input"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="Введите ваш логин"
                            disabled={isLoading}
                            className={errors.login ? 'input-error' : ''} // Добавляем класс для подсветки ошибки
                        />
                        {errors.login && <p className="field-error-message">{errors.login}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="password-input">Пароль</label>
                        <input
                            type="password"
                            id="password-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите ваш пароль"
                            disabled={isLoading}
                            className={errors.password ? 'input-error' : ''} // Добавляем класс для подсветки ошибки
                        />
                        {errors.password && <p className="field-error-message">{errors.password}</p>}
                    </div>
                    
                    {/* Отображение общей ошибки */}
                    {generalError && !errors.login && !errors.password && <p className="error-message">{generalError}</p>}
                    
                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading || !login.trim() || !password.trim()}
                    >
                        {isLoading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;