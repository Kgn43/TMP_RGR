import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/axiosSetup';
import '../stiles/EmployeeForm.css'; 

const EmployeeCreatePage = () => {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        role_id: '', 
        login: '',
        passwd: '',
        phone_number: '',
        telegram_id: ''
    });
    const [roles, setRoles] = useState([]);
    const [errors, setErrors] = useState({}); //Ошибки валидации полей
    const [pageMessage, setPageMessage] = useState({ text: '', type: '' }); //Для общих сообщений
    
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    //Загрузка ролей
    const fetchRoles = useCallback(async () => {
        setIsLoadingRoles(true);
        setPageMessage({ text: '', type: '' });
        try {
            const response = await apiClient.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error("Ошибка при загрузке ролей:", error);
            setPageMessage({ 
                text: error.response?.data?.message || error.message || "Не удалось загрузить список ролей.", 
                type: 'error' 
            });
            setRoles([]);
        } finally {
            setIsLoadingRoles(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);


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
        if (!formData.login.trim() || !/^[a-zA-Z0-9_]+$/.test(formData.login.trim()) || formData.login.trim().length > 30) {
            newErrors.login = "Логин: латиница, цифры, _ (1-30 симв.).";
        }
        if (!formData.passwd || formData.passwd.length < 4 || formData.passwd.length > 30) {
            newErrors.passwd = "Пароль должен быть от 4 до 30 символов.";
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
            const employeeDataToSend = {
                ...formData,
                role_id: parseInt(formData.role_id, 10) 
            };

            await apiClient.post('/employees', employeeDataToSend);
            navigate('/employees', { state: { message: 'Сотрудник успешно добавлен!', type: 'success' } });


        } catch (err) {
            console.error("Ошибка при создании сотрудника:", err);
            if (err.response && err.response.data) {
                const apiError = err.response.data;
                if (err.response.status === 422 && apiError.errors) {
                    setErrors(prev => ({ ...prev, ...apiError.errors }));
                    setPageMessage({ text: apiError.message || 'Пожалуйста, исправьте ошибки в форме.', type: 'error' });
                } else if (err.response.status === 409 && apiError.errors?.login) {
                    setErrors(prev => ({ ...prev, login: apiError.errors.login }));
                     setPageMessage({ text: apiError.message || 'Такой логин уже существует.', type: 'error' });
                } else {
                    setPageMessage({ 
                        text: apiError.message || apiError.details || 'Произошла ошибка при создании сотрудника.', 
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

    return (
        <div className="employee-form-page-container">
            <div className="employee-form-container">
                <h1>Добавить нового сотрудника</h1>
                <form onSubmit={handleSubmit}>
                    {/* Имя */}
                    <div className="form-group">
                        <label htmlFor="name">Имя</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} disabled={isSubmitting || isLoadingRoles} className={errors.name ? 'input-error' : ''} />
                        {errors.name && <p className="field-error-message">{errors.name}</p>}
                    </div>

                    {/* Фамилия */}
                    <div className="form-group">
                        <label htmlFor="surname">Фамилия</label>
                        <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} disabled={isSubmitting || isLoadingRoles} className={errors.surname ? 'input-error' : ''} />
                        {errors.surname && <p className="field-error-message">{errors.surname}</p>}
                    </div>
                    
                    {/* Роль */}
                    <div className="form-group">
                        <label htmlFor="role_id">Роль</label>
                        {isLoadingRoles ? (
                            <p>Загрузка ролей...</p>
                        ) : roles.length > 0 ? (
                            <select 
                                id="role_id" 
                                name="role_id" 
                                value={formData.role_id} 
                                onChange={handleChange} 
                                disabled={isSubmitting} 
                                className={errors.role_id ? 'input-error' : ''}
                            >
                                <option value="">Выберите роль...</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id.toString()}> 
                                        {role.name} 
                                    </option>
                                ))}
                            </select>
                        ) : (
                            pageMessage.text && pageMessage.type === 'error' ? 
                            <p className="field-error-message">{pageMessage.text}</p> :
                            <p>Роли не найдены.</p>
                        )}
                        {errors.role_id && <p className="field-error-message">{errors.role_id}</p>}
                    </div>

                    {/* Логин */}
                    <div className="form-group">
                        <label htmlFor="login">Логин</label>
                        <input type="text" id="login" name="login" value={formData.login} onChange={handleChange} disabled={isSubmitting || isLoadingRoles} className={errors.login ? 'input-error' : ''} />
                        {errors.login && <p className="field-error-message">{errors.login}</p>}
                    </div>

                    {/* Пароль */}
                    <div className="form-group">
                        <label htmlFor="passwd">Пароль</label>
                        <input type="password" id="passwd" name="passwd" value={formData.passwd} onChange={handleChange} disabled={isSubmitting || isLoadingRoles} className={errors.passwd ? 'input-error' : ''} />
                        {errors.passwd && <p className="field-error-message">{errors.passwd}</p>}
                    </div>

                    {/* Номер телефона */}
                    <div className="form-group">
                        <label htmlFor="phone_number">Номер телефона</label>
                        <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} disabled={isSubmitting || isLoadingRoles} className={errors.phone_number ? 'input-error' : ''} />
                        {errors.phone_number && <p className="field-error-message">{errors.phone_number}</p>}
                    </div>

                    {/* Telegram ID */}
                    <div className="form-group">
                        <label htmlFor="telegram_id">Telegram ID</label>
                        <input type="text" id="telegram_id" name="telegram_id" value={formData.telegram_id} onChange={handleChange} disabled={isSubmitting || isLoadingRoles} className={errors.telegram_id ? 'input-error' : ''} />
                        {errors.telegram_id && <p className="field-error-message">{errors.telegram_id}</p>}
                    </div>
                    
                    {pageMessage.text && !errors.name && !errors.surname  && (
                        <p className={`message global-form-message ${pageMessage.type === 'error' ? 'error-message' : 'success-message'}`}>
                            {pageMessage.text}
                        </p>
                    )}

                    <div className="form-actions">
                        <button type="submit" className="form-button submit-button" disabled={isSubmitting || isLoadingRoles}>
                            {isSubmitting ? 'Создание...' : 'Создать сотрудника'}
                        </button>
                        <Link to="/employees" className="form-button cancel-button">Отмена</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeCreatePage;