import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../stiles/EmployeeForm.css';

// Предположим, ID роли "Менеджер" (или той, которая может быть ответственной) равен 2
const RESPONSIBLE_EMPLOYEE_ROLE_ID = 2; 

const DepartmentCreatePage = () => {
    const [formData, setFormData] = useState({
        name: '',
        floor: '',
        responsible_employee_id: ''
    });
    const [employees, setEmployees] = useState([]); // Для выпадающего списка сотрудников
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Общий флаг для загрузки и отправки
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
    const navigate = useNavigate();
    const [allEmployees, setAllEmployees] = useState([]); // Все загруженные сотрудники
    const [responsibleEmployeesList, setResponsibleEmployeesList] = useState([]); // Отфильтрованные для выбора


    useEffect(() => {
        const fetchEmployeesForSelect = async () => {
            setIsLoadingEmployees(true);
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setGeneralError("Ошибка аутентификации для загрузки списка сотрудников.");
                setIsLoadingEmployees(false);
                navigate('/login');
                return;
            }
            try {
                const response = await axios.get('http://127.0.0.1:15000/api/employees', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAllEmployees(response.data); // Сохраняем всех сотрудников
                // Фильтруем сотрудников по role_id
                const filteredForResponsible = response.data.filter(
                    emp => emp.role_id === RESPONSIBLE_EMPLOYEE_ROLE_ID // Используйте emp.role.id, если структура другая
                );
                setResponsibleEmployeesList(filteredForResponsible);

            } catch (error) {
                console.error("Ошибка при загрузке сотрудников для выбора:", error);
                setGeneralError("Не удалось загрузить список сотрудников.");
                setAllEmployees([]); // Очищаем, если ошибка
                setResponsibleEmployeesList([]);
            } finally {
                setIsLoadingEmployees(false);
            }
        };
        fetchEmployeesForSelect();
    }, [navigate]); // navigate добавлен, т.к. используется

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim() || formData.name.trim().length > 50) {
            newErrors.name = "Название отдела: 1-50 символов.";
        }
        const floorNum = parseInt(formData.floor, 10);
        if (isNaN(floorNum) || floorNum < 1 || floorNum > 3) {
            newErrors.floor = "Этаж должен быть числом от 1 до 3.";
        }
        if (!formData.responsible_employee_id) {
            newErrors.responsible_employee_id = "Необходимо выбрать ответственного сотрудника.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setGeneralError('');
        if (!validateForm()) {
            setGeneralError("Пожалуйста, исправьте ошибки в форме.");
            return;
        }

        setIsLoading(true); // Используем общий isLoading для процесса отправки
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setGeneralError("Ошибка аутентификации. Пожалуйста, войдите снова.");
            setIsLoading(false);
            navigate('/login');
            return;
        }

        try {
            const departmentDataToSend = {
                name: formData.name.trim(),
                floor: parseInt(formData.floor, 10),
                responsible_employee_id: parseInt(formData.responsible_employee_id, 10)
            };

            await axios.post('http://127.0.0.1:15000/api/departments', departmentDataToSend, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('Отдел успешно добавлен!');
            navigate('/departments');

        } catch (err) {
            console.error("Ошибка при создании отдела:", err);
            if (err.response && err.response.data) {
                const apiError = err.response.data;
                if (err.response.status === 422 && apiError.errors) {
                    setErrors(prev => ({ ...prev, ...apiError.errors }));
                    setGeneralError(apiError.message || 'Пожалуйста, исправьте ошибки в форме.');
                } else if (err.response.status === 409 && apiError.errors && apiError.errors.name) { // Пример для уникальности имени
                    setErrors(prev => ({ ...prev, name: apiError.errors.name }));
                    setGeneralError(apiError.message || 'Ошибка конфликта данных.');
                } else {
                    setGeneralError(apiError.message || apiError.details || 'Произошла ошибка при создании отдела.');
                }
            } else {
                setGeneralError("Сетевая ошибка или сервер недоступен.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="employee-form-page-container">
            <div className="employee-form-container">
                <h1>Добавить новый отдел</h1>
                <form onSubmit={handleSubmit}>
                    {/* ... (поля Название отдела, Этаж) ... */}
                     <div className="form-group">
                        <label htmlFor="name">Название отдела</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} disabled={isLoading} className={errors.name ? 'input-error' : ''} />
                        {errors.name && <p className="field-error-message">{errors.name}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="floor">Этаж (1-3)</label>
                        <input type="number" id="floor" name="floor" value={formData.floor} onChange={handleChange} min="1" max="3" disabled={isLoading} className={errors.floor ? 'input-error' : ''} />
                        {errors.floor && <p className="field-error-message">{errors.floor}</p>}
                    </div>


                    {/* Ответственный сотрудник */}
                    <div className="form-group">
                        <label htmlFor="responsible_employee_id">Ответственный сотрудник</label>
                        {isLoadingEmployees ? (
                            <p>Загрузка сотрудников...</p>
                        ) : responsibleEmployeesList.length > 0 ? ( // Используем отфильтрованный список
                            <select 
                                id="responsible_employee_id" 
                                name="responsible_employee_id" 
                                value={formData.responsible_employee_id} 
                                onChange={handleChange} 
                                disabled={isLoading} 
                                className={errors.responsible_employee_id ? 'input-error' : ''}
                            >
                                <option value="">Выберите сотрудника...</option>
                                {responsibleEmployeesList.map(emp => ( // Итерируемся по responsibleEmployeesList
                                    <option key={emp.id} value={emp.id.toString()}>
                                        {emp.name} {emp.surname} ({emp.login})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="field-error-message">Нет доступных сотрудников с ролью ID {RESPONSIBLE_EMPLOYEE_ROLE_ID} для назначения ответственными или не удалось загрузить список.</p>
                        )}
                        {errors.responsible_employee_id && <p className="field-error-message">{errors.responsible_employee_id}</p>}
                    </div>
                    
                    {generalError && <p className="error-message global-form-error">{generalError}</p>}

                    <div className="form-actions">
                        <button type="submit" className="form-button submit-button" disabled={isLoading || isLoadingEmployees}>
                            {isLoading ? 'Сохранение...' : 'Создать отдел'}
                        </button>
                        <Link to="/departments" className="form-button cancel-button">Отмена</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentCreatePage;