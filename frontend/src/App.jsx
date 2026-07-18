import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// User Pages
import UserDashboard from './pages/UserDashboard';
import TournamentsList from './pages/TournamentsList';
import Schedules from './pages/Schedules';
import BookStadium from './pages/BookStadium';
import BookingHistory from './pages/BookingHistory';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers';
import ManageTournaments from './pages/ManageTournaments';
import ManageTeams from './pages/ManageTeams';
import ScheduleMatches from './pages/ScheduleMatches';
import ManageBookings from './pages/ManageBookings';
import ManageAnnouncements from './pages/ManageAnnouncements';
import Reports from './pages/Reports';

const LandingPage = () => {
  return (
    <div className="container py-5">
      <Hero />
      <div className="row g-4 mt-4">
        <div className="col-md-4">
          <div className="glass-card p-4 text-center">
            <i className="bi bi-calendar-event text-info fs-1"></i>
            <h4 className="fw-bold mt-2">Stadium Booking</h4>
            <p className="text-secondary small">Rent top-tier grass fields and netting arrays with secure slot allocation.</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card p-4 text-center">
            <i className="bi bi-shield-shaded text-info fs-1"></i>
            <h4 className="fw-bold mt-2">Tournament Leagues</h4>
            <p className="text-secondary small">Register teams, view fixtures, and compete against other clubs for league trophies.</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card p-4 text-center">
            <i className="bi bi-graph-up text-info fs-1"></i>
            <h4 className="fw-bold mt-2">Standings & Leaderboard</h4>
            <p className="text-secondary small">Watch live standing calculation tables updated automatically with match score inputs.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100 bg-dark-gradient">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/login" 
              element={token ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={token ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace /> : <Register />} 
            />

            {/* Protected User Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tournaments" 
              element={
                <ProtectedRoute allowedRoles={['user', 'admin']}>
                  <TournamentsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/schedules" 
              element={
                <ProtectedRoute allowedRoles={['user', 'admin']}>
                  <Schedules />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/book" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <BookStadium />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/booking-history" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <BookingHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute allowedRoles={['user', 'admin']}>
                  <Leaderboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/feedback" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Feedback />
                </ProtectedRoute>
              } 
            />

            {/* Protected Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tournaments" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageTournaments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/teams" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageTeams />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/matches" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ScheduleMatches />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/bookings" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageBookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/announcements" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageAnnouncements />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
