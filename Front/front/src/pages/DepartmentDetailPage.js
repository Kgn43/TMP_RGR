import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiClient from '../services/axiosSetup';
import '../stiles/EmployeeForm.css';

const RESPONSIBLE_EMPLOYEE_ROLE_ID = 2;

const DepartmentEditPage = () => {
    const { departmentId } = useParams();
    const [formData, setFormData] = useState({
        name: '',
        floor: '',
        responsible_employee_id: ''
    });
    const [responsibleEmployeesList, setResponsibleEmployeesList] = useState([]);
    
    const [errors, setErrors] = useState({});
    const [pageMessage, setPageMessage] = useState({ text: '', type: '' });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    //Загрузка данных отдела и списка сотрудников для выбора
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setPageMessage({ text: '', type: '' });
        setErrors({});
        try {
            const [departmentResponse, employeesResponse] = await Promise.all([
                apiClient.get(`/departments/${departmentId}`),
                apiClient.get('/employees') //Загружаем всех, фильтруем на клиенте
            ]);

            const deptData = departmentResponse.data;
            setFormData({
                name: deptData.name || '',
                floor: deptData.floor ? deptData.floor.toString() : '',
                responsible_employee_id: deptData.responsible_employee_id ? deptData.responsible_employee_id.toString() : ''
            });

            //Фильтруем сотрудников по нужной роли
            const filteredForResponsible = employeesResponse.data.filter(
                (emp) => emp.role_id === RESPONSIBLE_EMPLOYEE_ROLE_ID
            );
            setResponsibleEmployeesList(filteredForResponsible);

        } catch (err) {
            console.error(`Ошибка при загрузке данных для отдела ${departmentId}:`, err);
            if (err.response) {
                const apiError = err.response.data;
                setPageMessage({
                    text: `Ошибка загрузки (${err.response.status}): ${apiError?.message || apiError?.details || err.response.statusText}`,
                    type: 'error'
                });
            } else {
                setPageMessage({ text: "Сетевая ошибка при загрузке данных.", type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    }, [departmentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
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
        setPageMessage({ text: '', type: '' });
        if (!validateForm()) {
            setPageMessage({ text: "Пожалуйста, исправьте ошибки в форме.", type: 'error' });
            return;
        }

        setIsSubmitting(true);

        try {
            const departmentDataToUpdate = {
                name: formData.name.trim(),
                floor: parseInt(formData.floor, 10),
                responsible_employee_id: parseInt(formData.responsible_employee_id, 10)
            };

            await apiClient.put(`/departments/${departmentId}`, departmentDataToUpdate);
            
            navigate('/departments', { state: { message: 'Данные отдела успешно обновлены!', type: 'success' } });

        } catch (err) {
            console.error("Ошибка при обновлении отдела:", err);
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
                        text: apiError.message || apiError.details || 'Произошла ошибка при обновлении данных.', 
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

    if (isLoading) {
        return <div className="loading-message">Загрузка данных...</div>;
    }

    if (pageMessage.type === 'error' && !formData.name && !isLoading) {
         return (
            <div className="employee-form-page-container">
                <div className="employee-form-container">
                    <h1>Редактирование отдела</h1>
                    <p className="error-message global-form-error">{pageMessage.text}</p>
                    <Link to="/departments" className="form-button cancel-button">Назад к списку</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="employee-form-page-container">
            <div className="employee-form-container">
                <h1>Редактировать отдел: {formData.name || `ID ${departmentId}`}</h1>
                <form onSubmit={handleSubmit}>
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

                    <div className="form-group">
                        <label htmlFor="responsible_employee_id">Ответственный сотрудник</label>
                        {responsibleEmployeesList.length > 0 ? (
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
                             <p>Нет доступных сотрудников для назначения ответственными (роль ID: {RESPONSIBLE_EMPLOYEE_ROLE_ID}).</p>
                        )}
                        {errors.responsible_employee_id && <p className="field-error-message">{errors.responsible_employee_id}</p>}
                    </div>
                    
                    {pageMessage.text && (
                         <p className={`message global-form-message ${pageMessage.type === 'error' ? 'error-message' : 'success-message'}`}>
                            {pageMessage.text}
                        </p>
                    )}

                    <div className="form-actions">
                        <button type="submit" className="form-button submit-button" disabled={isSubmitting || isLoading}> {/* Блокируем и при начальной загрузке */}
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