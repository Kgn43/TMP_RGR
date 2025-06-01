import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/axiosSetup';
import '../stiles/Home.css';

const Home = () => {
    const [departments, setDepartments] = useState([]);
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [selectedDept, setSelectedDept] = useState(null);
    const [description, setDescription] = useState('');
    
    //Состояния для выпадающих списков
    const [isFloorOpen, setIsFloorOpen] = useState(false);
    const [isDeptOpen, setIsDeptOpen] = useState(false);

    //Состояния для загрузки и ошибок
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [departmentError, setDepartmentError] = useState('');
    const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
    const [issueSubmitMessage, setIssueSubmitMessage] = useState(''); // Для сообщений об успехе/ошибке

    // Рефы для выпадающих списков (для handleClickOutside)
    const floorDropdownRef = useRef(null);
    const deptDropdownRef = useRef(null);

    // Загрузка отделов
    useEffect(() => {
        const fetchDepartments = async () => {
            setIsLoadingDepartments(true);
            setDepartmentError('');
            try {
                const response = await apiClient.get("/departments");
                const depts = response.data;
                setDepartments(depts);

                const uniqueFloors = [...new Set(depts.map(d => d.floor))].sort((a, b) => a - b);
                setFloors(uniqueFloors);

            } catch (error) {
                console.error("Error fetching departments:", error);
                setDepartmentError(error.response?.data?.message || error.message || "Не удалось загрузить отделы.");
            } finally {
                setIsLoadingDepartments(false);
            }
        };

        fetchDepartments();
    }, []);

    useEffect(() => {
        setSelectedDept(null); //Сбрасываем выбранный отдел
        setIsDeptOpen(false);  
    }, [selectedFloor]);

    const filteredDepartments = selectedFloor
        ? departments.filter(d => d.floor === selectedFloor)
        : [];

    const handleSubmit = async () => {
        if (!selectedDept || !description.trim()) {
            setIssueSubmitMessage('Ошибка: Заполните все поля!');
            return;
        }

        setIsSubmittingIssue(true);
        setIssueSubmitMessage('');
        try {
            await apiClient.post("/issues", {
                department_id: selectedDept.id,
                description: description.trim()
            });
            setIssueSubmitMessage('Сообщение успешно отправлено!');
            setDescription('');
            // setSelectedDept(null);
            // setSelectedFloor(null);
        } catch (error) {
            console.error("Error submitting issue:", error);
            setIssueSubmitMessage(error.response?.data?.message || error.message || "Ошибка при отправке сообщения.");
        } finally {
            setIsSubmittingIssue(false);
        }
    };

    //Закрытие выпадающих списков при клике вне их
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (floorDropdownRef.current && !floorDropdownRef.current.contains(event.target)) {
                setIsFloorOpen(false);
            }
            if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
                setIsDeptOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    if (isLoadingDepartments) {
        return <div className="incident-container">Загрузка данных об отделах...</div>;
    }

    if (departmentError) {
        return <div className="incident-container error-message">Ошибка: {departmentError}</div>;
    }

    return (
        <div className="incident-container">
            <h1>Сообщить охране о происшествии</h1>

            <div className="dropdown-wrapper" ref={floorDropdownRef}> {/* <--- Добавил ref */}
                <div className={`dropdown ${isFloorOpen ? 'open' : ''}`}>
                    <div
                        className="dropdown-header"
                        onClick={() => {
                            setIsFloorOpen(!isFloorOpen);
                            if (isDeptOpen) setIsDeptOpen(false); // Закрываем другой список при открытии этого
                        }}
                        role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setIsFloorOpen(!isFloorOpen)}
                    >
                        {selectedFloor ? `Этаж ${selectedFloor}` : 'Выберите этаж'}
                        <span className={`arrow ${isFloorOpen ? 'up' : 'down'}`}>▼</span>
                    </div>
                    {isFloorOpen && (
                        <div className="dropdown-list">
                            {floors.length > 0 ? floors.map(floor => (
                                <div
                                    key={floor}
                                    className="dropdown-item"
                                    onClick={() => {
                                        setSelectedFloor(floor); // Устанавливаем этаж
                                        setIsFloorOpen(false);   // Закрываем текущий список
                                        // Не открываем список отделов здесь принудительно,
                                        // useEffect по selectedFloor сбросит selectedDept,
                                        // а пользователь сам откроет список отделов, если нужно.
                                        // Либо, если хочешь авто-открытие, можно сделать так:
                                        // if (departments.filter(d => d.floor === floor).length > 0) {
                                        //    setIsDeptOpen(true);
                                        // }
                                    }}
                                >
                                    Этаж {floor}
                                </div>
                            )) : <div className="dropdown-item disabled">Нет доступных этажей</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Условие отображения списка отделов: selectedFloor ДОЛЖЕН быть выбран */}
            {selectedFloor !== null && ( // <--- Изменил условие здесь
                <div className="dropdown-wrapper" ref={deptDropdownRef}> {/* <--- Добавил ref */}
                    <div className={`dropdown ${isDeptOpen ? 'open' : ''}`}>
                        <div
                            className="dropdown-header"
                            onClick={() => {
                                if (filteredDepartments.length > 0) { // Открываем только если есть что показывать
                                    setIsDeptOpen(!isDeptOpen);
                                    if (isFloorOpen) setIsFloorOpen(false); // Закрываем другой список
                                }
                            }}
                            role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setIsDeptOpen(!isDeptOpen)}
                        >
                            {selectedDept ? selectedDept.name : (filteredDepartments.length > 0 ? 'Выберите отдел' : 'Нет отделов на этаже')}
                            {filteredDepartments.length > 0 && <span className={`arrow ${isDeptOpen ? 'up' : 'down'}`}>▼</span>}
                        </div>
                        {isDeptOpen && filteredDepartments.length > 0 && (
                            <div className="dropdown-list">
                                {filteredDepartments.map(dept => (
                                    <div
                                        key={dept.id}
                                        className="dropdown-item"
                                        onClick={() => {
                                            setSelectedDept(dept);
                                            setIsDeptOpen(false);
                                        }}
                                    >
                                        {dept.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Поле описания */}
            <div className="description-field">
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опишите проблему"
                    rows={4}
                />
            </div>

            {/* Сообщение о результате отправки */}
            {issueSubmitMessage && (
                <p className={issueSubmitMessage.startsWith('Ошибка') ? 'error-message' : 'success-message'}>
                    {issueSubmitMessage}
                </p>
            )}

            {/* Кнопка тревоги */}
            <button
                className="alarm-button"
                onClick={handleSubmit}
                disabled={!selectedDept || !description.trim() }
            >
                {isSubmittingIssue ? 'Отправка...' : 'Оповестить'}
            </button>
        </div>
    );
};

export default Home;