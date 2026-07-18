import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookStadium = () => {
  const [date, setDate] = useState('2026-07-18');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchSlots();
  }, [date]);

  const fetchSlots = async () => {
    if (!date) return;
    setLoadingSlots(true);
    setError('');
    setSelectedSlot(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/bookings/availability`, {
        params: { date }
      });
      setSlots(response.data);
    } catch (err) {
      setError('Failed to fetch slot availability.');
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slot) => {
    if (slot.status !== 'available') return;
    setSelectedSlot(slot.time_slot);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }

    if (!purpose.trim()) {
      setError('Please state the purpose of your booking.');
      return;
    }

    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post('http://localhost:5000/api/bookings', {
        booking_date: date,
        time_slot: selectedSlot,
        purpose
      }, { headers });

      setMessage(response.data.message);
      setPurpose('');
      setSelectedSlot(null);
      fetchSlots(); // Refresh slot grid
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4 animated-fade-in">
      <div className="row mb-4">
        <div className="col">
          <h1 className="fw-bold">Book Stadium</h1>
          <p className="text-secondary">Reserve premium stadium grounds or practice nets</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side: Slot Picker */}
        <div className="col-lg-8">
          <div className="glass-card p-4 h-100">
            <h3 className="fw-bold mb-4"><i className="bi bi-calendar2-range text-info me-2"></i>Select Date & Time</h3>
            
            <div className="mb-4 col-md-5">
              <label className="form-label text-secondary small">Pick Date</label>
              <input
                type="date"
                className="form-control form-sports-input"
                value={date}
                min="2026-07-18" // Lock to current date onwards
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {loadingSlots ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Checking Slots...</span>
                </div>
              </div>
            ) : (
              <div>
                <h6 className="text-secondary small mb-3">Available Slots for {new Date(date).toLocaleDateString()}</h6>
                
                <div className="slot-grid">
                  {slots.map((slot, idx) => {
                    let btnClass = 'slot-available';
                    let label = 'Available';

                    if (slot.status === 'pending') {
                      btnClass = 'slot-pending';
                      label = 'Pending Approval';
                    } else if (slot.status === 'approved') {
                      btnClass = 'slot-booked';
                      label = 'Reserved';
                    }

                    if (selectedSlot === slot.time_slot) {
                      btnClass = 'slot-selected';
                    }

                    return (
                      <div
                        key={idx}
                        className={`slot-btn ${btnClass}`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <div className="fw-bold mb-1">{slot.time_slot}</div>
                        <div className="small opacity-75">{label}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="d-flex flex-wrap gap-4 justify-content-center mt-5 pt-3 border-top border-secondary small text-secondary">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success bg-opacity-25 border border-success me-2 px-2 py-1">&nbsp;</span>
                    Available
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-warning bg-opacity-25 border border-warning me-2 px-2 py-1">&nbsp;</span>
                    Pending
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-danger bg-opacity-25 border border-danger me-2 px-2 py-1">&nbsp;</span>
                    Reserved
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-sports-gradient border border-info me-2 px-2 py-1">&nbsp;</span>
                    Your Selection
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Booking Form */}
        <div className="col-lg-4">
          <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h3 className="fw-bold mb-4"><i className="bi bi-file-earmark-text text-info me-2"></i>Booking Details</h3>

              {message && <div className="alert alert-success py-2 small">{message}</div>}
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <form onSubmit={handleBookingSubmit}>
                <div className="mb-3">
                  <label className="form-label text-secondary small">Selected Date</label>
                  <input
                    type="text"
                    className="form-control form-sports-input"
                    value={new Date(date).toLocaleDateString()}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary small">Selected Slot</label>
                  <input
                    type="text"
                    className="form-control form-sports-input"
                    value={selectedSlot || 'None Selected'}
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-secondary small">Purpose of Booking</label>
                  <textarea
                    className="form-control form-sports-input"
                    rows="4"
                    placeholder="e.g., Cricket Nets Practice, Soccer Match with Team Alpha, etc."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-sports w-100 py-3"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting Request...
                    </>
                  ) : 'Confirm Booking'}
                </button>
              </form>
            </div>

            <div className="mt-4 pt-3 border-top border-secondary text-secondary small">
              <i className="bi bi-info-circle me-1"></i> Reservations require approval from the administrator and are processed within 24 hours.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookStadium;
