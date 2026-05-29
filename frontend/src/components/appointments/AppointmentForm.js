// frontend/src/components/appointments/AppointmentForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appointmentsService } from '../../services/appointments';
import { authService } from '../../services/auth';
import api from '../../services/api';

const AppointmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reason: '',
    patient_suggested_date: '',
    provider: '',
    patient: '',
    duration: 30,
    location: '',
    is_virtual: false,
    appointment_type: 'checkup'
  });

  const isEdit = !!id;
  const isPatient = currentUser?.user_type === 'patient';
  const isStaff = ['doctor', 'nurse', 'admin', 'master_admin'].includes(currentUser?.user_type);

  // Appointment types
  const appointmentTypes = [
    { value: 'checkup', label: 'General Checkup', icon: '🏥' },
    { value: 'followup', label: 'Follow-up Visit', icon: '🔄' },
    { value: 'emergency', label: 'Emergency', icon: '🚨' },
    { value: 'consultation', label: 'Consultation', icon: '👨‍⚕️' },
    { value: 'procedure', label: 'Procedure', icon: '🔧' },
    { value: 'vaccination', label: 'Vaccination', icon: '💉' },
    { value: 'lab_test', label: 'Lab Test', icon: '🔬' },
    { value: 'imaging', label: 'Imaging/Radiology', icon: '📷' }
  ];

  useEffect(() => {
    fetchProviders();
    if (isStaff) fetchPatients();
    if (isEdit) fetchAppointment();
  }, [id]);

  const fetchProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await api.get('/auth/providers/');
      let providersData = response.data;
      
      if (!Array.isArray(providersData)) {
        if (providersData?.results) providersData = providersData.results;
        else providersData = [];
      }
      
      setProviders(providersData);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await api.get('/patients/patients/');
      let patientsData = response.data;
      
      if (!Array.isArray(patientsData)) {
        if (patientsData?.results) patientsData = patientsData.results;
        else if (patientsData?.data) patientsData = patientsData.data;
        else patientsData = [];
      }
      
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchAppointment = async () => {
    setLoading(true);
    try {
      const data = await appointmentsService.get(id);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        reason: data.reason || '',
        patient_suggested_date: data.patient_suggested_date ? data.patient_suggested_date.slice(0, 16) : '',
        provider: data.provider || '',
        patient: data.patient || '',
        duration: data.duration || 30,
        location: data.location || '',
        is_virtual: data.is_virtual || false,
        appointment_type: data.appointment_type || 'checkup'
      });
    } catch (error) {
      setError('Error loading appointment details');
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Appointment title is required');
      return false;
    }
    if (!formData.patient_suggested_date) {
      setError('Please select a preferred date and time');
      return false;
    }
    if (!formData.provider && isStaff) {
      setError('Please select a healthcare provider');
      return false;
    }
    if (isStaff && !formData.patient && !isEdit) {
      setError('Please select a patient');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!validateForm()) {
      setSubmitting(false);
      return;
    }

    try {
      let patientId = formData.patient;
      
      if (isPatient) {
        patientId = currentUser?.patient_profile?.id || currentUser?.patient_id;
        
        if (!patientId) {
          try {
            const patientResponse = await api.get('/patients/patients/');
            let patientsData = patientResponse.data;
            if (!Array.isArray(patientsData)) {
              patientsData = patientsData.results || [];
            }
            const userPatient = patientsData.find(p => p.user === currentUser?.id);
            if (userPatient) {
              patientId = userPatient.id;
            }
          } catch (err) {
            console.error('Error fetching patient ID:', err);
          }
        }
        
        if (!patientId) {
          setError('Patient profile not found. Please contact support.');
          setSubmitting(false);
          return;
        }
      }
      
      let appointmentDate;
      try {
        appointmentDate = new Date(formData.patient_suggested_date);
        if (isNaN(appointmentDate.getTime())) {
          setError('Invalid date format');
          setSubmitting(false);
          return;
        }
      } catch (err) {
        setError('Invalid date format');
        setSubmitting(false);
        return;
      }
      
      const submitData = {
        title: formData.title,
        patient_suggested_date: appointmentDate.toISOString(),
        appointment_type: formData.appointment_type,
        estimated_duration: parseInt(formData.duration),
        patient: patientId,
        provider: parseInt(formData.provider),
        reason: formData.reason || '',
        description: formData.description || ''
      };

      console.log('Submitting appointment data:', submitData);

      if (isEdit) {
        await appointmentsService.update(id, submitData);
      } else {
        await appointmentsService.create(submitData);
      }
      
      navigate('/appointments', { 
        state: { 
          success: true,
          message: isEdit ? 'Appointment updated successfully!' : 'Appointment requested successfully!'
        }
      });
      
    } catch (error) {
      console.error('Error saving appointment:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(errorMessages);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          setError(errorData.message || 'Failed to save appointment. Please try again.');
        }
      } else {
        setError('Failed to save appointment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getPatientDisplayName = (patient) => {
    if (patient.user_details?.full_name) return patient.user_details.full_name;
    if (patient.full_name) return patient.full_name;
    if (patient.first_name && patient.last_name) return `${patient.first_name} ${patient.last_name}`;
    if (patient.user_details?.first_name && patient.user_details?.last_name) {
      return `${patient.user_details.first_name} ${patient.user_details.last_name}`;
    }
    return 'Unknown Patient';
  };

  const getProviderDisplayName = (provider) => {
    const firstName = provider.first_name || '';
    const lastName = provider.last_name || '';
    const username = provider.username || '';
    const userType = provider.user_type || '';
    
    let name = '';
    if (firstName && lastName) {
      name = `${firstName} ${lastName}`;
    } else if (firstName) {
      name = firstName;
    } else if (username) {
      name = username;
    } else {
      name = 'Unknown Provider';
    }
    
    const title = userType === 'doctor' ? 'Dr. ' : '';
    const specialization = provider.specialization ? ` (${provider.specialization})` : '';
    
    return `${title}${name}${specialization}`.trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-600">Loading appointment details...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isEdit ? 'Update Appointment' : 'Schedule New Appointment'}
          </h2>
          <p className="text-gray-600 text-lg">
            {isEdit ? 'Modify your appointment details below' : 'Fill in the details to request a new appointment'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {appointmentTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, appointment_type: type.value }))}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      formData.appointment_type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="e.g., Annual Physical, Follow-up Consultation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit
              </label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Brief description of why you need this appointment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Any specific concerns, symptoms, or information for the provider..."
              />
            </div>

            {isStaff && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient <span className="text-red-500">*</span>
                </label>
                <select
                  name="patient"
                  value={formData.patient}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required={!isEdit}
                  disabled={loadingPatients}
                >
                  <option value="">Choose a patient...</option>
                  {Array.isArray(patients) && patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {getPatientDisplayName(patient)}
                    </option>
                  ))}
                </select>
                {loadingPatients && <p className="text-xs text-gray-500 mt-1">Loading patients...</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Healthcare Provider <span className="text-red-500">*</span>
              </label>
              <select
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
                disabled={loadingProviders}
              >
                <option value="">Choose a provider...</option>
                {Array.isArray(providers) && providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {getProviderDisplayName(provider)}
                  </option>
                ))}
              </select>
              {loadingProviders && <p className="text-xs text-gray-500 mt-1">Loading providers...</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="patient_suggested_date"
                value={formData.patient_suggested_date}
                onChange={handleChange}
                min={getMinDateTime()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Your preferred time. The provider may suggest alternative times.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <span className="text-blue-600">ℹ️</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">What happens next?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {isEdit 
                      ? "Your changes will be saved. The provider will be notified of the updates."
                      : "Your appointment request will be sent to the provider. They will review and either confirm or propose an alternative time."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEdit ? 'Updating...' : 'Scheduling...'}
                  </div>
                ) : (
                  isEdit ? 'Update Appointment' : 'Schedule Appointment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;