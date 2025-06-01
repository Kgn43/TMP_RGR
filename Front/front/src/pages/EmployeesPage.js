import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/axiosSetup'; 
import '../stiles/EmployeesPage.css';

const EmployeesPage = () => {
    const [allEmployees, setAllEmployees] = useState([]);
    const [roles, setRoles] = useState([]); //Будем хранить объекты ролей {id, name}
    const [selectedRoleId, setSelectedRoleId] = useState('');//Фильтруем по ID роли
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    const fetchEmployeesAndRoles = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const employeesResponse = await apiClient.get('/employees');
            const employeesData = employeesResponse.data;
            setAllEmployees(employeesData);

            // Извлекаем уникальные роли из полученных сотрудников
            const uniqueRolesMap = new Map();
            employeesData.forEach(emp => {
                // Используем emp.role_id и emp.role (текстовое имя роли)
                if (emp.role_id !== undefined && emp.role && !uniqueRolesMap.has(emp.role_id)) {
                    uniqueRolesMap.set(emp.role_id, { id: emp.role_id, name: emp.role });
                }
            });
            // Сортируем роли по имени для отображения в селекте
            setRoles(Array.from(uniqueRolesMap.values()).sort((a, b) => a.name.localeCompare(b.name)));

        } catch (err) {
            console.error("Ошибка при загрузке сотрудников:", err);
            if (err.response) {
                setError(`Ошибка API (${err.response.status}): ${err.response.data?.message || err.response.data?.details || err.response.statusText}`);
            } else {
                setError("Сетевая ошибка при загрузке сотрудников.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployeesAndRoles();
    }, [fetchEmployeesAndRoles]);

    // Фильтрация сотрудников
    useEffect(() => {
        if (selectedRoleId === '') {
            setFilteredEmployees(allEmployees);
        } else {
            const roleIdToCompare = parseInt(selectedRoleId, 10);
            setFilteredEmployees(
                allEmployees.filter(emp => emp.role_id === roleIdToCompare)
            );
        }
    }, [selectedRoleId, allEmployees]);

    const handleRoleChange = (event) => {
        setSelectedRoleId(event.target.value);
    };

    const handleDeleteEmployee = async (employeeId, employeeName) => {
        setActionMessage('');
        if (window.confirm(`Вы уверены, что хотите удалить сотрудника ${employeeName}?`)) {
            try {
                await apiClient.delete(`/employees/${employeeId}`);
                setAllEmployees(prevEmployees => prevEmployees.filter(emp => emp.id !== employeeId));
                setActionMessage({ text: `Сотрудник ${employeeName} успешно удален.`, type: 'success' });
            } catch (err) {
                console.error(`Ошибка при удалении сотрудника ${employeeId}:`, err);
                const errorMsg = err.response?.data?.message || err.response?.data?.details || 'Ошибка сервера';
                setActionMessage({ text: `Не удалось удалить: ${errorMsg}`, type: 'error' });
            }
        }
    };

    if (isLoading) return <div className="loading-message">Загрузка сотрудников...</div>;
    if (error && allEmployees.length === 0) return <div className="error-message-page">{error}</div>;

    return (
        <div className="employees-page-container resource-list-page-container">
            <h1>Управление сотрудниками</h1>

            <div className="controls-container">
                <div className="filter-group">
                    <label htmlFor="role-select">Фильтр по роли: </label>
                    <select id="role-select" value={selectedRoleId} onChange={handleRoleChange}>
                        <option value="">Все роли</option>
                        {/* roles теперь содержит объекты {id, name}, где name взят из emp.role */}
                        {roles.map(roleObj => (
                            <option key={roleObj.id} value={roleObj.id.toString()}>
                                {roleObj.name} 
                            </option>
                        ))}
                    </select>
                </div>
                <Link to="/employees/new" className="action-button add-employee-button">
                    Добавить сотрудника
                </Link>
            </div>

            {actionMessage && (
                <p className={`message-inline ${actionMessage.type === 'error' ? 'error-message-inline' : 'success-message-inline'}`}>
                    {actionMessage.text}
                </p>
            )}
            {error && allEmployees.length > 0 && <p className="error-message-inline">{error}</p>}


            {filteredEmployees.length > 0 ? (
                <ul className="employee-list resource-item-list">
                    {filteredEmployees.map(employee => (
                        <li key={employee.id} className="employee-list-item resource-list-item">
                            <div className="employee-info resource-info">
                                <Link to={`/employees/${employee.id}`} className="employee-link">
                                    {employee.name} {employee.surname} ({employee.login})
                                </Link>
                                {/* Отображаем employee.role напрямую */}
                                <span className="employee-role resource-detail"> - {employee.role || 'N/A'}</span>
                            </div>
                            <button
                                onClick={() => handleDeleteEmployee(employee.id, `${employee.name} ${employee.surname}`)}
                                className="delete-button action-button"
                                title="Удалить сотрудника"
                            >
                                ✖
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-resources-message">
                    {isLoading ? 'Загрузка...' : selectedRoleId ? `Сотрудники с выбранной ролью не найдены.` : 'Список сотрудников пуст.'}
                </p>
            )}
        </div>
    );
};

export default EmployeesPage;