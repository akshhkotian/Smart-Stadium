import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const fetchBookingHistory = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/bookings', { headers });
      setBookings(response.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4 animated-fade-in">
      <div className="mb-4">
        <h1 className="fw-bold">Booking History</h1>
        <p className="text-secondary font-monospace">Track the approval status of your reservations</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading History...</span>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-5 glass-card">
          <i className="bi bi-calendar-check text-secondary fs-1 mb-2"></i>
          <p className="text-secondary">You haven't made any stadium bookings yet.</p>
        </div>
      ) : (
        <div className="glass-card p-4">
          <div className="table-responsive">
            <table className="table table-sports table-hover mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Booking Date</th>
                  <th>Time Slot</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, idx) => (
                  <tr key={booking.id}>
                    <td>{idx + 1}</td>
                    <td>{new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td className="fw-bold">{booking.time_slot}</td>
                    <td>{booking.purpose}</td>
                    <td>
                      <span className={`badge px-3 py-2 rounded-pill ${
                        booking.status === 'approved' ? 'bg-success' :
                        booking.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'
                      }`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-secondary small">
                      {new Date(booking.created_at).toLocaleString()}
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

export default BookingHistory;
