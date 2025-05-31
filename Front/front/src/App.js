import './stiles/App.css';
import './Navigation.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

import EmployeesPage from './pages/EmployeesPage';
import EmployeeCreatePage from './pages/EmployeeCreatePage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';

import DepartmentsPage from './pages/DepartmentsPage';
import DepartmentCreatePage from './pages/DepartmentCreatePage';
import DepartmentDetailPage from './pages/DepartmentDetailPage';

import IssuesPage from './pages/IssuesPage';
import NotFoundPage from './pages/NotFoundPage';

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate  } from 'react-router-dom';


const Navigation = () => {
  // Начальное состояние аутентификации берется из localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const navigate = useNavigate();

  // Этот эффект нужен, чтобы компонент навигации мог среагировать на изменения
  // статуса аутентификации, инициированные из других частей приложения
  // (например, после успешного логина или выхода).
  useEffect(() => {
      const handleAuthChange = () => {
          setIsAuthenticated(!!localStorage.getItem('accessToken'));
      };

      // Слушаем кастомное событие 'authChange', которое мы будем генерировать
      // в LoginPage после логина и в этой же функции Navigation после выхода.
      window.addEventListener('authChange', handleAuthChange);
      
      // Также можно слушать событие 'storage' для синхронизации между вкладками,
      // но для основного UX в одной вкладке 'authChange' более предсказуем.
      window.addEventListener('storage', handleAuthChange);


      // Очистка слушателя при размонтировании компонента
      return () => {
          window.removeEventListener('authChange', handleAuthChange);
          // window.removeEventListener('storage', handleAuthChange);
      };
  }, []); // Пустой массив зависимостей, чтобы эффект выполнился один раз при монтировании

  const handleLogout = () => {
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false); // Обновляем состояние локально
      window.dispatchEvent(new Event('authChange')); // Уведомляем другие компоненты (включая этот же)
      navigate('/login');
  };

  return (
      <nav className="app-navigation"> {/* Главный контейнер навигации */}
          <ul className="nav-list"> {/* Список для расположения элементов в строку */}
              <li className="nav-item">
                  <Link to="/" className="nav-link">Главная</Link>
              </li>
              {isAuthenticated ? (
                  <>
                      <li className="nav-item">
                          <Link to="/employees" className="nav-link">Сотрудники</Link>
                      </li>
                      <li className="nav-item">
                          <Link to="/departments" className="nav-link">Отделы</Link>
                      </li>
                      <li className="nav-item">
                          <Link to="/issues" className="nav-link">Происшествия</Link>
                      </li>
                      <li className="nav-item">
                          {/* Кнопка выхода стилизуется так же, как ссылка */}
                          <button onClick={handleLogout} className="nav-link logout-button-styled">Выход</button>
                      </li>
                  </>
              ) : (
                  <li className="nav-item">
                      <Link to="/login" className="nav-link">Вход</Link>
                  </li>
              )}
          </ul>
      </nav>
  );
};

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/new" element={<EmployeeCreatePage />} />
        <Route path="/employees/:employeeId" element={<EmployeeDetailPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/departments/new" element={<DepartmentCreatePage />} />
        <Route path="/departments/:departmentId" element={<DepartmentDetailPage />} />
        <Route path="/issues" element={<IssuesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;