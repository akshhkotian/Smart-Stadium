import React, { useState } from 'react';
import axios from 'axios';

const Feedback = () => {
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!feedback.trim()) {
      setError('Please type your feedback message.');
      return;
    }

    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post('http://localhost:5000/api/feedback', {
        message: feedback
      }, { headers });

      setSuccess(response.data.message);
      setFeedback('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5 animated-fade-in">
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="glass-card p-5">
            <div className="text-center mb-4">
              <i className="bi bi-chat-heart text-info fs-1"></i>
              <h2 className="fw-bold mt-2">Submit Feedback</h2>
              <p className="text-secondary">Help us improve stadium facilities and tournament structures</p>
            </div>

            {success && (
              <div className="alert alert-success border-0 bg-success bg-opacity-25 text-white" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i> {success}
              </div>
            )}

            {error && (
              <div className="alert alert-danger border-0 bg-danger bg-opacity-25 text-white" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label text-light">Feedback Message</label>
                <textarea
                  className="form-control form-sports-input"
                  rows="6"
                  placeholder="Share details of your experience, report stadium infrastructure issues, or suggest tournament improvements..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
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
                    Sending...
                  </>
                ) : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
