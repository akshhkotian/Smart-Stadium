import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Dynamically add/remove body padding/margin class depending on sidebar existence
  useEffect(() => {
    if (token) {
      document.body.classList.add('has-sidebar');
    } else {
      document.body.classList.remove('has-sidebar');
    }
    // Close sidebar on path change
    setMobileSidebarOpen(false);
  }, [token, location.pathname]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.body.classList.remove('has-sidebar');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  // 1. PUBLIC TOP NAVIGATION (When logged out)
  if (!token) {
    return (
      <nav className="navbar navbar-expand-lg border-bottom sticky-top py-3">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <i className="bi bi-trophy me-2 fs-3"></i>
            <span className="fw-extrabold tracking-wider fs-4">SMART STADIUM</span>
          </Link>
          
          <div className="d-flex align-items-center gap-2">
            {/* Theme Toggle */}
            <button 
              className="btn btn-link nav-link p-2 me-2" 
              onClick={toggleTheme} 
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              style={{ color: 'var(--toggle-btn-color)', fontSize: '1.2rem', border: 'none', background: 'none' }}
            >
              {theme === 'light' ? <i className="bi bi-moon"></i> : <i className="bi bi-sun"></i>}
            </button>
            <Link className="btn btn-outline-info rounded-pill px-4" to="/login">Login</Link>
            <Link className="btn btn-sports rounded-pill px-4" to="/register">Register</Link>
          </div>
        </div>
      </nav>
    );
  }

  // 2. DASHBOARD LEFT SIDEBAR (When logged in)
  return (
    <>
      {/* Mobile Top Header */}
      <div className="mobile-header no-print">
        <button 
          className="btn btn-outline-secondary p-2 border-0"
          onClick={() => setMobileSidebarOpen(true)}
          style={{ fontSize: '1.5rem' }}
        >
          <i className="bi bi-list"></i>
        </button>

        <Link className="navbar-brand d-flex align-items-center mb-0 mx-auto" to="/dashboard">
          <i className="bi bi-trophy me-2 fs-4"></i>
          <span className="fw-bold fs-5">SMART STADIUM</span>
        </Link>

        {/* Theme Toggle in Mobile header */}
        <button 
          className="btn btn-link nav-link p-2" 
          onClick={toggleTheme}
          style={{ color: 'var(--toggle-btn-color)', fontSize: '1.25rem', border: 'none', background: 'none' }}
        >
          {theme === 'light' ? <i className="bi bi-moon"></i> : <i className="bi bi-sun"></i>}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-overlay no-print" 
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside className={`sidebar no-print ${mobileSidebarOpen ? 'show' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header d-flex align-items-center justify-content-between">
          <Link className="navbar-brand d-flex align-items-center text-decoration-none" to="/dashboard">
            <i className="bi bi-trophy me-2 fs-3 text-neon"></i>
            <span className="fw-extrabold tracking-wider fs-5">SMART STADIUM</span>
          </Link>
          
          {/* Close button for mobile sidebar */}
          <button 
            className="btn btn-link nav-link d-lg-none p-1 text-secondary"
            onClick={() => setMobileSidebarOpen(false)}
            style={{ fontSize: '1.25rem' }}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        {/* User profile brief card */}
        <div className="mb-4 p-3 rounded-3 bg-opacity-50 border border-secondary text-center">
          <div className="d-flex align-items-center gap-3 text-start">
            <div className="bg-sports-gradient text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
              <i className="bi bi-person fs-4"></i>
            </div>
            <div>
              <span className="text-secondary small d-block">Welcome back,</span>
              <strong className="text-neon">{user.username}</strong>
              <span className="badge bg-secondary rounded-pill d-block mt-1 small" style={{ fontSize: '0.7rem', width: 'fit-content' }}>
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Options */}
        <div className="sidebar-menu">
          {user.role === 'admin' ? (
            /* ADMIN LAYOUT MENU */
            <>
              <Link className={`sidebar-link ${isActive('/admin/dashboard')}`} to="/admin/dashboard">
                <i className="bi bi-grid-1x2"></i>
                <span>Dashboard</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/users')}`} to="/admin/users">
                <i className="bi bi-people"></i>
                <span>Manage Users</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/tournaments')}`} to="/admin/tournaments">
                <i className="bi bi-award"></i>
                <span>Tournaments</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/teams')}`} to="/admin/teams">
                <i className="bi bi-shield"></i>
                <span>Teams & Players</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/matches')}`} to="/admin/matches">
                <i className="bi bi-calendar-event"></i>
                <span>Match Schedules</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/bookings')}`} to="/admin/bookings">
                <i className="bi bi-journal-check"></i>
                <span>Stadium Bookings</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/announcements')}`} to="/admin/announcements">
                <i className="bi bi-megaphone"></i>
                <span>Announcements</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/admin/reports')}`} to="/admin/reports">
                <i className="bi bi-file-earmark-bar-graph"></i>
                <span>Reports</span>
              </Link>
            </>
          ) : (
            /* USER LAYOUT MENU */
            <>
              <Link className={`sidebar-link ${isActive('/dashboard')}`} to="/dashboard">
                <i className="bi bi-grid-1x2"></i>
                <span>Dashboard</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/tournaments')}`} to="/tournaments">
                <i className="bi bi-trophy"></i>
                <span>Tournaments</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/schedules')}`} to="/schedules">
                <i className="bi bi-calendar3"></i>
                <span>Schedules</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/book')}`} to="/book">
                <i className="bi bi-calendar-plus"></i>
                <span>Book Stadium</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/booking-history')}`} to="/booking-history">
                <i className="bi bi-clock-history"></i>
                <span>Booking History</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/leaderboard')}`} to="/leaderboard">
                <i className="bi bi-list-ol"></i>
                <span>Leaderboard</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/profile')}`} to="/profile">
                <i className="bi bi-person-gear"></i>
                <span>Profile Settings</span>
              </Link>
              <Link className={`sidebar-link ${isActive('/feedback')}`} to="/feedback">
                <i className="bi bi-chat-left-text"></i>
                <span>Send Feedback</span>
              </Link>
            </>
          )}
        </div>

        {/* Sidebar Footer (Theme toggle & Logout) */}
        <div className="border-top border-secondary pt-3 d-flex flex-column gap-2">
          {/* Theme switcher on desktop sidebar (icon only, centered) */}
          <div className="d-none d-lg-flex justify-content-center mb-2">
            <button 
              className="btn btn-link nav-link p-2" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              style={{ fontSize: '1.4rem', border: 'none', background: 'none', color: 'var(--toggle-btn-color)' }}
            >
              {theme === 'light' ? <i className="bi bi-moon"></i> : <i className="bi bi-sun"></i>}
            </button>
          </div>


          <button className="btn btn-outline-danger w-100 rounded-pill py-2" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
