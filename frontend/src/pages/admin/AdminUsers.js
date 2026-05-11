// frontend/src/pages/admin/AdminUsers.js
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import api from '../../services/api';
import { authService } from '../../services/auth';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const currentUser = authService.getCurrentUser();

  const isMasterAdmin = currentUser?.user_type === 'master_admin';

  useEffect(() => {
    if (!isMasterAdmin) {
      setError('Access denied. Master Admin privileges required.');
      setLoading(false);
      return;
    }
    fetchUsers();
    fetchStats();
  }, [isMasterAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users/');
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/user-stats/');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${userId}/update_role/`, { user_type: newRole });
      setSuccess('User role updated successfully!');
      fetchUsers();
      fetchStats();
      setShowRoleModal(false);
      setSelectedUser(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating role');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyUser = async (userId) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${userId}/verify/`);
      setSuccess('User verified successfully!');
      fetchUsers();
      fetchStats();
      setShowVerifyModal(false);
      setSelectedUser(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error verifying user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'reactivate'} this user?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const endpoint = currentStatus 
        ? `/admin/users/${userId}/deactivate/`
        : `/admin/users/${userId}/reactivate/`;
      
      await api.post(endpoint);
      setSuccess(`User ${currentStatus ? 'deactivated' : 'reactivated'} successfully!`);
      fetchUsers();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || `Error ${currentStatus ? 'deactivating' : 'reactivating'} user`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
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
    if (user.is_verified) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Verified</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
  };

  const filteredUsers = users.filter(user => {
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

  const roleOptions = [
    { value: 'master_admin', label: 'Master Admin', color: 'purple' },
    { value: 'admin', label: 'Admin', color: 'red' },
    { value: 'doctor', label: 'Doctor', color: 'blue' },
    { value: 'nurse', label: 'Nurse', color: 'green' },
    { value: 'pharmacist', label: 'Pharmacist', color: 'orange' },
    { value: 'radiologist', label: 'Radiologist', color: 'indigo' },
    { value: 'labscientist', label: 'Lab Scientist', color: 'yellow' },
    { value: 'patient', label: 'Patient', color: 'gray' }
  ];

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <i className="fas fa-lock text-3xl text-red-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>User Management | Admin | EHR System</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage users, roles, and permissions across the system</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <i className="fas fa-users text-blue-600"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Verified Users</p>
                    <p className="text-3xl font-bold text-green-600">{stats.verified_users}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <i className="fas fa-check-circle text-green-600"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Verification</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending_verification || 0}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <i className="fas fa-clock text-yellow-600"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Users</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.active_users}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <i className="fas fa-user-check text-purple-600"></i>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search users by name, email, or work ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Roles</option>
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-sync-alt mr-2"></i>Refresh
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
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
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
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
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Change Role"
                          >
                            <i className="fas fa-user-tag"></i>
                          </button>
                          {!user.is_verified && user.user_type !== 'patient' && user.user_type !== 'master_admin' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowVerifyModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Verify User"
                            >
                              <i className="fas fa-check-circle"></i>
                            </button>
                          )}
                          {user.id !== currentUser?.id && user.user_type !== 'master_admin' && (
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.is_active 
                                  ? 'text-red-600 hover:bg-red-50' 
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={user.is_active ? 'Deactivate User' : 'Reactivate User'}
                            >
                              <i className={`fas ${user.is_active ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500">No users found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Update User Role</h3>
              <p className="text-gray-600 mt-1">
                Change role for <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
              </p>
            </div>
            <div className="p-6 space-y-3">
              {roleOptions.map(role => (
                <button
                  key={role.value}
                  onClick={() => handleRoleUpdate(selectedUser.id, role.value)}
                  disabled={actionLoading}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedUser.user_type === role.value
                      ? 'bg-purple-50 border border-purple-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium text-gray-900">{role.label}</div>
                  <div className="text-sm text-gray-500">
                    {role.value === 'master_admin' && 'Full system access, user management'}
                    {role.value === 'admin' && 'System configuration, user management'}
                    {role.value === 'doctor' && 'Patient care, prescriptions, medical records'}
                    {role.value === 'nurse' && 'Patient care support, vitals, appointments'}
                    {role.value === 'pharmacist' && 'Prescription management, medication dispensing'}
                    {role.value === 'radiologist' && 'Medical imaging, radiology reports'}
                    {role.value === 'labscientist' && 'Laboratory tests, results management'}
                    {role.value === 'patient' && 'Personal health record access'}
                  </div>
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify User Modal */}
      {showVerifyModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Verify User</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                Are you sure you want to verify <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>?
                This will grant them full access to the system.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyUser(selectedUser.id)}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Verifying...' : 'Verify User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsers;