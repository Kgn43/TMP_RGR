import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';
import { performLogout } from '../utils/authUtils'; // Импортируем для кнопки выхода

const Navigation = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuthChange = () => {
            console.log("Navigation: authChange event detected, updating isAuthenticated");
            setIsAuthenticated(!!localStorage.getItem('accessToken'));
        };

        window.addEventListener('authChange', handleAuthChange);
        // Также стоит добавить слушатель 'storage' для синхронизации между вкладками
        window.addEventListener('storage', handleAuthChange); 

        return () => {
            window.removeEventListener('authChange', handleAuthChange);
            window.removeEventListener('storage', handleAuthChange);
        };
    }, []);

    const handleLogoutClick = () => {
        performLogout(navigate); // Передаем navigate для корректного редиректа из компонента
    };

    return (
        <nav className="app-navigation">
            <ul className="nav-list">
                <li><Link to="/" className="nav-link">Главная</Link></li>
                {isAuthenticated ? (
                    <>
                        <li><Link to="/employees" className="nav-link">Сотрудники</Link></li>
                        <li><Link to="/departments" className="nav-link">Отделы</Link></li>
                        <li><Link to="/issues" className="nav-link">Происшествия</Link></li>
                        <li>
                            <button onClick={handleLogoutClick} className="nav-link logout-button-styled">Выход</button>
                        </li>
                    </>
                ) : (
                    <li><Link to="/login" className="nav-link">Вход</Link></li>
                )}
            </ul>
        </nav>
    );
};
export default Navigation;