import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/axiosSetup';
import '../stiles/EmployeeForm.css';

const RESPONSIBLE_EMPLOYEE_ROLE_ID = 2;

const DepartmentCreatePage = () => {
    const [formData, setFormData] = useState({
        name: '',
        floor: '',
        responsible_employee_id: ''
    });
    const [responsibleEmployeesList, setResponsibleEmployeesList] = useState([]);
    
    const [errors, setErrors] = useState({});
    const [pageMessage, setPageMessage] = useState({ text: '', type: '' });
    
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    //Загрузка сотрудников для выпадающего списка
    const fetchEmployeesForSelect = useCallback(async () => {
        setIsLoadingEmployees(true);
        setPageMessage({ text: '', type: '' });
        try {
            const response = await apiClient.get('/employees');

            const filteredForResponsible = response.data.filter(
                (emp) => emp.role_id === RESPONSIBLE_EMPLOYEE_ROLE_ID 
            );
            setResponsibleEmployeesList(filteredForResponsible);

        } catch (error) {
            console.error("Ошибка при загрузке сотрудников для выбора:", error);
            setPageMessage({
                text: error.response?.data?.message || error.message || "Не удалось загрузить список сотрудников.",
                type: 'error'
            });
            setResponsibleEmployeesList([]);
        } finally {
            setIsLoadingEmployees(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployeesForSelect();
    }, [fetchEmployeesForSelect]);

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
        if (isNaN(floorNum) || floorNum < 1 || floorNum > 3) { // Уточни диапазон этажей
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
        setPageMessage({ text: '', type: '' });
        if (!validateForm()) {
            setPageMessage({ text: "Пожалуйста, исправьте ошибки в форме.", type: 'error' });
            return;
        }

        setIsSubmitting(true);

        try {
            const departmentDataToSend = {
                name: formData.name.trim(),
                floor: parseInt(formData.floor, 10),
                responsible_employee_id: parseInt(formData.responsible_employee_id, 10)
            };

            await apiClient.post('/departments', departmentDataToSend);
            
            navigate('/departments', { state: { message: 'Отдел успешно добавлен!', type: 'success' } });

        } catch (err) {
            console.error("Ошибка при создании отдела:", err);
            if (err.response && err.response.data) {
                const apiError = err.response.data;
                if (err.response.status === 422 && apiError.errors) {
                    setErrors(prev => ({ ...prev, ...apiError.errors }));
                    setPageMessage({ text: apiError.message || 'Пожалуйста, исправьте ошибки в форме.', type: 'error' });
                } else if (err.response.status === 409 && apiError.errors?.name) {
                    setErrors(prev => ({ ...prev, name: apiError.errors.name }));
                    setPageMessage({ text: apiError.message || 'Отдел с таким названием уже существует.', type: 'error' });
                } else {
                    setPageMessage({ 
                        text: apiError.message || apiError.details || 'Произошла ошибка при создании отдела.', 
                        type: 'error' 
                    });
                }
            } else {
                setPageMessage({ text: "Сетевая ошибка или сервер недоступен.", type: 'error' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    //Используем isLoadingEmployees для блокировки полей формы и кнопки отправки, пока грузятся сотрудники
    const formDisabled = isSubmitting || isLoadingEmployees;

    return (
        <div className="employee-form-page-container">
            <div className="employee-form-container">
                <h1>Добавить новый отдел</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Название отдела</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} disabled={formDisabled} className={errors.name ? 'input-error' : ''} />
                        {errors.name && <p className="field-error-message">{errors.name}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="floor">Этаж (1-3)</label>
                        <input type="number" id="floor" name="floor" value={formData.floor} onChange={handleChange} min="1" max="3" disabled={formDisabled} className={errors.floor ? 'input-error' : ''} />
                        {errors.floor && <p className="field-error-message">{errors.floor}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="responsible_employee_id">Ответственный сотрудник</label>
                        {isLoadingEmployees ? (
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
                            pageMessage.text && pageMessage.type === 'error' && !errors.responsible_employee_id ?
                            <p className="field-error-message">{pageMessage.text}</p> :
                            <p>Нет доступных сотрудников для назначения (роль ID: {RESPONSIBLE_EMPLOYEE_ROLE_ID}).</p>
                        )}
                        {errors.responsible_employee_id && <p className="field-error-message">{errors.responsible_employee_id}</p>}
                    </div>
                    
                    {pageMessage.text && !errors.name && !errors.floor && !errors.responsible_employee_id && (
                        <p className={`message global-form-message ${pageMessage.type === 'error' ? 'error-message' : 'success-message'}`}>
                            {pageMessage.text}
                        </p>
                    )}

                    <div className="form-actions">
                        <button type="submit" className="form-button submit-button" disabled={formDisabled}>
                            {isSubmitting ? 'Создание...' : 'Создать отдел'}
                        </button>
                        <Link to="/departments" className="form-button cancel-button">Отмена</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentCreatePage;