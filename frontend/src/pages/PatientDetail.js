// frontend/src/pages/PatientDetail.js
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import ReportsCard from '../components/ReportsCard';
import api from '../services/api';

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await api.get(`/patients/patients/${id}/`);
        if (mounted) setPatient(resp.data);
      } catch (err) {
        console.error('Failed to load patient', err);
        if (mounted) setError('Failed to load patient details. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Get patient details from nested user_details or flat structure
  const userDetails = patient?.user_details || {};
  const firstName = userDetails.first_name || patient?.first_name || '';
  const lastName = userDetails.last_name || patient?.last_name || '';
  const email = userDetails.email || patient?.email || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Patient';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-3xl text-red-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Patient</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              to="/patients" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Back to Patients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <i className="fas fa-user-slash text-3xl text-yellow-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Patient Not Found</h3>
            <p className="text-gray-600 mb-6">The patient you're looking for doesn't exist.</p>
            <Link 
              to="/patients" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Back to Patients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${fullName} | Patient Details | EHR System`}</title>
        <meta name="description" content={`View detailed medical information for ${fullName} including personal details, medical reports, and health records.`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patient Details</h1>
              <p className="text-gray-600 text-sm mt-1">View and manage patient information</p>
            </div>
            <Link 
              to="/patients" 
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-2 text-sm"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Patients
            </Link>
          </div>

          {/* Patient Info Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{fullName}</h2>
                  <p className="text-blue-100 text-sm">Patient ID: {patient.id}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</label>
                    <p className="mt-1 text-gray-900">
                      {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</label>
                    <p className="mt-1 text-gray-900">
                      {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</label>
                    <p className="mt-1 text-gray-900">{patient.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                    <p className="mt-1 text-gray-900">{email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</label>
                    <p className="mt-1 text-gray-900">
                      {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                    <p className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <i className="fas fa-circle text-[6px] mr-1"></i>
                        Active
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {patient.address && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Address</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{patient.address}</p>
                </div>
              )}

              {patient.emergency_contact && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Emergency Contact</label>
                  <div className="mt-1">
                    <p className="text-gray-900 whitespace-pre-wrap">{patient.emergency_contact}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reports Section */}
          <div className="mb-6">
            <ReportsCard patientId={id} />
          </div>

          {/* Medical Information Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i className="fas fa-notes-medical text-blue-600"></i>
                Medical Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-allergies text-yellow-600"></i>
                    Allergies
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500">No allergies recorded</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-pills text-green-600"></i>
                    Current Medications
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500">No medications recorded</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <i className="fas fa-stethoscope text-purple-600"></i>
                  Clinical Notes
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500">No clinical notes available</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
                    <p className="text-sm text-blue-800">
                      Clinical notes, medications, and allergies will be displayed here in future updates.
                      Medical professionals can add and manage this information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientDetail;