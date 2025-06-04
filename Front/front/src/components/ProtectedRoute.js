import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        console.log("ProtectedRoute: isLoading is true for path:", location.pathname);
        return <div>Проверка аутентификации...</div>; 
    }
    console.log("ProtectedRoute: isLoading is false, isAuthenticated:", isAuthenticated, "for path:", location.pathname);

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;