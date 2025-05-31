import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../stiles/IssuesPage.css'; // Используем общие стили для списков

const STATUS_OPEN_ID = 1; // ID для статуса "Открыто" 
const STATUS_RESOLVED_ID = 2; // ID для статуса "Закрыто"

const IssuesPage = () => {
    const [allIssues, setAllIssues] = useState([]); // Храним все загруженные происшествия
    const [filteredIssues, setFilteredIssues] = useState([]); // Отфильтрованные для отображения
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'day', 'week'
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState(''); // Пустая строка - 'Все статусы'
    const [availableStatuses, setAvailableStatuses] = useState([]); // Для выпадающего списка статусов

    const fetchIssues = async () => {
        setIsLoading(true);
        setError('');
        setActionError('');
        const token = localStorage.getItem('accessToken');

        if (!token) { // Предполагаем, что список issues требует аутентификации/авторизации
            setError("Ошибка аутентификации: токен не найден.");
            setIsLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get('http://127.0.0.1:15000/api/issues', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const sortedIssues = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setAllIssues(sortedIssues); 
            const uniqueStatuses = [];
            const statusMap = new Map();
            response.data.forEach(issue => {
                const statusId = issue.status?.id || issue.status_id;
                const statusName = issue.status?.name || issue.status_name;
                if (statusId && statusName && !statusMap.has(statusId)) {
                    statusMap.set(statusId, statusName);
                    uniqueStatuses.push({ id: statusId, name: statusName });
                }
            });
            // Сортируем статусы по имени или ID для консистентности
            uniqueStatuses.sort((a, b) => a.name.localeCompare(b.name));
            setAvailableStatuses(uniqueStatuses);
            // setFilteredIssues(sortedIssues); // Это будет сделано в useEffect ниже
        }  catch (err) {
            console.error("Ошибка при загрузке происшествий:", err);
            if (err.response) {
                setError(`Ошибка API (${err.response.status}): ${err.response.data.message || err.response.data.details || err.response.statusText}`);
                if (err.response.status === 401 || err.response.status === 403) {
                    navigate('/login');
                }
            } else {
                setError("Сетевая ошибка при загрузке происшествий.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        let issuesToDisplay = [...allIssues];

        // 1. Фильтрация по времени
        if (timeFilter !== 'all') {
            const now = new Date();
            let timeLimit = new Date(now);
            if (timeFilter === 'day') {
                timeLimit.setDate(now.getDate() - 1);
            } else if (timeFilter === 'week') {
                timeLimit.setDate(now.getDate() - 7);
            }
            issuesToDisplay = issuesToDisplay.filter(issue => {
                if (!issue.created_at) return false;
                const issueDate = new Date(issue.created_at);
                return issueDate >= timeLimit;
            });
        }

        // 2. Фильтрация по статусу (применяется к уже отфильтрованным по времени)
        if (statusFilter !== '') { // Если выбран конкретный статус
            const selectedStatusId = parseInt(statusFilter, 10);
            issuesToDisplay = issuesToDisplay.filter(issue => (issue.status?.id || issue.status_id) === selectedStatusId);
        }

        setFilteredIssues(issuesToDisplay);
    }, [timeFilter, statusFilter, allIssues]);

    useEffect(() => {
        fetchIssues();
    }, [navigate]);

    const handleChangeStatus = async (issueId, currentStatusId, issueDescription) => {
        setActionError('');
        let newStatusId;
        let actionTextForConfirm; // Переименовал для ясности

        // Определяем новый статус и текст для подтверждения
        if (currentStatusId === STATUS_RESOLVED_ID) {
            newStatusId = STATUS_OPEN_ID;
            actionTextForConfirm = "вернуть в обработку";
        } else if (currentStatusId === STATUS_OPEN_ID) {
            newStatusId = STATUS_RESOLVED_ID;
            actionTextForConfirm = "закрыть инцидент";
        } else {
            setActionError("Для данного статуса действие не определено.");
            return;
        }

        if (window.confirm(`Вы уверены, что хотите ${actionTextForConfirm} происшествие: "${issueDescription}"?`)) {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setActionError("Ошибка аутентификации для выполнения действия.");
                navigate('/login');
                return;
            }
            try {
                await axios.put(`http://127.0.0.1:15000/api/issues/${issueId}`, 
                    { new_status_id: newStatusId }, 
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                fetchIssues(); // Перезапрашиваем все для обновления status_name
                alert(`Статус происшествия "${issueDescription}" успешно изменен.`);
                // Убрано дублирование setActionError, newStatusId, actionText здесь

            } catch (err) {
                console.error(`Ошибка при изменении статуса для issue ${issueId}:`, err);
                if (err.response && err.response.data) {
                    setActionError(`Не удалось изменить статус: ${err.response.data.message || err.response.data.details || 'Ошибка сервера'}`);
                } else {
                    setActionError("Сетевая ошибка при изменении статуса.");
                }
            }
        }
    };


    const getStatusClassName = (statusId) => {
        switch (statusId) {
            case STATUS_OPEN_ID: return 'status-badge status-open';
            case STATUS_RESOLVED_ID: return 'status-badge status-resolved';
            default: return 'status-badge status-unknown';
        }
    };

    const handleTimeFilterChange = (event) => {
        setTimeFilter(event.target.value);
    };

    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
    };

    if (isLoading) return <div className="loading-message">Загрузка происшествий...</div>;
    if (error) return <div className="error-message-page">{error}</div>;

     return (
        <div className="resource-list-page-container">
            <h1>Список происшествий</h1>

            <div className="controls-container issues-controls">
                <div className="filter-group">
                    <label htmlFor="time-filter-select">Показать за: </label>
                    <select id="time-filter-select" value={timeFilter} onChange={handleTimeFilterChange}>
                        <option value="all">Все время</option>
                        <option value="day">Последний день</option>
                        <option value="week">Последнюю неделю</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="status-filter-select">Фильтр по статусу: </label>
                    <select id="status-filter-select" value={statusFilter} onChange={handleStatusFilterChange} disabled={isLoading}>
                        <option value="">Все статусы</option>
                        {availableStatuses.map(status => (
                            <option key={status.id} value={status.id.toString()}>
                                {status.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>


            {actionError && <p className="error-message-inline">{actionError}</p>}

            {filteredIssues.length > 0 ? (
                <ul className="resource-item-list">
                    {filteredIssues.map(issue => (
                        
                         <li key={issue.id} className="resource-list-item">
                            <div className="resource-info issue-info">
                                <span className="issue-id">ID: {issue.id}</span>
                                <span className="issue-description" title={issue.description}>
                                    Описание: {issue.description.length > 50 ? `${issue.description.substring(0, 50)}...` : issue.description}
                                </span>
                                <span className="resource-detail">Отдел: {issue.department_name || issue.department?.name || 'N/A'}</span>
                                <div className="status-display-container">
                                    <span className="resource-detail">Статус: </span>
                                    <span className={getStatusClassName(issue.status_id || issue.status?.id)} >
                                        {issue.status_name || issue.status?.name || 'N/A'}
                                    </span>
                                </div>
                                <span className="resource-detail">
                                    Ответственный: {issue.responsible_employee ? 
                                        `${issue.responsible_employee.name} ${issue.responsible_employee.surname}` 
                                        : 'Не назначен'}
                                </span>
                                <span className="resource-detail">Создано: {issue.created_at ? new Date(issue.created_at).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div className="issue-actions">
                                {(issue.status_id === STATUS_OPEN_ID || (issue.status && issue.status.id === STATUS_OPEN_ID)) && (
                                    <button
                                        onClick={() => handleChangeStatus(issue.id, STATUS_OPEN_ID, issue.description)}
                                        className="status-action-button" 
                                        title="Происшествие устранено"
                                    >
                                        Закрыть инцидент
                                    </button>
                                )}
                                {(issue.status_id === STATUS_RESOLVED_ID || (issue.status && issue.status.id === STATUS_RESOLVED_ID)) && (
                                    <button
                                        onClick={() => handleChangeStatus(issue.id, STATUS_RESOLVED_ID, issue.description)}
                                        className="status-action-button" 
                                        title="Ошибочно выведено из работы"
                                    >
                                        Вернуть в обработку
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-resources-message">
                    {(timeFilter !== 'all' || statusFilter !== '') ? 'Происшествия по заданным фильтрам не найдены.' : 'Список происшествий пуст или не удалось загрузить.'}
                </p>
            )}
        </div>
    );
};

export default IssuesPage;