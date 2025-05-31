import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import '../stiles/EmployeeForm.css'; // Используем те же стили, что и для EmployeeCreatePage

const EmployeeEditPage = () => {
    const { employeeId } = useParams(); // Получаем ID сотрудника из URL
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        role_id: '',
        login: '', // Будет только для отображения
        phone_number: '',
        telegram_id: ''
    });
    const [roles, setRoles] = useState([]);
    const [initialLogin, setInitialLogin] = useState(''); // Для отображения нередактируемого логина
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true); // Загрузка данных сотрудника и ролей
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Загрузка ролей (аналогично EmployeeCreatePage)
    useEffect(() => {
        const fetchRoles = async () => {
            // setIsLoadingData(true); // Уже установлено
            try {
                const response = await axios.get('http://127.0.0.1:15000/api/roles');
                setRoles(response.data);
            } catch (error) {
                console.error("Ошибка при загрузке ролей:", error);
                setGeneralError(prev => prev + "\nНе удалось загрузить список ролей.");
            }
            // setIsLoadingData(false); // Устанавливаем false после загрузки данных сотрудника
        };
        fetchRoles();
    }, []);

    // Загрузка данных сотрудника
    const fetchEmployeeData = useCallback(async () => {
        setIsLoadingData(true);
        setGeneralError('');
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setGeneralError("Ошибка аутентификации. Пожалуйста, войдите снова.");
            setIsLoadingData(false);
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get(`http://127.0.0.1:15000/api/employees/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const empData = response.data;
            setFormData({
                name: empData.name || '',
                surname: empData.surname || '',
                role_id: empData.role_id ? empData.role_id.toString() : '',
                login: empData.login || '', // Сохраняем для отображения
                phone_number: empData.phone_number || '',
                telegram_id: empData.telegram_id || ''
            });
            setInitialLogin(empData.login || ''); // Сохраняем начальный логин
        } catch (err) {
            console.error(`Ошибка при загрузке данных сотрудника ${employeeId}:`, err);
            if (err.response) {
                setGeneralError(`Ошибка API (${err.response.status}): ${err.response.data.message || err.response.data.details || err.response.statusText}`);
                if (err.response.status === 404) navigate('/employees'); // Если сотрудник не найден, уходим на список
            } else {
                setGeneralError("Сетевая ошибка при загрузке данных сотрудника.");
            }
        } finally {
            setIsLoadingData(false);
        }
    }, [employeeId, navigate]);

    useEffect(() => {
        fetchEmployeeData();
    }, [fetchEmployeeData]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        // Валидация такая же, как при создании, КРОМЕ логина и пароля
        if (!formData.name.trim() || !/^[а-яА-ЯёЁ\s-]+$/.test(formData.name.trim()) || formData.name.trim().length > 20) {
            newErrors.name = "Имя: кириллица (1-20 симв.), пробелы, дефисы.";
        }
        if (!formData.surname.trim() || !/^[а-яА-ЯёЁ\s-]+$/.test(formData.surname.trim()) || formData.surname.trim().length > 20) {
            newErrors.surname = "Фамилия: кириллица (1-20 симв.), пробелы, дефисы.";
        }
        if (!formData.phone_number.trim() || !/^89\d{9}$/.test(formData.phone_number.trim())) {
            newErrors.phone_number = "Номер телефона: 11 цифр, начинается на '89'.";
        }
        if (!formData.telegram_id.trim() || !/^\d{10}$/.test(formData.telegram_id.trim())) {
            newErrors.telegram_id = "Telegram ID: 10 цифр.";
        }
        if (!formData.role_id) {
            newErrors.role_id = "Необходимо выбрать роль.";
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
            // ... (обработка отсутствия токена) ...
            return;
        }

        try {
            // Отправляем только те поля, которые разрешено изменять
            const dataToUpdate = {
                name: formData.name,
                surname: formData.surname,
                role_id: parseInt(formData.role_id, 10),
                phone_number: formData.phone_number,
                telegram_id: formData.telegram_id
            };

            await axios.put(`http://127.0.0.1:15000/api/employees/${employeeId}`, dataToUpdate, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('Данные сотрудника успешно обновлены!');
            navigate('/employees');

        } catch (err) {
            console.error("Ошибка при обновлении сотрудника:", err);
            if (err.response && err.response.data) {
                const apiError = err.response.data;
                if (err.response.status === 422 && apiError.errors) {
                    setErrors(prev => ({ ...prev, ...apiError.errors }));
                    setGeneralError(apiError.message || 'Пожалуйста, исправьте ошибки в форме.');
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
        return <div className="loading-message">Загрузка данных сотрудника...</div>;
    }

    return (
        <div className="employee-form-page-container">
            <div className="employee-form-container">
                <h1>Редактировать сотрудника: {initialLogin}</h1>
                <form onSubmit={handleSubmit}>
                    {/* Имя */}
                    <div className="form-group">
                        <label htmlFor="name">Имя</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} disabled={isSubmitting} className={errors.name ? 'input-error' : ''} />
                        {errors.name && <p className="field-error-message">{errors.name}</p>}
                    </div>

                    {/* Фамилия */}
                    <div className="form-group">
                        <label htmlFor="surname">Фамилия</label>
                        <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} disabled={isSubmitting} className={errors.surname ? 'input-error' : ''} />
                        {errors.surname && <p className="field-error-message">{errors.surname}</p>}
                    </div>

                    {/* Логин (только для чтения) */}
                    <div className="form-group">
                        <label htmlFor="login-display">Логин</label>
                        <input type="text" id="login-display" name="login" value={formData.login} disabled readOnly className="readonly-input" />
                    </div>
                    

                    {/* Роль */}
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
                             <p>Загрузка ролей...</p> // Или сообщение об ошибке загрузки ролей
                        )}
                        {errors.role_id && <p className="field-error-message">{errors.role_id}</p>}
                    </div>

                    {/* Номер телефона */}
                    <div className="form-group">
                        <label htmlFor="phone_number">Номер телефона</label>
                        <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} disabled={isSubmitting} className={errors.phone_number ? 'input-error' : ''} />
                        {errors.phone_number && <p className="field-error-message">{errors.phone_number}</p>}
                    </div>

                    {/* Telegram ID */}
                    <div className="form-group">
                        <label htmlFor="telegram_id">Telegram ID</label>
                        <input type="text" id="telegram_id" name="telegram_id" value={formData.telegram_id} onChange={handleChange} disabled={isSubmitting} className={errors.telegram_id ? 'input-error' : ''} />
                        {errors.telegram_id && <p className="field-error-message">{errors.telegram_id}</p>}
                    </div>
                    
                    {generalError && <p className="error-message global-form-error">{generalError}</p>}

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