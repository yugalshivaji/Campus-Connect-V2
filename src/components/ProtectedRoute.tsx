import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/login" />;

  return <>{children}</>;
};

export const OrganiserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isOrganizer, isAdmin } = useAuth();

  if (loading) return null;
  if (!user || (!isOrganizer && !isAdmin)) return <Navigate to="/login" />;

  return <>{children}</>;
};

export const CanteenRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isCanteen, isAdmin } = useAuth();

  if (loading) return null;
  if (!user || (!isCanteen && !isAdmin)) return <Navigate to="/login" />;

  return <>{children}</>;
};
