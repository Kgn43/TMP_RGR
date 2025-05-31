import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import '../stiles/EmployeeForm.css';

const RESPONSIBLE_EMPLOYEE_ROLE_ID = 2; // ID роли для ответственных

const DepartmentEditPage = () => {
    const { departmentId } = useParams();
    const [formData, setFormData] = useState({
        name: '',
        floor: '',
        responsible_employee_id: ''
    });
    const [employees, setEmployees] = useState([]);
    const [initialDepartmentName, setInitialDepartmentName] = useState('');
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true); // Для общей загрузки
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]); // Все сотрудники
    const [responsibleEmployeesList, setResponsibleEmployeesList] = useState([]); // Отфильтрованные
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(true); // Отдельно для списка сотрудников
    const navigate = useNavigate();


    // Загрузка сотрудников для выпадающего списка
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
                const filteredForResponsible = response.data.filter(
                    emp => emp.role_id === RESPONSIBLE_EMPLOYEE_ROLE_ID
                );
                setResponsibleEmployeesList(filteredForResponsible); // В этот список попадут ВСЕ с role_id = 2
            } catch (error) {
                console.error("Ошибка при загрузке сотрудников для выбора:", error);
                setResponsibleEmployeesList([]);
            } finally {
                setIsLoadingEmployees(false);
            }
        };
        fetchEmployeesForSelect();
    }, []);

    // Загрузка данных отдела для редактирования
    const fetchDepartmentData = useCallback(async () => {
        setIsLoadingData(true); // Ставим в true здесь
        setGeneralError('');
        const token = localStorage.getItem('accessToken');
        // Эндпоинт /api/departments/{id} (GET) должен быть защищен JWT, если редактирование требует прав
        if (!token) {
            setGeneralError("Ошибка аутентификации.");
            setIsLoadingData(false);
            navigate('/login');
            return;
        }
        try {
            const response = await axios.get(`http://127.0.0.1:15000/api/departments/${departmentId}`, {
                 headers: { Authorization: `Bearer ${token}` }
            });
            const deptData = response.data;
            setFormData({
                name: deptData.name || '',
                floor: deptData.floor ? deptData.floor.toString() : '',
                responsible_employee_id: deptData.responsible_employee_id ? deptData.responsible_employee_id.toString() : ''
            });
            setInitialDepartmentName(deptData.name || '');
        } catch (err) {
            console.error(`Ошибка при загрузке данных отдела ${departmentId}:`, err);
            if (err.response) {
                setGeneralError(`Ошибка API (${err.response.status}): ${err.response.data.message || err.response.data.details || err.response.statusText}`);
                if (err.response.status === 404) navigate('/departments');
            } else {
                setGeneralError("Сетевая ошибка при загрузке данных отдела.");
            }
        } finally {
            setIsLoadingData(false); 
        }
    }, [departmentId, navigate]);

    useEffect(() => {
        fetchDepartmentData();
    }, [fetchDepartmentData]);

    
    const overallIsLoading = isLoadingData || isLoadingEmployees;


    if (overallIsLoading) { // Используем общий флаг загрузки
        return <div className="loading-message">Загрузка данных...</div>;
    }

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

        setIsSubmitting(true);
        const token = localStorage.getItem('accessToken');
        if (!token) { 
            setGeneralError("Ошибка аутентификации для загрузки списка сотрудников.");
                setIsLoadingEmployees(false);
                navigate('/login');
                return;
        }

        try {
            const departmentDataToUpdate = {
                name: formData.name.trim(),
                floor: parseInt(formData.floor, 10),
                responsible_employee_id: parseInt(formData.responsible_employee_id, 10)
            };

            await axios.put(`http://127.0.0.1:15000/api/departments/${departmentId}`, departmentDataToUpdate, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // alert('Данные отдела успешно обновлены!');
            navigate('/departments');

        } catch (err) {
            console.error("Ошибка при обновлении отдела:", err);
             if (err.response && err.response.data) {
                const apiError = err.response.data;
                if (err.response.status === 422 && apiError.errors) {
                    setErrors(prev => ({ ...prev, ...apiError.errors }));
                    setGeneralError(apiError.message || 'Пожалуйста, исправьте ошибки в форме.');
                } else if (err.response.status === 409 && apiError.errors && apiError.errors.name) {
                    setErrors(prev => ({ ...prev, name: apiError.errors.name }));
                    setGeneralError(apiError.message || 'Ошибка конфликта данных.');
                } else {
                    setGeneralError(apiError.message || apiError.details || 'Произошла ошибка при обновлении данных.');
                }
            } else {
                setGeneralError("Сетевая ошибка или сервер недоступен.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return <div className="loading-message">Загрузка данных отдела...</div>;
    }

    return (
        <div className="employee-form-page-container">
            <div className="employee-form-container">
                <h1>Редактировать отдел: {formData.name || `ID ${departmentId}`}</h1> {/* Используем formData.name для актуальности */}
                <form onSubmit={handleSubmit}>
                    {/* ... (поля Название отдела, Этаж) ... */}
                     <div className="form-group">
                        <label htmlFor="name">Название отдела</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} disabled={isSubmitting} className={errors.name ? 'input-error' : ''} />
                        {errors.name && <p className="field-error-message">{errors.name}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="floor">Этаж (1-3)</label>
                        <input type="number" id="floor" name="floor" value={formData.floor} onChange={handleChange} min="1" max="3" disabled={isSubmitting} className={errors.floor ? 'input-error' : ''} />
                        {errors.floor && <p className="field-error-message">{errors.floor}</p>}
                    </div>

                    {/* Ответственный сотрудник */}
                    <div className="form-group">
                        <label htmlFor="responsible_employee_id">Ответственный сотрудник</label>
                        {isLoadingEmployees ? ( // Проверяем флаг загрузки сотрудников
                            <p>Загрузка сотрудников...</p>
                        ) : responsibleEmployeesList.length > 0 ? (
                            <select 
                                id="responsible_employee_id" 
                                name="responsible_employee_id" 
                                value={formData.responsible_employee_id} 
                                onChange={handleChange} 
                                disabled={isSubmitting} 
                                className={errors.responsible_employee_id ? 'input-error' : ''}
                            >
                                <option value="">Выберите сотрудника...</option>
                                {responsibleEmployeesList.map(emp => (
                                    <option key={emp.id} value={emp.id.toString()}>
                                        {emp.name} {emp.surname} ({emp.login})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="field-error-message">Нет доступных сотрудников с ролью ID {RESPONSIBLE_EMPLOYEE_ROLE_ID} для назначения ответственными.</p>
                        )}
                        {errors.responsible_employee_id && <p className="field-error-message">{errors.responsible_employee_id}</p>}
                    </div>
                    
                    {generalError && <p className="error-message global-form-error">{generalError}</p>}

                    <div className="form-actions">
                        <button type="submit" className="form-button submit-button" disabled={isSubmitting || isLoadingEmployees}>
                            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                        <Link to="/departments" className="form-button cancel-button">Отмена</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentEditPage;