import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../stiles/DepartmentsPage.css';

const DepartmentsPage = () => {
    const [allDepartments, setAllDepartments] = useState([]);
    const [floors, setFloors] = useState([]); // Список уникальных этажей для фильтра
    const [selectedFloor, setSelectedFloor] = useState(''); // Выбранный этаж (пусто - "Все этажи")
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const navigate = useNavigate();

    const fetchDepartments = async () => {
        setIsLoading(true);
        setError('');
        setActionError('');

        try {
            const response = await axios.get('http://127.0.0.1:15000/api/departments');
            setAllDepartments(response.data);
            //Извлекаем уникальные этажи и сортируем их
            const uniqueFloors = [...new Set(response.data.map(dept => dept.floor))].sort((a, b) => a - b);
            setFloors(uniqueFloors);
        } catch (err) {
            console.error("Ошибка при загрузке отделов:", err);
            if (err.response) {
                setError(`Ошибка API (${err.response.status}): ${err.response.data.message || err.response.data.details || err.response.statusText}`);
            } else {
                setError("Сетевая ошибка при загрузке отделов.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

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
        setActionError('');
        if (window.confirm(`Вы уверены, что хотите удалить отдел "${departmentName}"?`)) {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setActionError("Ошибка аутентификации для выполнения действия.");
                navigate('/login');
                return;
            }
            try {
                await axios.delete(`http://127.0.0.1:15000/api/departments/${departmentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAllDepartments(prevDepartments => prevDepartments.filter(dept => dept.id !== departmentId));
                alert(`Отдел "${departmentName}" успешно удален.`);
            } catch (err) {
                console.error(`Ошибка при удалении отдела ${departmentId}:`, err);
                if (err.response && err.response.data) {
                    setActionError(`Не удалось удалить: ${err.response.data.message || err.response.data.details || 'Ошибка сервера'}`);
                } else {
                    setActionError("Сетевая ошибка при удалении отдела.");
                }
            }
        }
    };

    if (isLoading) return <div className="loading-message">Загрузка отделов...</div>;
    if (error) return <div className="error-message-page">{error}</div>;

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

            {actionError && <p className="error-message-inline">{actionError}</p>}

            {filteredDepartments.length > 0 ? (
                <ul className="resource-item-list">
                    {filteredDepartments.map(dept => (
                        <li key={dept.id} className="resource-list-item"> {/* Общий класс для элемента списка */}
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
                                className="delete-button"
                                title="Удалить отдел"
                            >
                                ✖
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-resources-message">
                    {selectedFloor ? `Отделы на этаже "${selectedFloor}" не найдены.` : 'Список отделов пуст или не удалось загрузить.'}
                </p>
            )}
        </div>
    );
};

export default DepartmentsPage;