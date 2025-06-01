import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiClient from '../services/axiosSetup';
import '../stiles/EmployeeForm.css'; 

const EmployeeEditPage = () => {
    const { employeeId } = useParams();
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        role_id: '',
        login: '',
        phone_number: '',
        telegram_id: ''
    });
    const [roles, setRoles] = useState([]);

    const [errors, setErrors] = useState({}); //Ошибки валидации полей
    const [pageMessage, setPageMessage] = useState({ text: '', type: '' }); //Для общих сообщений
    
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Загрузка ролей и данных сотрудника
    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        setPageMessage({ text: '', type: '' });
        setErrors({});
        try {
            //Загружаем роли
            const rolesResponse = await apiClient.get('/roles');
            setRoles(rolesResponse.data);

            //Загружаем данные сотрудника
            const employeeResponse = await apiClient.get(`/employees/${employeeId}`);
            const empData = employeeResponse.data;
            setFormData({
                name: empData.name || '',
                surname: empData.surname || '',
                role_id: empData.role_id ? empData.role_id.toString() : '', //Для select value должен быть строкой
                login: empData.login || '', 
                phone_number: empData.phone_number || '',
                telegram_id: empData.telegram_id || ''
            });
            // setInitialLogin(empData.login || ''); //formData.login теперь содержит это значение

        } catch (err) {
            console.error(`Ошибка при загрузке данных для сотрудника ${employeeId}:`, err);
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
            setIsLoadingData(false);
        }
    }, [employeeId]);

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
        if (!formData.name.trim() || !/^[а-яА-ЯёЁ\s-]+$/.test(formData.name.trim()) || formData.name.trim().length > 20) {
            newErrors.name = "Имя: кириллица (1-20 симв.), пробелы, дефисы.";
        }
        if (!formData.surname.trim() || !/^[а-яА-ЯёЁ\s-]+$/.test(formData.surname.trim()) || formData.surname.trim().length > 20) {
            newErrors.surname = "Фамилия: кириллица (1-20 симв.), пробелы, дефисы.";
        }
        if (!formData.phone_number.trim() || !/^89\d{9}$/.test(formData.phone_number.trim())) {
            newErrors.phone_number = "Номер телефона: 11 цифр, начинается на '89'.";
        }
        if (!formData.telegram_id.trim() || !/^\d+$/.test(formData.telegram_id.trim())) {
            newErrors.telegram_id = "Telegram ID должен быть числом.";
        }
        if (!formData.role_id) {
            newErrors.role_id = "Необходимо выбрать роль.";
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
            const dataToUpdate = {
                name: formData.name,
                surname: formData.surname,
                role_id: parseInt(formData.role_id, 10),
                phone_number: formData.phone_number,
                telegram_id: formData.telegram_id
            };

            await apiClient.put(`/employees/${employeeId}`, dataToUpdate);
            
            setPageMessage({ text: 'Данные сотрудника успешно обновлены!', type: 'success' });
            //задержка перед редиректом
            setTimeout(() => {
                navigate('/employees');
            }, 1500);

        } catch (err) {
            console.error("Ошибка при обновлении сотрудника:", err);
            if (err.response && err.response.data) {
                const apiError = err.response.data;
                if (err.response.status === 422 && apiError.errors) {
                    setErrors(prev => ({ ...prev, ...apiError.errors }));
                    setPageMessage({ text: apiError.message || 'Пожалуйста, исправьте ошибки в форме.', type: 'error' });
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

    if (isLoadingData) {
        return <div className="loading-message">Загрузка данных сотрудника...</div>;
    }

    if (pageMessage.type === 'error' && !formData.login) {
         return (
            <div className="employee-form-page-container">
                <div className="employee-form-container">
                    <h1>Редактирование сотрудника</h1>
                    <p className="error-message global-form-error">{pageMessage.text}</p>
                    <Link to="/employees" className="form-button cancel-button">Назад к списку</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="employee-form-page-container">
            <div className="employee-form-container">
                <h1>Редактировать сотрудника: {formData.login}</h1> {/* Используем formData.login */}
                <form onSubmit={handleSubmit}>
                    {/* ... (поля формы без изменений в логике, только className для ошибок) ... */}
                    <div className="form-group">
                        <label htmlFor="name">Имя</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} disabled={isSubmitting} className={errors.name ? 'input-error' : ''} />
                        {errors.name && <p className="field-error-message">{errors.name}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="surname">Фамилия</label>
                        <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} disabled={isSubmitting} className={errors.surname ? 'input-error' : ''} />
                        {errors.surname && <p className="field-error-message">{errors.surname}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-display">Логин</label>
                        <input type="text" id="login-display" name="login" value={formData.login} disabled readOnly className="readonly-input" />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="role_id">Роль</label>
                        {roles.length > 0 ? (
                            <select id="role_id" name="role_id" value={formData.role_id} onChange={handleChange} disabled={isSubmitting} className={errors.role_id ? 'input-error' : ''}>
                                <option value="">Выберите роль...</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id.toString()}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                             <p>Загрузка ролей или роли не найдены...</p>
                        )}
                        {errors.role_id && <p className="field-error-message">{errors.role_id}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone_number">Номер телефона</label>
                        <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} disabled={isSubmitting} className={errors.phone_number ? 'input-error' : ''} />
                        {errors.phone_number && <p className="field-error-message">{errors.phone_number}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="telegram_id">Telegram ID</label>
                        <input type="text" id="telegram_id" name="telegram_id" value={formData.telegram_id} onChange={handleChange} disabled={isSubmitting} className={errors.telegram_id ? 'input-error' : ''} />
                        {errors.telegram_id && <p className="field-error-message">{errors.telegram_id}</p>}
                    </div>
                    
                    {pageMessage.text && (
                        <p className={`message global-form-message ${pageMessage.type === 'error' ? 'error-message' : 'success-message'}`}>
                            {pageMessage.text}
                        </p>
                    )}

                    <div className="form-actions">
                        <button type="submit" className="form-button submit-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                        <Link to="/employees" className="form-button cancel-button">Отмена</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeEditPage;