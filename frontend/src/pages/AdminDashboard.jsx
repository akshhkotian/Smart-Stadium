import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/api/reports/dashboard-stats', { headers });
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading Metrics...</span>
        </div>
      </div>
    );
  }

  // Chart 1 data: Booking status counts
  const bookingStatusData = {
    labels: stats.charts.booking_status.map(item => item.status.toUpperCase()),
    datasets: [
      {
        label: 'Bookings Count',
        data: stats.charts.booking_status.map(item => item.count),
        backgroundColor: [
          'rgba(22, 163, 74, 0.7)',  // approved (green)
          'rgba(234, 179, 8, 0.7)',  // pending (yellow)
          'rgba(220, 38, 38, 0.7)'   // rejected (red)
        ],
        borderColor: [
          '#16a34a',
          '#eab308',
          '#dc2626'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart 2 data: Registrations by Tournament
  const registrationsData = {
    labels: stats.charts.registrations_by_tournament.map(item => item.tournament_name),
    datasets: [
      {
        label: 'Registered Teams',
        data: stats.charts.registrations_by_tournament.map(item => item.count),
        backgroundColor: 'rgba(56, 189, 248, 0.6)',
        borderColor: '#38bdf8',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#f8fafc',
          font: { family: 'Outfit' }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#94a3b8', stepSize: 1 },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  };

  return (
    <div className="container py-4 animated-fade-in">
      <div className="mb-4">
        <h1 className="fw-bold text-white">Admin Dashboard</h1>
        <p className="text-secondary font-monospace">Real-time stadium analytics and operations overview</p>
      </div>

      {/* Grid of cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary text-uppercase fw-bold small">Total Users</span>
              <h2 className="display-6 fw-bold text-info mt-1 mb-0">{stats.total_users}</h2>
            </div>
            <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle fs-4">
              <i className="bi bi-people"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary text-uppercase fw-bold small">Active Tournaments</span>
              <h2 className="display-6 fw-bold text-info mt-1 mb-0">{stats.total_tournaments}</h2>
            </div>
            <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle fs-4">
              <i className="bi bi-trophy"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary text-uppercase fw-bold small">Registered Teams</span>
              <h2 className="display-6 fw-bold text-info mt-1 mb-0">{stats.total_teams}</h2>
            </div>
            <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle fs-4">
              <i className="bi bi-shield-shaded"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary text-uppercase fw-bold small">Pending Bookings</span>
              <h2 className="display-6 fw-bold text-warning mt-1 mb-0">{stats.pending_bookings}</h2>
            </div>
            <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-circle fs-4">
              <i className="bi bi-calendar-event"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="row g-4">
        {/* Chart 1: Tournament Registrations */}
        <div className="col-lg-7">
          <div className="glass-card p-4">
            <h4 className="fw-bold mb-4"><i className="bi bi-bar-chart-fill text-info me-2"></i>Registrations by Tournament</h4>
            <div style={{ height: '300px', position: 'relative' }}>
              <Bar data={registrationsData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Chart 2: Booking status distribution */}
        <div className="col-lg-5">
          <div className="glass-card p-4">
            <h4 className="fw-bold mb-4"><i className="bi bi-pie-chart-fill text-info me-2"></i>Booking Status Overview</h4>
            <div style={{ height: '300px', position: 'relative' }}>
              <Doughnut 
                data={bookingStatusData} 
                options={{
                  ...chartOptions,
                  scales: {} // Disable scales for Doughnut
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
