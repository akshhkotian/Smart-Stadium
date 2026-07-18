import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form Fields
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sportType, setSportType] = useState('Soccer');
  const [status, setStatus] = useState('upcoming');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/tournaments');
      setTournaments(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setSportType('Soccer');
    setStatus('upcoming');
  };

  const handleEditClick = (tour) => {
    setEditingId(tour.id);
    setName(tour.name);
    setDescription(tour.description || '');
    // format dates (YYYY-MM-DD)
    setStartDate(tour.start_date.split('T')[0]);
    setEndDate(tour.end_date.split('T')[0]);
    setSportType(tour.sport_type);
    setStatus(tour.status);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!name.trim() || !startDate || !endDate || !sportType) {
      setError('Please fill in all required fields.');
      return;
    }

    const payload = {
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      sport_type: sportType,
      status
    };

    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editingId) {
        // Update Tournament
        const response = await axios.put(`http://localhost:5000/api/tournaments/${editingId}`, payload, { headers });
        setMessage(response.data.message);
      } else {
        // Create Tournament
        const response = await axios.post('http://localhost:5000/api/tournaments', payload, { headers });
        setMessage(response.data.message);
      }
      clearForm();
      fetchTournaments();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tournament? All registrations and standings will be lost!")) return;
    setMessage('');
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.delete(`http://localhost:5000/api/tournaments/${id}`, { headers });
      setMessage(response.data.message);
      fetchTournaments();
    } catch (err) {
      setError('Failed to delete tournament.');
    }
  };

  return (
    <div className="container py-4 animated-fade-in">
      <div className="mb-4">
        <h1 className="fw-bold">Manage Tournaments</h1>
        <p className="text-secondary font-monospace">Create, edit, and supervise active sporting leagues</p>
      </div>

      {message && <div className="alert alert-success py-2 small">{message}</div>}
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="row g-4">
        {/* Left Side: Create/Edit Form */}
        <div className="col-lg-4">
          <div className="glass-card p-4">
            <h3 className="fw-bold mb-4">
              <i className="bi bi-pencil-square text-info me-2"></i>
              {editingId ? 'Edit Tournament' : 'Add Tournament'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small">Tournament Name *</label>
                <input
                  type="text"
                  className="form-control form-sports-input"
                  placeholder="e.g., Winter Soccer Cup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small">Description</label>
                <textarea
                  className="form-control form-sports-input"
                  rows="3"
                  placeholder="Describe details, rules, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label text-secondary small">Start Date *</label>
                  <input
                    type="date"
                    className="form-control form-sports-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label text-secondary small">End Date *</label>
                  <input
                    type="date"
                    className="form-control form-sports-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label text-secondary small">Sport Type *</label>
                  <select
                    className="form-select form-sports-input"
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                  >
                    <option value="Soccer">Soccer</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Badminton">Badminton</option>
                  </select>
                </div>
                <div className="col-6 mb-4">
                  <label className="form-label text-secondary small">Status *</label>
                  <select
                    className="form-select form-sports-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-sports w-100">
                  {editingId ? 'Update' : 'Create'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary rounded-pill px-3" onClick={clearForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: List Table */}
        <div className="col-lg-8">
          <div className="glass-card p-4">
            <h3 className="fw-bold mb-4"><i className="bi bi-list-stars text-info me-2"></i>Tournaments List</h3>
            
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading Tournaments...</span>
                </div>
              </div>
            ) : tournaments.length === 0 ? (
              <p className="text-secondary small">No tournaments created yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sports table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Sport</th>
                      <th>Dates</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((tour) => (
                      <tr key={tour.id}>
                        <td>
                          <strong className="text-white">{tour.name}</strong>
                          <span className="d-block small text-secondary text-truncate" style={{ maxWidth: '200px' }}>
                            {tour.description || 'No description'}
                          </span>
                        </td>
                        <td>{tour.sport_type}</td>
                        <td className="small text-secondary">
                          {new Date(tour.start_date).toLocaleDateString()} to<br/>
                          {new Date(tour.end_date).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`badge px-2 py-1 rounded-pill ${
                            tour.status === 'ongoing' ? 'bg-success' :
                            tour.status === 'upcoming' ? 'bg-warning text-dark' : 'bg-secondary'
                          }`}>
                            {tour.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            onClick={() => handleEditClick(tour)}
                            className="btn btn-outline-info btn-sm me-2 rounded-circle"
                            title="Edit"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(tour.id)}
                            className="btn btn-outline-danger btn-sm rounded-circle"
                            title="Delete"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTournaments;
