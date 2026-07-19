import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
  const [tournaments, setTournaments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const tourRes = await axios.get('https://smart-stadium-1nrv.onrender.com/api/tournaments');
      setTournaments(tourRes.data);

      const bookingRes = await axios.get('https://smart-stadium-1nrv.onrender.com/api/bookings', { headers });
      setBookings(bookingRes.data);

      const feedbackRes = await axios.get('https://smart-stadium-1nrv.onrender.com/api/feedback', { headers });
      setFeedbacks(feedbackRes.data);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Compiling Reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 animated-fade-in print-container">
      {/* Header section (Hidden during print if styled, but standard print will show it) */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h1 className="fw-bold">Operations Reports</h1>
          <p className="text-secondary font-monospace">Generate and download structured stadium audit reports</p>
        </div>
        <button onClick={handlePrint} className="btn btn-sports rounded-pill px-4">
          <i className="bi bi-printer me-2"></i> Print / Export PDF
        </button>
      </div>

      <div className="row g-4">
        {/* Tournaments Report Table */}
        <div className="col-12">
          <div className="glass-card p-4">
            <h4 className="fw-bold mb-3 text-info border-bottom border-secondary pb-2">
              1. Tournaments Audit Report
            </h4>
            <div className="table-responsive">
              <table className="table table-sports table-hover mb-0">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Sport</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-bold text-white">{t.name}</td>
                      <td>{t.sport_type}</td>
                      <td>{new Date(t.start_date).toLocaleDateString()}</td>
                      <td>{new Date(t.end_date).toLocaleDateString()}</td>
                      <td>{t.status.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stadium Bookings Report Table */}
        <div className="col-12">
          <div className="glass-card p-4">
            <h4 className="fw-bold mb-3 text-info border-bottom border-secondary pb-2">
              2. Stadium Bookings Report
            </h4>
            <div className="table-responsive">
              <table className="table table-sports table-hover mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Booking Date</th>
                    <th>Time Slot</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.user_name}</strong>
                        <span className="d-block small text-secondary">{b.user_email}</span>
                      </td>
                      <td>{new Date(b.booking_date).toLocaleDateString()}</td>
                      <td className="fw-bold">{b.time_slot}</td>
                      <td>{b.purpose}</td>
                      <td>{b.status.toUpperCase()}</td>
                      <td className="text-secondary small">
                        {new Date(b.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* User Feedback Report Table */}
        <div className="col-12">
          <div className="glass-card p-4">
            <h4 className="fw-bold mb-3 text-info border-bottom border-secondary pb-2">
              3. User Feedback & Support Tickets
            </h4>
            <div className="table-responsive">
              <table className="table table-sports table-hover mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Message</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <strong>{f.user_name}</strong>
                        <span className="d-block small text-secondary">{f.user_email}</span>
                      </td>
                      <td>{f.message}</td>
                      <td className="text-secondary small">
                        {new Date(f.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Printing CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .glass-card {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            color: black !important;
          }
          .table-sports {
            color: black !important;
          }
          .table-sports th {
            color: black !important;
            border-bottom: 2px solid #000 !important;
          }
          .table-sports td {
            border-bottom: 1px solid #ddd !important;
            color: black !important;
          }
          .text-white {
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .badge {
            border: 1px solid #000 !important;
            color: black !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
