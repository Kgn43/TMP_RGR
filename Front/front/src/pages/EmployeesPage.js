import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../stiles/EmployeesPage.css'; // Убедитесь, что стили подключены

const EmployeesPage = () => {
    const [allEmployees, setAllEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState(''); // Для ошибок удаления/действий
    const navigate = useNavigate();

    // Функция для загрузки сотрудников
    const fetchEmployees = async () => {
        setIsLoading(true);
        setError('');
        setActionError(''); // Сбрасываем ошибку действия
        const token = localStorage.getItem('accessToken');

        if (!token) {
            setError("Ошибка аутентификации: токен не найден.");
            setIsLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get('http://127.0.0.1:15000/api/employees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllEmployees(response.data);
            const uniqueRoles = [...new Set(response.data.map(emp => emp.role).filter(Boolean))].sort();
            setRoles(uniqueRoles);
            // Фильтрация будет применена в useEffect ниже
        } catch (err) {
            console.error("Ошибка при загрузке сотрудников:", err);
            if (err.response) {
                setError(`Ошибка API (${err.response.status}): ${err.response.data.message || err.response.data.details || err.response.statusText}`);
                if (err.response.status === 401 || err.response.status === 403) {
                    navigate('/login');
                }
            } else {
                setError("Сетевая ошибка при загрузке сотрудников.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [navigate]); // Зависимость от navigate, так как используется внутри

    // Фильтрация сотрудников при изменении выбранной роли или общего списка
    useEffect(() => {
        if (selectedRole === '') {
            setFilteredEmployees(allEmployees);
        } else {
            setFilteredEmployees(allEmployees.filter(emp => emp.role === selectedRole));
        }
    }, [selectedRole, allEmployees]);

    const handleRoleChange = (event) => {
        setSelectedRole(event.target.value);
    };

    const handleDeleteEmployee = async (employeeId, employeeName) => {
        setActionError(''); // Сбрасываем предыдущую ошибку действия
        if (window.confirm(`Вы уверены, что хотите удалить сотрудника ${employeeName}?`)) {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setActionError("Ошибка аутентификации для выполнения действия.");
                navigate('/login');
                return;
            }
            try {
                await axios.delete(`http://127.0.0.1:15000/api/employees/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Обновляем списки сотрудников после успешного удаления
                setAllEmployees(prevEmployees => prevEmployees.filter(emp => emp.id !== employeeId));
                // setFilteredEmployees останется актуальным благодаря useEffect, который следит за allEmployees
                alert(`Сотрудник ${employeeName} успешно удален.`); // Или более мягкое уведомление
            } catch (err) {
                console.error(`Ошибка при удалении сотрудника ${employeeId}:`, err);
                if (err.response && err.response.data) {
                    setActionError(`Не удалось удалить: ${err.response.data.message || err.response.data.details || 'Неизвестная ошибка сервера'}`);
                } else {
                    setActionError("Сетевая ошибка при удалении сотрудника.");
                }
            }
        }
    };


    if (isLoading) return <div className="loading-message">Загрузка сотрудников...</div>;
    if (error) return <div className="error-message-page">{error}</div>;

    return (
        <div className="employees-page-container">
            <h1>Управление сотрудниками</h1>

            <div className="controls-container">
                <div className="role-filter">
                    <label htmlFor="role-select">Фильтр по роли: </label>
                    <select id="role-select" value={selectedRole} onChange={handleRoleChange}>
                        <option value="">Все роли</option>
                        {roles.map(roleName => (
                            <option key={roleName} value={roleName}>
                                {roleName}
                            </option>
                        ))}
                    </select>
                </div>
                <Link to="/employees/new" className="action-button add-employee-button">
                    Добавить сотрудника
                </Link>
            </div>

            {actionError && <p className="error-message-inline">{actionError}</p>}

            {filteredEmployees.length > 0 ? (
                <ul className="employee-list">
                    {filteredEmployees.map(employee => (
                        <li key={employee.id} className="employee-list-item">
                            <div className="employee-info">
                                <Link to={`/employees/${employee.id}`} className="employee-link">
                                    {employee.name} {employee.surname} ({employee.login})
                                </Link>
                                <span className="employee-role"> - {employee.role}</span>
                            </div>
                            <button
                                onClick={() => handleDeleteEmployee(employee.id, `${employee.name} ${employee.surname}`)}
                                className="delete-button"
                                title="Удалить сотрудника" 
                            >
                                ✖ {/* HTML-код для крестика (✕) */}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-employees-message">
                    {selectedRole ? `Сотрудники с ролью "${selectedRole}" не найдены.` : 'Список сотрудников пуст или не удалось загрузить.'}
                </p>
            )}
        </div>
    );
};

export default EmployeesPage;