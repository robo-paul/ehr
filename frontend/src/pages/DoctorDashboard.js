// frontend/src/pages/DoctorDashboard.js
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import api from '../services/api';
import { authService } from '../services/auth';
import { Link } from 'react-router-dom';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    total_patients: 0,
    today_appointments: 0,
    upcoming_appointments: 0,
    pending_approvals: 0,
    completed_appointments: 0,
    recent_patients: [],
    upcoming_appointments_list: []
  });
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        api.get('/patients/patients/'),
        api.get('/appointments_app/appointments/')
      ]);
      
      let patients = patientsRes.data;
      let appointments = appointmentsRes.data;
      
      if (!Array.isArray(patients)) {
        patients = patients.results || [];
      }
      if (!Array.isArray(appointments)) {
        appointments = appointments.results || [];
      }
      
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter(a => 
        a.confirmed_date?.split('T')[0] === today
      );
      
      const upcomingAppointments = appointments.filter(a => 
        a.confirmed_date && a.confirmed_date > new Date().toISOString()
      ).slice(0, 5);
      
      const recentPatients = patients.slice(0, 5);
      
      setStats({
        total_patients: patients.length,
        today_appointments: todayAppointments.length,
        upcoming_appointments: upcomingAppointments.length,
        completed_appointments: appointments.filter(a => a.status === 'completed').length,
        recent_patients: recentPatients,
        upcoming_appointments_list: upcomingAppointments
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Doctor Dashboard | EHR System</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, Dr. {currentUser?.last_name || 'Doctor'}
            </h1>
            <p className="text-gray-600 mt-2">Here's your practice overview for today</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_patients}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <i className="fas fa-users text-blue-600"></i>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Appointments</p>
                  <p className="text-3xl font-bold text-green-600">{stats.today_appointments}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <i className="fas fa-calendar-check text-green-600"></i>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Upcoming</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.upcoming_appointments}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <i className="fas fa-clock text-orange-600"></i>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.completed_appointments}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <i className="fas fa-check-circle text-purple-600"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Statistics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Completed</span>
                    <span>{stats.completed_appointments}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ 
                      width: `${(stats.completed_appointments / (stats.completed_appointments + stats.today_appointments + stats.upcoming_appointments || 1)) * 100}%` 
                    }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Today</span>
                    <span>{stats.today_appointments}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ 
                      width: `${(stats.today_appointments / (stats.completed_appointments + stats.today_appointments + stats.upcoming_appointments || 1)) * 100}%` 
                    }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Upcoming</span>
                    <span>{stats.upcoming_appointments}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ 
                      width: `${(stats.upcoming_appointments / (stats.completed_appointments + stats.today_appointments + stats.upcoming_appointments || 1)) * 100}%` 
                    }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/patients/new" className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  <i className="fas fa-plus mr-2"></i>Add New Patient
                </Link>
                <Link to="/appointments/new" className="block w-full text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  <i className="fas fa-calendar-plus mr-2"></i>Schedule Appointment
                </Link>
                <Link to="/prescriptions/new" className="block w-full text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                  <i className="fas fa-prescription mr-2"></i>Write Prescription
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Patients</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.recent_patients.map(patient => (
                <div key={patient.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {patient.user_details?.first_name?.charAt(0) || patient.first_name?.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">
                        {patient.user_details?.first_name || patient.first_name} {patient.user_details?.last_name || patient.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{patient.user_details?.email || patient.email}</p>
                    </div>
                  </div>
                  <Link to={`/patients/${patient.id}`} className="text-blue-600 hover:text-blue-800">
                    View Profile <i className="fas fa-arrow-right ml-1"></i>
                  </Link>
                </div>
              ))}
              {stats.recent_patients.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">No patients yet</div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.upcoming_appointments_list.map(appointment => (
                <div key={appointment.id} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{appointment.title || 'Appointment'}</p>
                      <p className="text-sm text-gray-500">
                        {appointment.patient_name || 'Patient'} • {new Date(appointment.confirmed_date).toLocaleString()}
                      </p>
                    </div>
                    <Link to={`/appointments/${appointment.id}`} className="text-blue-600 hover:text-blue-800">
                      View Details <i className="fas fa-arrow-right ml-1"></i>
                    </Link>
                  </div>
                </div>
              ))}
              {stats.upcoming_appointments_list.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">No upcoming appointments</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorDashboard;