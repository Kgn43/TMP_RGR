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

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const Navigation = () => {
  const { isAuthenticated, logout, currentUser } = useAuth(); //Получаем состояние и функции из контекста

  const handleLogout = async () => {
      try {
          await logout();
      } catch (error) {
          console.error("Navigation: Failed to logout", error);
      }
  };

  return (
    <nav className="app-navigation">
        <ul className="nav-list">
            <li className="nav-item">
                <Link to="/" className="nav-link">Главная</Link>
            </li>
            {isAuthenticated ? (
                <>
                    {/* Можно добавить отображение имени пользователя, если оно есть в currentUser */}
                    {/* {currentUser && currentUser.username && <li className="nav-item nav-user">Привет, {currentUser.username}!</li>} */}
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
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
      return <div>Загрузка приложения...</div>;
  }

  return (
      <>
          <Navigation />
          <Routes>
            {/* Публичные маршруты */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Защищенные маршруты */}
              <Route 
                  path="/employees" 
                  element={
                      <ProtectedRoute>
                          <EmployeesPage />
                      </ProtectedRoute>
                  } 
              />
              <Route 
                  path="/employees/new" 
                  element={
                      <ProtectedRoute>
                          <EmployeeCreatePage />
                      </ProtectedRoute>
                  } 
              />
              <Route 
                  path="/employees/:employeeId" 
                  element={
                      <ProtectedRoute>
                          <EmployeeDetailPage />
                      </ProtectedRoute>
                  } 
              />
              <Route 
                  path="/departments" 
                  element={
                      <ProtectedRoute>
                          <DepartmentsPage />
                      </ProtectedRoute>
                  } 
              />
              <Route 
                  path="/departments/new" 
                  element={
                      <ProtectedRoute>
                          <DepartmentCreatePage />
                      </ProtectedRoute>
                  } 
              />
              <Route 
                  path="/departments/:departmentId" 
                  element={
                      <ProtectedRoute>
                          <DepartmentDetailPage />
                      </ProtectedRoute>
                  } 
              />
              <Route 
                  path="/issues" 
                  element={
                      <ProtectedRoute>
                          <IssuesPage />
                      </ProtectedRoute>
                  } 
              />
              
              {/* Страница не найдена */}
              <Route path="*" element={<NotFoundPage />} />
          </Routes>
      </>
  );
}

export default App;