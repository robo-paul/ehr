// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MedicalReports from './pages/MedicalReports';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Register from './components/auth/Register';
import Prescriptions from './pages/Prescriptions';
import LabResults from './pages/LabResults';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import PatientList from './pages/PatientList';
import PatientForm from './components/patients/PatientForm';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import AppointmentDetail from './pages/AppointmentDetail';
import AppointmentForm from './components/appointments/AppointmentForm';
import Unauthorized from './pages/Unauthorized';
import PrivateRoute from './components/common/PrivateRoute';
import { authService } from './services/auth';
import AdminUsers from './pages/admin/AdminUsers';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing application...');
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const wakeBackend = async () => {
      try {
        setLoadingMessage('Waking up the server...');
        // Try to ping the backend health endpoint
        const API_URL = process.env.REACT_APP_API_URL || 'https://ehr-backend.onrender.com/api';
        
        // First attempt - with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          await fetch(`${API_URL}/patients/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          setLoadingMessage('Server is awake! Loading application...');
        } catch (fetchError) {
          // If first attempt fails, it's likely the server is still waking up
          setLoadingMessage('Server is starting up. This may take 30-60 seconds...');
          
          // Second attempt with longer timeout
          const secondController = new AbortController();
          const secondTimeoutId = setTimeout(() => secondController.abort(), 25000);
          
          try {
            await fetch(`${API_URL}/patients/`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: secondController.signal
            });
            clearTimeout(secondTimeoutId);
          } catch (secondError) {
            console.log('Backend still warming up, but we\'ll proceed anyway');
          }
        }
      } catch (error) {
        console.log('Backend wake-up attempt completed:', error.message);
      } finally {
        // Add a small delay to make the loading screen visible
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };

    wakeBackend();

    // Also wake when user focuses tab (if they left it idle)
    const handleFocus = () => {
      const API_URL = process.env.REACT_APP_API_URL || 'https://ehr-backend.onrender.com/api';
      fetch(`${API_URL}/patients/`).catch(() => {});
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-3 rounded-full animate-pulse">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-white"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              EHR System
            </h2>
            
            {/* Loading Message */}
            <p className="text-gray-600 mb-6">
              {loadingMessage}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-blue-600 h-2.5 rounded-full animate-progress" style={{ width: '100%' }}></div>
            </div>

            {/* Status Message */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Please wait while we wake up the server...</span>
            </div>

            {/* Fun Fact */}
            <p className="text-xs text-gray-400 mt-6">
              Note: Free servers spin down after inactivity.<br />
              First load may take 30-60 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public routes - no header/footer */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected routes with Layout (includes Header & Footer) */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route
            path="patients/new"
            element={
              <PrivateRoute roles={['doctor', 'admin', 'master_admin']}>
                <PatientForm />
              </PrivateRoute>
            }
          />
          <Route path="patients/:id" element={<PatientDetail />} />
          {/* ADD THIS LINE - Edit patient route */}
          <Route
            path="patients/:id/edit"
            element={
              <PrivateRoute roles={['doctor', 'admin', 'master_admin']}>
                <PatientForm />
              </PrivateRoute>
            }
          />
          <Route path="admin/users" element={
              <PrivateRoute roles={['master_admin']}>
                <AdminUsers />
              </PrivateRoute>
            } />
          {/* Appointments routes */}
          <Route path="appointments" element={<Appointments />} />
          <Route
            path="appointments/new"
            element={
              <PrivateRoute roles={['doctor', 'admin', 'master_admin', 'patient']}>
                <AppointmentForm />
              </PrivateRoute>
            }
          />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          
          <Route path="reports" element={<MedicalReports />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="lab-results" element={<LabResults />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          
          {/* Admin routes */}
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;