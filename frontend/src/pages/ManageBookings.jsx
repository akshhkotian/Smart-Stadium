import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmingAction, setConfirmingAction] = useState(null); // { id, status }

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/api/bookings', { headers });
      setBookings(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeStatusUpdate = async (bookingId, newStatus) => {
    setMessage('');
    setError('');
    setConfirmingAction(null);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put(`http://localhost:5000/api/bookings/${bookingId}`, {
        status: newStatus
      }, { headers });

      setMessage(response.data.message);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking status.');
    }
  };

  return (
    <div className="container py-4 animated-fade-in">
      <div className="mb-4">
        <h1 className="fw-bold">Manage Bookings</h1>
        <p className="text-secondary font-monospace">Approve or reject pending stadium pitch reservations</p>
      </div>

      {message && <div className="alert alert-success py-2 small">{message}</div>}
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading Bookings...</span>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-5 glass-card">
          <i className="bi bi-calendar2-check text-secondary fs-1 mb-2"></i>
          <p className="text-secondary">No stadium booking reservations have been submitted yet.</p>
        </div>
      ) : (
        <div className="glass-card p-4">
          <div className="table-responsive">
            <table className="table table-sports table-hover mb-0">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong className="text-white">{booking.user_name}</strong>
                      <span className="d-block small text-secondary">{booking.user_email}</span>
                    </td>
                    <td>{new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td className="fw-bold text-info">{booking.time_slot}</td>
                    <td>{booking.purpose}</td>
                    <td>
                      <span className={`badge px-3 py-1 rounded-pill ${
                        booking.status === 'approved' ? 'bg-success' :
                        booking.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="text-end">
                      {confirmingAction && confirmingAction.id === booking.id ? (
                        /* Inline Confirmation Action Buttons */
                        <div className="d-flex justify-content-end align-items-center gap-2">
                          <span className="small text-secondary fw-bold">Confirm {confirmingAction.status}?</span>
                          <button
                            onClick={() => executeStatusUpdate(booking.id, confirmingAction.status)}
                            className={`btn btn-sm py-1 px-3 rounded-pill ${
                              confirmingAction.status === 'approved' ? 'btn-success' : 'btn-danger'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmingAction(null)}
                            className="btn btn-sm btn-secondary py-1 px-2 rounded-pill"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        /* Standard Action Buttons */
                        booking.status === 'pending' && (
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              onClick={() => setConfirmingAction({ id: booking.id, status: 'approved' })}
                              className="btn btn-outline-success btn-sm rounded-pill px-3"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirmingAction({ id: booking.id, status: 'rejected' })}
                              className="btn btn-outline-danger btn-sm rounded-pill px-3"
                            >
                              Reject
                            </button>
                          </div>
                        )
                      )}
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

export default ManageBookings;
