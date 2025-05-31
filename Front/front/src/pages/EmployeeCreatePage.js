import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../stiles/EmployeeForm.css'; // Создадим общий CSS для форм сотрудников

const EmployeeCreatePage = () => {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        role_id: '', // Будет ID роли
        login: '',
        passwd: '',
        phone_number: '',
        telegram_id: ''
    });
    const [roles, setRoles] = useState([]); // Для выпадающего списка ролей
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [isLoadingRoles, setIsLoadingRoles] = useState(true); // Отдельный флаг для загрузки ролей
    const [isSubmitting, setIsSubmitting] = useState(false); // Для процесса отправки формы
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRoles = async () => {
            setIsLoadingRoles(true);
            setGeneralError(''); // Сбрасываем общую ошибку при попытке загрузить роли
            try {
                // Используем новый эндпоинт, токен не нужен
                const response = await axios.get('http://127.0.0.1:15000/api/roles');
                setRoles(response.data); // Ожидаем массив типа [{id: 1, name: "Администратор"}, ...]

                // Опционально: устанавливаем первую роль по умолчанию, если список не пуст
                // и если role_id еще не установлен (например, при первом рендере)
                if (response.data.length > 0 && !formData.role_id) {
                    // setFormData(prev => ({ ...prev, role_id: response.data[0].id.toString() }));
                }

            } catch (error) {
                console.error("Ошибка при загрузке ролей:", error);
                setGeneralError("Не удалось загрузить список ролей. Пожалуйста, попробуйте обновить страницу.");
                setRoles([]); // Устанавливаем пустой массив в случае ошибки
            } finally {
                setIsLoadingRoles(false);
            }
        };
        fetchRoles();
    }, [/* formData.role_id */]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Очищаем ошибку для поля при его изменении
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        // Имя (кириллица, 1-20 символов)
        if (!formData.name.trim() || !/^[а-яА-ЯёЁ\s-]+$/.test(formData.name.trim()) || formData.name.trim().length > 20) {
            newErrors.name = "Имя: кириллица (1-20 симв.), пробелы, дефисы.";
        }
        // Фамилия (кириллица, 1-20 символов)
        if (!formData.surname.trim() || !/^[а-яА-ЯёЁ\s-]+$/.test(formData.surname.trim()) || formData.surname.trim().length > 20) {
            newErrors.surname = "Фамилия: кириллица (1-20 симв.), пробелы, дефисы.";
        }
        // Логин (латиница, цифры, _, 1-30 символов) - уникальность проверит бэкенд
        if (!formData.login.trim() || !/^[a-zA-Z0-9_]+$/.test(formData.login.trim()) || formData.login.trim().length > 30) {
            newErrors.login = "Логин: латиница, цифры, _ (1-30 симв.).";
        }
        // Пароль (4-30 символов)
        if (!formData.passwd || formData.passwd.length < 4 || formData.passwd.length > 30) {
            newErrors.passwd = "Пароль должен быть от 4 до 30 символов.";
        }
        // Номер телефона (11 цифр, начинается на 89)
        if (!formData.phone_number.trim() || !/^89\d{9}$/.test(formData.phone_number.trim())) {
            newErrors.phone_number = "Номер телефона: 11 цифр, начинается на '89'.";
        }
        // Telegram ID (10 цифр)
        if (!formData.telegram_id.trim() || !/^\d{10}$/.test(formData.telegram_id.trim())) {
            newErrors.telegram_id = "Telegram ID: 10 цифр.";
        }
        // Роль
        if (!formData.role_id) {
            newErrors.role_id = "Необходимо выбрать роль.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // true если нет ошибок
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setGeneralError('');
        if (!validateForm()) {
            setGeneralError("Пожалуйста, исправьте ошибки в форме.");
            return;
        }

        setIsSubmitting(true); // Используем isSubmitting
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setGeneralError("Ошибка аутентификации. Пожалуйста, войдите снова.");
            setIsSubmitting(false);
            navigate('/login');
            return;
        }

        try {
            // Готовим данные для отправки, role_id уже строка, если выбран из select
            const employeeDataToSend = {
                ...formData,
                role_id: parseInt(formData.role_id, 10) // Убедимся, что role_id это число
            };

            await axios.post('http://127.0.0.1:15000/api/employees', employeeDataToSend, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('Сотрудник успешно добавлен!'); // Замените на toast-уведомление
            navigate('/employees'); // Возвращаемся к списку сотрудников

        } catch (err) {
            console.error("Ошибка при создании сотрудника:", err);
            if (err.response && err.response.data) {
                const apiError = err.response.data;
                if (err.response.status === 422 && apiError.errors) {
                    setErrors(prev => ({ ...prev, ...apiError.errors })); // Объединяем с клиентскими ошибками
                    setGeneralError(apiError.message || 'Пожалуйста, исправьте ошибки в форме.');
                } else if (err.response.status === 409 && apiError.errors && apiError.errors.login) {
                    setErrors(prev => ({ ...prev, login: apiError.errors.login }));
                    setGeneralError(apiError.message || 'Ошибка конфликта данных.');
                } else {
                    setGeneralError(apiError.message || apiError.details || 'Произошла ошибка при создании сотрудника.');
                }
            } else {
                setGeneralError("Сетевая ошибка или сервер недоступен.");
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
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} disabled={isLoadingRoles} className={errors.name ? 'input-error' : ''} />
                        {errors.name && <p className="field-error-message">{errors.name}</p>}
                    </div>

                    {/* Фамилия */}
                    <div className="form-group">
                        <label htmlFor="surname">Фамилия</label>
                        <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} disabled={isLoadingRoles} className={errors.surname ? 'input-error' : ''} />
                        {errors.surname && <p className="field-error-message">{errors.surname}</p>}
                    </div>

                    {/* Роль (выпадающий список) */}
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
                                    // Ожидаем, что API вернет { id: ..., name: ... } для ролей
                                    <option key={role.id} value={role.id.toString()}> 
                                        {role.name} 
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="field-error-message">Не удалось загрузить роли. Убедитесь, что API доступен.</p>
                        )}
                        {errors.role_id && <p className="field-error-message">{errors.role_id}</p>}
                    </div>

                    {/* Логин */}
                    <div className="form-group">
                        <label htmlFor="login">Логин</label>
                        <input type="text" id="login" name="login" value={formData.login} onChange={handleChange} disabled={isLoadingRoles} className={errors.login ? 'input-error' : ''} />
                        {errors.login && <p className="field-error-message">{errors.login}</p>}
                    </div>

                    {/* Пароль */}
                    <div className="form-group">
                        <label htmlFor="passwd">Пароль</label>
                        <input type="password" id="passwd" name="passwd" value={formData.passwd} onChange={handleChange} disabled={isLoadingRoles} className={errors.passwd ? 'input-error' : ''} />
                        {errors.passwd && <p className="field-error-message">{errors.passwd}</p>}
                    </div>

                    {/* Номер телефона */}
                    <div className="form-group">
                        <label htmlFor="phone_number">Номер телефона</label>
                        <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} disabled={isLoadingRoles} className={errors.phone_number ? 'input-error' : ''} />
                        {errors.phone_number && <p className="field-error-message">{errors.phone_number}</p>}
                    </div>

                    {/* Telegram ID */}
                    <div className="form-group">
                        <label htmlFor="telegram_id">Telegram ID</label>
                        <input type="text" id="telegram_id" name="telegram_id" value={formData.telegram_id} onChange={handleChange} disabled={isLoadingRoles} className={errors.telegram_id ? 'input-error' : ''} />
                        {errors.telegram_id && <p className="field-error-message">{errors.telegram_id}</p>}
                    </div>
                    
                    {generalError && <p className="error-message global-form-error">{generalError}</p>}

                    <div className="form-actions">
                        <button type="submit" className="form-button submit-button" disabled={isSubmitting || isLoadingRoles}>
                            {isSubmitting ? 'Сохранение...' : 'Сохранить сотрудника'}
                        </button>
                        <Link to="/employees" className="form-button cancel-button">Отмена</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeCreatePage;