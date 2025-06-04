import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../stiles/LoginPage.css';

const LoginPage = () => {
    const [loginValue, setLoginValue] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();

    
    const from = location.state?.from?.pathname || '/issues'; //По умолчанию на /issues

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFieldErrors({});
        setGeneralError('');
        setIsLoading(true);

        if (!loginValue.trim() || !password.trim()) {
            setFieldErrors({
                login: !loginValue.trim() ? 'Логин не может быть пустым.' : '',
                password: !password.trim() ? 'Пароль не может быть пустым.' : ''
            });
            setIsLoading(false);
            return;
        }

        try {
            await auth.login({ login: loginValue, passwd: password });

            //После успешного логина перенаправляем пользователя.
            setIsLoading(false);
            navigate(from, { replace: true });

        } catch (err) {
            setIsLoading(false);
            const errorMessage = err.details || err.message || 'Ошибка входа. Пожалуйста, проверьте ваши данные.';
            console.error("LoginPage: Login failed", err);

            if (err.errors) {
                setFieldErrors(err.errors);
                setGeneralError(err.message || 'Пожалуйста, исправьте ошибки в форме.');
            } else {
                setGeneralError(errorMessage);
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
                            value={loginValue} // Используем loginValue
                            onChange={(e) => setLoginValue(e.target.value)}
                            placeholder="Введите ваш логин"
                            disabled={isLoading}
                            className={fieldErrors.login ? 'input-error' : ''}
                        />
                        {fieldErrors.login && <p className="field-error-message">{fieldErrors.login}</p>}
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
                            className={fieldErrors.password ? 'input-error' : ''}
                        />
                        {fieldErrors.password && <p className="field-error-message">{fieldErrors.password}</p>}
                    </div>
                    
                    {generalError && <p className="error-message">{generalError}</p>}
                    
                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading || !loginValue.trim() || !password.trim()}
                    >
                        {isLoading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;