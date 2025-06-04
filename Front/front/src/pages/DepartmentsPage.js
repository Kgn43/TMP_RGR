import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/axiosSetup';
import '../stiles/DepartmentsPage.css';

const DepartmentsPage = () => {
    const [allDepartments, setAllDepartments] = useState([]);
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState('');
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
    const [actionMessageTimer, setActionMessageTimer] = useState(null); // Для хранения ID таймера

    // eslint-disable-next-line no-unused-vars
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.message) {
            if (actionMessageTimer) clearTimeout(actionMessageTimer);

            setActionMessage({ text: location.state.message, type: location.state.type });
            window.history.replaceState({}, document.title);

            const newTimer = setTimeout(() => {
                setActionMessage({ text: '', type: '' });
            }, 5000); 
            setActionMessageTimer(newTimer);
        }
        return () => {
            if (actionMessageTimer) clearTimeout(actionMessageTimer);
        };
    }, [location.state, actionMessageTimer]);


    

    //Функция для загрузки отделов
    const fetchDepartments = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/departments');
            setAllDepartments(response.data);
            const uniqueFloors = [...new Set(response.data.map(dept => dept.floor))].sort((a, b) => a - b);
            setFloors(uniqueFloors);
        } catch (err) {
            console.error("Ошибка при загрузке отделов:", err);
            if (err.response) {
                setError(`Ошибка API (${err.response.status}): ${err.response.data?.message || err.response.data?.details || err.response.statusText}`);
            } else {
                setError("Сетевая ошибка при загрузке отделов.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    //Фильтрация отделов
    useEffect(() => {
        if (selectedFloor === '') {
            setFilteredDepartments(allDepartments);
        } else {
            setFilteredDepartments(allDepartments.filter(dept => dept.floor === parseInt(selectedFloor, 10)));
        }
    }, [selectedFloor, allDepartments]);

    const handleFloorChange = (event) => {
        setSelectedFloor(event.target.value);
    };

    const handleDeleteDepartment = async (departmentId, departmentName) => {
        if (actionMessageTimer) clearTimeout(actionMessageTimer);
        setActionMessage({ text: '', type: '' });

        if (window.confirm(`Вы уверены, что хотите удалить отдел "${departmentName}"?`)) {
            try {
                await apiClient.delete(`/departments/${departmentId}`);
                setAllDepartments(prevDepartments => prevDepartments.filter(dept => dept.id !== departmentId));
                
                const successMsg = { text: `Отдел "${departmentName}" успешно удален.`, type: 'success' };
                setActionMessage(successMsg);
                const newTimer = setTimeout(() => setActionMessage({ text: '', type: '' }), 5000);
                setActionMessageTimer(newTimer);

            } catch (err) {
                console.error(`Ошибка при удалении отдела ${departmentId}:`, err);
                const errorMsgText = err.response?.data?.message || err.response?.data?.details || 'Ошибка сервера';
                const errorMsg = { text: `Не удалось удалить: ${errorMsgText}`, type: 'error' };
                setActionMessage(errorMsg);
            }
        }
    };

    if (isLoading) return <div className="loading-message">Загрузка отделов...</div>;
    if (error && allDepartments.length === 0) return <div className="error-message-page">{error}</div>;

    return (
        <div className="resource-list-page-container">
            <h1>Управление отделами</h1>

            <div className="controls-container">
                <div className="filter-group">
                    <label htmlFor="floor-select">Фильтр по этажу: </label>
                    <select id="floor-select" value={selectedFloor} onChange={handleFloorChange}>
                        <option value="">Все этажи</option>
                        {floors.map(floorNum => (
                            <option key={floorNum} value={floorNum.toString()}>
                                Этаж {floorNum}
                            </option>
                        ))}
                    </select>
                </div>
                <Link to="/departments/new" className="action-button add-button">
                    Добавить отдел
                </Link>
            </div>

            {actionMessage?.text && (
                <p className={`message-inline ${actionMessage.type === 'error' ? 'error-message-inline' : 'success-message-inline'}`}>
                    {actionMessage.text}
                </p>
            )}
            {/* Если была ошибка при загрузке, но какие-то данные уже есть */}
            {error && allDepartments.length > 0 && <p className="error-message-inline">{error}</p>}


            {filteredDepartments.length > 0 ? (
                <ul className="resource-item-list">
                    {filteredDepartments.map(dept => (
                        <li key={dept.id} className="resource-list-item">
                            <Link to={`/departments/${dept.id}`} className="resource-link">
                                <div className="resource-info">
                                    <span className="resource-name">{dept.name}</span>
                                    <span className="resource-detail">Этаж: {dept.floor}</span>
                                </div>
                            </Link>
                            <span className="resource-detail">
                                        Отв.: {dept.responsible_employee ? 
                                            `${dept.responsible_employee.name} ${dept.responsible_employee.surname}` 
                                            : 'Не назначен'}
                            </span>
                            <button
                                onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                className="delete-button action-button"
                                title="Удалить отдел"
                            >
                                ✖
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-resources-message">
                    {isLoading ? 'Загрузка...' : selectedFloor ? `Отделы на этаже "${selectedFloor}" не найдены.` : 'Список отделов пуст.'}
                </p>
            )}
        </div>
    );
};

export default DepartmentsPage;