import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UserDashboard = () => {
  const [stats, setStats] = useState({ user_bookings: 0, user_registered_tournaments: 0, total_announcements: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const statsRes = await axios.get('http://localhost:5000/api/reports/dashboard-stats', { headers });
      setStats(statsRes.data);

      const announceRes = await axios.get('http://localhost:5000/api/announcements', { headers });
      setAnnouncements(announceRes.data.slice(0, 3)); // show top 3
    } catch (err) {
      console.error("Error fetching user dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSuccess('');
    setFeedbackError('');

    if (!feedbackMsg.trim()) {
      setFeedbackError('Please enter a feedback message.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('http://localhost:5000/api/feedback', { message: feedbackMsg }, { headers });
      setFeedbackSuccess('Thank you! Your feedback has been sent.');
      setFeedbackMsg('');
    } catch (err) {
      setFeedbackError(err.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 animated-fade-in">
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h1 className="fw-bold">User Dashboard</h1>
          <p className="text-secondary">Welcome to your Smart Stadium Portal</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary text-uppercase fw-bold small">Registered Tournaments</span>
              <h2 className="display-5 fw-bold text-info mt-1 mb-0">{stats.user_registered_tournaments}</h2>
            </div>
            <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle fs-3">
              <i className="bi bi-trophy"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary text-uppercase fw-bold small">Stadium Bookings</span>
              <h2 className="display-5 fw-bold text-info mt-1 mb-0">{stats.user_bookings}</h2>
            </div>
            <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle fs-3">
              <i className="bi bi-calendar-event"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary text-uppercase fw-bold small">Announcements</span>
              <h2 className="display-5 fw-bold text-info mt-1 mb-0">{stats.total_announcements}</h2>
            </div>
            <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle fs-3">
              <i className="bi bi-megaphone"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Announcements section */}
        <div className="col-lg-8">
          <div className="glass-card p-4 h-100">
            <h3 className="fw-bold mb-4 d-flex align-items-center justify-content-between">
              <span><i className="bi bi-megaphone text-info me-2"></i>Announcements</span>
              <span className="badge bg-secondary fs-6 rounded-pill">{announcements.length} Latest</span>
            </h3>

            {announcements.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-chat-left-dots fs-1 mb-2"></i>
                <p>No announcements at this time.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {announcements.map((announce) => (
                  <div key={announce.id} className="announcement-card">
                    <h5 className="fw-bold text-info mb-1">{announce.title}</h5>
                    <span className="small text-secondary">
                      Posted: {new Date(announce.created_at).toLocaleDateString()}
                    </span>
                    <p className="mt-2 mb-0 text-light opacity-90">{announce.content}</p>
                  </div>
                ))}

              </div>
            )}
          </div>
        </div>

        {/* Quick Feedback Form & Quick Links */}
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-4">
            {/* Quick Actions */}
            <div className="glass-card p-4">
              <h4 className="fw-bold mb-3">Quick Actions</h4>
              <div className="d-grid gap-2">
                <Link to="/book" className="btn btn-sports text-center">
                  <i className="bi bi-calendar-plus me-2"></i>Book Stadium Slot
                </Link>
                <Link to="/tournaments" className="btn btn-sports-secondary text-center">
                  <i className="bi bi-search me-2"></i>Browse Tournaments
                </Link>
              </div>
            </div>

            {/* Quick Feedback */}
            <div className="glass-card p-4">
              <h4 className="fw-bold mb-3">Send Feedback</h4>
              {feedbackSuccess && <div className="alert alert-success py-2 small">{feedbackSuccess}</div>}
              {feedbackError && <div className="alert alert-danger py-2 small">{feedbackError}</div>}
              <form onSubmit={handleFeedbackSubmit}>
                <div className="mb-3">
                  <textarea
                    rows="3"
                    className="form-control form-sports-input"
                    placeholder="Enter your experience or requests..."
                    value={feedbackMsg}
                    onChange={(e) => setFeedbackMsg(e.target.value)}
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-sports w-100 btn-sm py-2">
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
