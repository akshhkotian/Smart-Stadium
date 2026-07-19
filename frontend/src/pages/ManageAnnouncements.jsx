import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/announcements', { headers });
      setAnnouncements(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post('https://smart-stadium-1nrv.onrender.com/api/announcements', {
        title,
        content
      }, { headers });

      setMessage(response.data.message);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish announcement.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    setMessage('');
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.delete(`https://smart-stadium-1nrv.onrender.com/api/announcements/${id}`, { headers });
      setMessage(response.data.message);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to delete announcement.');
    }
  };

  return (
    <div className="container py-4 animated-fade-in">
      <div className="mb-4">
        <h1 className="fw-bold">Manage Announcements</h1>
        <p className="text-secondary font-monospace">Broadcast news and notices to all users</p>
      </div>

      {message && <div className="alert alert-success py-2 small">{message}</div>}
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="row g-4">
        {/* Left Side: Create Form */}
        <div className="col-lg-4">
          <div className="glass-card p-4">
            <h3 className="fw-bold mb-4"><i className="bi bi-megaphone-fill text-info me-2"></i>Post Notice</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small">Title *</label>
                <input
                  type="text"
                  className="form-control form-sports-input"
                  placeholder="e.g., Football Pitch Maintenance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small">Notice Content *</label>
                <textarea
                  className="form-control form-sports-input"
                  rows="6"
                  placeholder="Details of the announcement..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-sports w-100 py-2">
                Publish Announcement
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: List & Manage */}
        <div className="col-lg-8">
          <div className="glass-card p-4">
            <h3 className="fw-bold mb-4"><i className="bi bi-broadcast text-info me-2"></i>Active Board Notices</h3>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading Notice Board...</span>
                </div>
              </div>
            ) : announcements.length === 0 ? (
              <p className="text-secondary small">No announcements posted yet.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="announcement-card d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="fw-bold text-info mb-1">{ann.title}</h5>
                      <span className="small text-secondary">
                        Posted: {new Date(ann.created_at).toLocaleString()}
                      </span>
                      <p className="mt-2 mb-0 text-light opacity-90">{ann.content}</p>
                    </div>

                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="btn btn-outline-danger btn-sm rounded-circle ms-3"
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAnnouncements;
