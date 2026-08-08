import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Flex, Spin } from 'antd';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh', width: '100%' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  // If not authenticated, redirect to Landing Page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the child routes (e.g. AppLayout)
  return <Outlet />;
};

export default ProtectedRoute;
