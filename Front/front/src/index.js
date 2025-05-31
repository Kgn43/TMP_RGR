import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import axios from 'axios';
import { performLogout } from './components/authUtils'; // Укажите правильный путь

axios.interceptors.response.use(
  (response) => {
      return response;
  },
  (error) => {
      const currentPath = window.location.pathname; // <--- ОПРЕДЕЛЯЕМ currentPath ЗДЕСЬ

      if (error.response) {
          const { status, data } = error.response;

          if (status === 401 && currentPath !== '/login') { 
              console.error("Axios Interceptor: 401 Unauthorized", data);
              alert(data?.message || data?.details || "Сессия истекла или недействительна. Пожалуйста, войдите снова.");
              performLogout(); 
          } else if (status === 422 && data?.error_code === "INVALID_TOKEN" && currentPath !== '/login') {
              console.error("Axios Interceptor: 422 Invalid Token", data);
              alert(data?.message || data?.details || "Неверный токен. Пожалуйста, войдите снова.");
              performLogout();
          }
          // 403 Forbidden обычно обрабатывается на уровне компонента, показывая сообщение "Доступ запрещен",
          // а не разлогинивая пользователя, так как токен может быть еще валиден.
          // Если для вашего случая 403 тоже должен вести к выходу, добавьте здесь условие.

      } else if (error.request && currentPath !== '/login') {
          // Запрос был сделан, но ответ не был получен (Network Error)
          console.error("Axios Interceptor: Network error - No response received", error.request);
          // Здесь можно показать общее сообщение об ошибке сети, если это не делается в компоненте
          // alert("Сетевая ошибка. Не удалось связаться с сервером."); 
      } else if (currentPath !== '/login') { 
          // Произошло что-то при настройке запроса, что вызвало ошибку
          console.error('Axios Interceptor: Request setup error', error.message);
          // alert("Произошла ошибка при формировании запроса.");
      }
      
      return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
