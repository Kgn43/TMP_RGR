import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/axiosSetup';
import '../stiles/IssuesPage.css';

const STATUS_OPEN_ID = 1;
const STATUS_RESOLVED_ID = 2;

const IssuesPage = () => {
    const [allIssues, setAllIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(''); 
    const [actionMessage, setActionMessage] = useState('');

    const [timeFilter, setTimeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('');
    const [availableStatuses, setAvailableStatuses] = useState([]);

    //Функция загрузки инцидентов
    const fetchIssues = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/issues');
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
            uniqueStatuses.sort((a, b) => a.name.localeCompare(b.name));
            setAvailableStatuses(uniqueStatuses);
        } catch (err) {
            console.error("Ошибка при загрузке происшествий:", err);
            if (err.response) {
                setError(`Ошибка API (${err.response.status}): ${err.response.data?.message || err.response.data?.details || err.response.statusText}`);
            } else {
                setError("Сетевая ошибка при загрузке происшествий.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    //Применение фильтров
    useEffect(() => {
        let issuesToDisplay = [...allIssues];
        if (timeFilter !== 'all') {
            const now = new Date();
            let timeLimit = new Date(now);
            if (timeFilter === 'day') timeLimit.setDate(now.getDate() - 1);
            else if (timeFilter === 'week') timeLimit.setDate(now.getDate() - 7);
            issuesToDisplay = issuesToDisplay.filter(issue => {
                if (!issue.created_at) return false;
                return new Date(issue.created_at) >= timeLimit;
            });
        }
        if (statusFilter !== '') {
            const selectedStatusId = parseInt(statusFilter, 10);
            issuesToDisplay = issuesToDisplay.filter(issue => (issue.status?.id || issue.status_id) === selectedStatusId);
        }
        setFilteredIssues(issuesToDisplay);
    }, [timeFilter, statusFilter, allIssues]);

    //Начальная загрузка
    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    //Изменение статуса
    const handleChangeStatus = async (issueId, currentStatusId, issueDescription) => {
        setActionMessage('');
        let newStatusId;
        let actionTextForConfirm;

        if (currentStatusId === STATUS_RESOLVED_ID) {
            newStatusId = STATUS_OPEN_ID;
            actionTextForConfirm = "вернуть в обработку";
        } else if (currentStatusId === STATUS_OPEN_ID) {
            newStatusId = STATUS_RESOLVED_ID;
            actionTextForConfirm = "закрыть инцидент";
        } else {
            setActionMessage({ text: "Для данного статуса действие не определено.", type: 'error' });
            return;
        }

        if (window.confirm(`Вы уверены, что хотите ${actionTextForConfirm} происшествие: "${issueDescription}"?`)) {
            try {
                await apiClient.put(`/issues/${issueId}`, { new_status_id: newStatusId });
                setActionMessage({ text: `Статус происшествия "${issueDescription}" успешно изменен.`, type: 'success' });
                fetchIssues(); // Перезагружаем список для обновления
            } catch (err) {
                console.error(`Ошибка при изменении статуса для issue ${issueId}:`, err);
                const errorMsg = err.response?.data?.message || err.response?.data?.details || 'Ошибка сервера';
                setActionMessage({ text: `Не удалось изменить статус: ${errorMsg}`, type: 'error' });
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

    const handleTimeFilterChange = (event) => setTimeFilter(event.target.value);
    const handleStatusFilterChange = (event) => setStatusFilter(event.target.value);

    if (isLoading) return <div className="loading-message">Загрузка происшествий...</div>;
    if (error && allIssues.length === 0) return <div className="error-message-page">{error}</div>;

    return (
        <div className="resource-list-page-container">
            <h1>Список происшествий</h1>

            <div className="controls-container issues-controls">
                {/* фильтры */}
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
                    <select id="status-filter-select" value={statusFilter} onChange={handleStatusFilterChange} disabled={isLoading /* или isFetchingStatuses */}>
                        <option value="">Все статусы</option>
                        {availableStatuses.map(status => (
                            <option key={status.id} value={status.id.toString()}>
                                {status.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Сообщение об ошибке/успехе для действий */}
            {actionMessage && (
                <p className={`message-inline ${actionMessage.type === 'error' ? 'error-message-inline' : 'success-message-inline'}`}>
                    {actionMessage.text}
                </p>
            )}
            {/* Если была ошибка при загрузке, но какие-то данные уже есть, можно показать ее здесь */}
            {error && allIssues.length > 0 && <p className="error-message-inline">{error}</p>}


            {filteredIssues.length > 0 ? (
                <ul className="resource-item-list">
                    {filteredIssues.map(issue => (
                        <li key={issue.id} className="resource-list-item">
                            <div className="resource-info issue-info">
                                {/* отображение деталей инцидента  */}
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
                                {/* кнопки действий  */}
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
                    {isLoading ? 'Загрузка...' : (timeFilter !== 'all' || statusFilter !== '') ? 'Происшествия по заданным фильтрам не найдены.' : 'Список происшествий пуст.'}
                </p>
            )}
        </div>
    );
};

export default IssuesPage;