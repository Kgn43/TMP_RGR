import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../stiles/Home.css';


const Home = () => {
    const [departments, setDepartments] = useState([]);
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [selectedDept, setSelectedDept] = useState(null);
    const [description, setDescription] = useState('');
    const [isFloorOpen, setIsFloorOpen] = useState(false);
    const [isDeptOpen, setIsDeptOpen] = useState(false);

    useEffect(() => {
        axios.get("http://127.0.0.1:15000/api/departments") //  /api/departments
            .then(res => {
                const depts = res.data;
                setDepartments(depts);

                // Автоматически определяем этажи из отделов
                const uniqueFloors = [...new Set(depts.map(d => d.floor))].sort();
                setFloors(uniqueFloors);

                // Устанавливаем первый этаж по умолчанию
                if (uniqueFloors.length > 0) {
                    setSelectedFloor(uniqueFloors[0]);
                }
            });
    }, []);

    // Сбрасываем выбранный отдел при изменении этажа
    useEffect(() => {
        setSelectedDept(null);
    }, [selectedFloor]);

    const filteredDepartments = selectedFloor
        ? departments.filter(d => d.floor === selectedFloor)
        : [];

    const handleSubmit = () => {
        if (!selectedDept || !description.trim()) {
            alert('Заполните все поля!');
            return;
        }

        axios.post("http://127.0.0.1:15000/api/issues", { //    axios.post('/api/issues', {
            department_id: selectedDept.id,
            description: description.trim()
        })
            .then(() => {
                alert('Тревога отправлена!');
                setDescription('');
                setSelectedDept(null);
            });
    };

    return (
        <div className="incident-container">
            <h1>Сообщить охране о происшествии</h1>

            {/* Выбор этажа */}
            <div className={`dropdown ${isFloorOpen ? 'open' : ''}`}>
                <div
                    className="dropdown-header"
                    onClick={() => setIsFloorOpen(!isFloorOpen)}
                >
                    {selectedFloor ? `Этаж ${selectedFloor}` : 'Выберите этаж'}
                    <span className="arrow">▼</span>
                </div>
                {isFloorOpen && (
                    <div className="dropdown-list">
                        {floors.map(floor => (
                            <div
                                key={floor}
                                className="dropdown-item"
                                onClick={() => {
                                    setSelectedFloor(floor);
                                    setIsFloorOpen(false);
                                    setIsDeptOpen(true);
                                }}
                            >
                                Этаж {floor}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Выбор отдела */}
            {selectedFloor && (
                <div className={`dropdown ${isDeptOpen ? 'open' : ''}`}>
                    <div
                        className="dropdown-header"
                        onClick={() => setIsDeptOpen(!isDeptOpen)}
                    >
                        {selectedDept ? selectedDept.name : 'Выберите отдел'}
                        <span className="arrow">▼</span>
                    </div>
                    {isDeptOpen && (
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
            )}

            {/* Поле описания */}
            <div className="description-field">
        <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите проблему"
            className={!description ? 'placeholder-visible' : ''}
        />
            </div>

            {/* Кнопка тревоги */}
            <button
                className="alarm-button"
                onClick={handleSubmit}
                disabled={!selectedDept || !description.trim()}
            >
                Оповестить
            </button>
        </div>
    );
};

export default Home;