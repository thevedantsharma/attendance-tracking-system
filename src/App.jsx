import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Scanner from './pages/Scanner';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Login from './pages/Login';
import AttendanceMarking from './pages/AttendanceMarking';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner">Loading...</div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  // ✅ Don't render routes until auth state is resolved
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner">Loading...</div>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <Login /> : <Navigate to="/" replace />
      } />

      <Route path="/" element={
        isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
      }>
        <Route index element={<Dashboard />} />
        <Route path="classes" element={<Classes />} />
        <Route path="students" element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <Students />
          </ProtectedRoute>
        } />
        <Route path="scanner" element={<Scanner />} />
        <Route path="attendance-marking" element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <AttendanceMarking />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;