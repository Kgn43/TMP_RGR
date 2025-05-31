import React from 'react';
import { Link } from 'react-router-dom';
import '../stiles/NotFoundPage.css';


const imageUrl = '/aboba.png'; 


const NotFoundPage = () => {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h2>Страница не найдена</h2>
                <p>Извините, страница, которую вы ищете, не существует.</p>
                <div className="not-found-image-container">
                    <img src={imageUrl}  alt="<h1>404</h1>" className="not-found-image" /> 
                </div>
                <Link to="/" className="go-home-button">
                    Вернуться на главную
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;