import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null); //Хранит объект пользователя или null
    const [isLoading, setIsLoading] = useState(true); //Для индикации загрузки начального состояния аутентификации
    const navigate = useNavigate();


    const performFullLogout = useCallback(async (alertMessage) => {
        console.log("AuthContext: Performing full logout.");
        try {
            await apiLogout(); //Попытка логаута на сервере
        } catch (e) {
            console.error("AuthContext: Server logout failed, proceeding with client-side logout.", e);
        } finally {
            setCurrentUser(null);
            if (alertMessage) {
                alert(alertMessage); //Показываем сообщение, если оно есть
            }
            if (window.location.pathname !== '/login') {
                navigate('/login', { replace: true });
            }
        }
    }, [navigate]);


    useEffect(() => {
        const checkSession = async () => {
            setIsLoading(true);
            try {
                const user = await fetchCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                setCurrentUser(null); // Убедимся, что пользователь null при ошибке
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (credentials) => {
        try {
            const userDataFromBackend = await apiLogin(credentials); 
            setCurrentUser({ 
                id: userDataFromBackend.user_id, 
                roleId: userDataFromBackend.role_id 
            }); 
            return userDataFromBackend; //Возвращаем полный ответ для LoginPage, если нужно
        } catch (error) {
            setCurrentUser(null);
            throw error;
        }
    };

    const logout = async () => { //вызывается из UI
        await performFullLogout("Вы успешно вышли из системы.");
    };

    const value = {
        currentUser,
        isAuthenticated: !!currentUser, // true если currentUser не null
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};