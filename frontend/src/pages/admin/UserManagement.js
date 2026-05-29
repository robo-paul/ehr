// frontend/src/pages/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users/');
      console.log('Fetched users:', response.data);
      setUsers(response.data);
    } catch (error) {
      showMessage('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/user-stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const response = await api.post(`/admin/users/${userId}/approve_role/`);
      showMessage(response.data.message);
      fetchUsers();
      fetchStats();
      setShowApproveModal(false);
      setSelectedUser(null);
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error approving user', 'error');
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user? They will be deactivated.')) return;
    
    try {
      const response = await api.post(`/admin/users/${userId}/reject_role/`);
      showMessage(response.data.message);
      fetchUsers();
      fetchStats();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error rejecting user', 'error');
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const response = await api.post(`/admin/users/${userId}/update_role/`, {
        user_type: newRole
      });
      showMessage(response.data.message);
      fetchUsers();
      fetchStats();
      setShowRoleModal(false);
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error updating role', 'error');
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const endpoint = user.is_active 
        ? `/admin/users/${user.id}/deactivate/`
        : `/admin/users/${user.id}/reactivate/`;
      
      const response = await api.post(endpoint);
      showMessage(response.data.message);
      fetchUsers();
      fetchStats();
    } catch (error) {
      showMessage('Error updating user status', 'error');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      master_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      doctor: 'bg-blue-100 text-blue-800',
      nurse: 'bg-green-100 text-green-800',
      pharmacist: 'bg-orange-100 text-orange-800',
      radiologist: 'bg-indigo-100 text-indigo-800',
      labscientist: 'bg-yellow-100 text-yellow-800',
      patient: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (user) => {
    if (!user.is_active) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Deactivated</span>;
    }
    // Check for pending approval (unverified staff members)
    if (!user.is_verified && user.user_type !== 'patient' && user.user_type !== 'master_admin') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 animate-pulse">Pending Approval</span>;
    }
    if (user.is_verified) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Verified</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
  };

  // Check if user needs approval (staff member who is not verified)
  const needsApproval = (user) => {
    // Staff roles that need approval
    const staffRoles = ['doctor', 'nurse', 'pharmacist', 'radiologist', 'labscientist', 'admin'];
    const isStaff = staffRoles.includes(user.user_type);
    const needsApproval = isStaff && !user.is_verified && user.is_active;
    
    if (needsApproval && process.env.NODE_ENV === 'development') {
      console.log(`User ${user.username} needs approval:`, { isStaff, isVerified: user.is_verified, isActive: user.is_active });
    }
    
    return needsApproval;
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'pending_approval') {
      return needsApproval(user);
    }
    if (filter !== 'all' && user.user_type !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.first_name?.toLowerCase().includes(search) ||
        user.last_name?.toLowerCase().includes(search) ||
        user.work_id?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Count pending approvals (staff members who are not verified)
  const pendingApprovals = users.filter(u => needsApproval(u)).length;

  const roleOptions = [
    { value: 'master_admin', label: 'Master Admin', color: 'purple' },
    { value: 'admin', label: 'Admin', color: 'red' },
    { value: 'doctor', label: 'Doctor', color: 'blue' },
    { value: 'nurse', label: 'Nurse', color: 'green' },
    { value: 'pharmacist', label: 'Pharmacist', color: 'orange' },
    { value: 'radiologist', label: 'Radiologist', color: 'indigo' },
    { value: 'labscientist', label: 'Lab Scientist', color: 'yellow' },
    { value: 'patient', label: 'Patient', color: 'gray' },
    { value: 'pending_approval', label: 'Pending Approval', color: 'orange' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-600">Loading users...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            User Management
          </h2>
          <p className="text-gray-600 text-lg">
            Master Admin Dashboard - Manage users, roles, and permissions
          </p>
          {pendingApprovals > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full">
              <span className="animate-pulse">🔔</span>
              <span className="font-medium">{pendingApprovals} pending approval(s)</span>
            </div>
          )}
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 rounded-xl p-4 border ${
            message.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                {message.type === 'error' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                )}
              </svg>
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Verified</p>
                  <p className="text-3xl font-bold text-green-600">{stats.verified_users}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingApprovals}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.active_users}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals Section */}
        {pendingApprovals > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-orange-200 mb-6 overflow-hidden">
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-200">
              <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                <span className="animate-pulse">⏳</span>
                Pending Approvals ({pendingApprovals})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {users.filter(u => needsApproval(u)).map(user => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                      {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-orange-600 mt-1">
                        Role: <span className="font-medium capitalize">{user.user_type?.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowApproveModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectUser(user.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name, email, or work ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex space-x-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          user.user_type === 'master_admin' ? 'bg-purple-600' :
                          user.user_type === 'admin' ? 'bg-red-600' :
                          user.user_type === 'doctor' ? 'bg-blue-600' :
                          user.user_type === 'nurse' ? 'bg-green-600' :
                          user.user_type === 'pharmacist' ? 'bg-orange-600' :
                          user.user_type === 'radiologist' ? 'bg-indigo-600' :
                          user.user_type === 'labscientist' ? 'bg-yellow-600' :
                          'bg-gray-600'
                        }`}>
                          {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {needsApproval(user) && (
                            <div className="text-xs text-orange-600 mt-1">Awaiting approval</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.user_type)}`}>
                        {user.user_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.work_id || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {/* Approve Button for pending users */}
                        {needsApproval(user) && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowApproveModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                            title="Approve User"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}

                        {/* Role Update Button */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                          title="Change Role"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>

                        {/* Activate/Deactivate Button */}
                        {user.user_type !== 'master_admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              user.is_active 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.is_active ? 'Deactivate User' : 'Reactivate User'}
                          >
                            {user.is_active ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Update Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowRoleModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Update User Role</h3>
              <p className="text-gray-600 mb-6">
                Change role for <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
              </p>

              <div className="space-y-3 mb-6">
                {roleOptions.filter(r => r.value !== 'pending_approval').map(role => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleUpdate(selectedUser.id, role.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedUser.user_type === role.value
                        ? `border-${role.color}-500 bg-${role.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full bg-${role.color}-500 mr-3`}></span>
                      <span className="font-medium">{role.label}</span>
                    </div>
                    {selectedUser.user_type === role.value && (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve User Modal */}
      {showApproveModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowApproveModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Approve User</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to approve <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span> as a{' '}
                <span className="font-medium capitalize">{selectedUser.user_type?.replace('_', ' ')}</span>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This will grant them full access to the system with their assigned role permissions.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveUser(selectedUser.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Approve User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;