import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password,
        role
      });

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try a different username or email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 mt-4 animated-fade-in">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="glass-card p-5">
            <div className="text-center mb-4">
              <i className="bi bi-person-plus-fill text-info fs-1"></i>
              <h2 className="fw-bold mt-2">Create Account</h2>
              <p className="text-secondary">Register to start managing tournaments and bookings</p>
            </div>

            {error && (
              <div className="alert alert-danger border-0 bg-danger bg-opacity-25 text-white" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success border-0 bg-success bg-opacity-25 text-white" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i> {success}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-light">Username</label>
                  <input
                    type="text"
                    className="form-control form-sports-input"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-light">Email Address</label>
                  <input
                    type="email"
                    className="form-control form-sports-input"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-light">Password</label>
                  <input
                    type="password"
                    className="form-control form-sports-input"
                    placeholder="At least 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-light">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control form-sports-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-light">Select Role</label>
                <select
                  className="form-select form-sports-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">User (Team Captain / Guest)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-sports w-100 py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating Account...
                  </>
                ) : 'Sign Up'}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-secondary small mb-0">
                Already have an account? <Link to="/login" className="text-info text-decoration-none">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
