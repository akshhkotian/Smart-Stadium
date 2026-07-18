import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="bg-sports-gradient text-white py-5 mb-5 rounded-4 overflow-hidden position-relative animated-fade-in shadow-lg">
      {/* Decorative soccer/sports background glow */}
      <div className="position-absolute top-50 start-50 translate-middle w-75 h-75 bg-info rounded-circle opacity-10 filter blur-3xl pointer-events-none"></div>

      <div className="container py-5 position-relative z-1">
        <div className="row justify-content-center text-center">
          <div className="col-lg-8">
            <span className="badge bg-cyan-gradient text-dark fw-bold px-3 py-2 rounded-pill mb-3">SMART SPORTS MANAGEMENT</span>
            <h1 className="display-4 fw-extrabold mb-3 tracking-tight">
              Elevate Your <span className="text-info text-neon">Tournament & Stadium</span> Operations
            </h1>
            <p className="lead mb-4 text-light opacity-90">
              Manage teams, track live schedules, update scores, compute standings, and book premium stadium slots seamlessly from one smart portal.
            </p>
            <div className="d-flex justify-content-center gap-3">
              {token ? (
                <>
                  <Link 
                    to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} 
                    className="btn btn-sports btn-lg px-4"
                  >
                    Go to Dashboard <i className="bi bi-arrow-right-short ms-1"></i>
                  </Link>
                  {!user.role === 'admin' && (
                    <Link to="/book" className="btn btn-sports-secondary btn-lg px-4">
                      Book Pitch
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-sports btn-lg px-4">
                    Get Started <i className="bi bi-box-arrow-in-right ms-2"></i>
                  </Link>
                  <Link to="/register" className="btn btn-sports-secondary btn-lg px-4">
                    Register Team
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
