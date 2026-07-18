import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/api/admin/users', { headers });
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (user) => {
    setMessage('');
    setError('');
    
    // Prevent self-demotion
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id === currentUser.id) {
      setError('You cannot change your own admin status.');
      return;
    }

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change ${user.username}'s role to ${newRole}?`)) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put('http://localhost:5000/api/admin/users', {
        id: user.id,
        role: newRole
      }, { headers });
      setMessage(response.data.message);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    setMessage('');
    setError('');

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (userId === currentUser.id) {
      setError('You cannot delete your own account.');
      return;
    }

    if (!window.confirm("Are you sure you want to permanently delete this user account?")) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.delete('http://localhost:5000/api/admin/users', {
        params: { id: userId },
        headers
      });
      setMessage(response.data.message);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-4 animated-fade-in">
      <div className="mb-4">
        <h1 className="fw-bold">Manage Users</h1>
        <p className="text-secondary font-monospace">Control user accounts, credentials, and staff privileges</p>
      </div>

      {message && <div className="alert alert-success py-2 small">{message}</div>}
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="glass-card p-4 mb-4 col-md-5">
        <div className="input-group">
          <span className="input-group-text bg-dark border-secondary text-secondary">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control form-sports-input"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading Users...</span>
          </div>
        </div>
      ) : (
        <div className="glass-card p-4">
          <div className="table-responsive">
            <table className="table table-sports table-hover mb-0">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id}>
                    <td>
                      <span className="fw-bold text-white">{userItem.username}</span>
                    </td>
                    <td>{userItem.email}</td>
                    <td>
                      <span className={`badge px-3 py-1 rounded-pill ${userItem.role === 'admin' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                        {userItem.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(userItem.created_at).toLocaleDateString()}</td>
                    <td className="text-end">
                      <button
                        onClick={() => handleRoleToggle(userItem)}
                        className="btn btn-outline-warning btn-sm me-2 rounded-pill"
                      >
                        Toggle Admin
                      </button>
                      <button
                        onClick={() => handleDeleteUser(userItem.id)}
                        className="btn btn-outline-danger btn-sm rounded-pill"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
