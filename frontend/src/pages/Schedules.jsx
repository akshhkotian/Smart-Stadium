import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Schedules = () => {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
    fetchMatches();
  }, [selectedTournamentId, selectedStatus]);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tournaments');
      setTournaments(response.data);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/matches', {
        params: {
          tournament_id: selectedTournamentId,
          status: selectedStatus
        }
      });
      setMatches(response.data);
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4 animated-fade-in">
      <div className="mb-4">
        <h1 className="fw-bold">Match Schedules</h1>
        <p className="text-secondary font-monospace">Track match fixtures, live action, and final results</p>
      </div>

      {/* Filter panel */}
      <div className="glass-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label text-secondary small">Filter by Tournament</label>
            <select
              className="form-select form-sports-input"
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
            >
              <option value="">All Tournaments</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.sport_type})</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label text-secondary small">Filter by Match Status</label>
            <select
              className="form-select form-sports-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live / Ongoing</option>
              <option value="completed">Completed / Finished</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches Roster */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading Matches...</span>
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-5 glass-card">
          <i className="bi bi-calendar-minus text-secondary fs-1 mb-2"></i>
          <p className="text-secondary">No matches scheduled with current filter parameters.</p>
        </div>
      ) : (
        <div className="row g-4">
          {matches.map((match) => (
            <div className="col-md-6" key={match.id}>
              <div className="glass-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="badge bg-sports-gradient">{match.tournament_name}</span>
                  <span className={`badge d-flex align-items-center gap-1 ${
                    match.status === 'live' ? 'bg-danger animate-pulse' :
                    match.status === 'completed' ? 'bg-success' : 'bg-info text-dark'
                  }`}>
                    {match.status === 'live' ? (
                      <>
                        <i className="bi bi-record-fill text-white"></i> LIVE
                      </>
                    ) : match.status.toUpperCase()}
                  </span>
                </div>


                {/* Scoreboard layout */}
                <div className="row text-center align-items-center my-4">
                  <div className="col">
                    <h5 className="fw-bold text-truncate">{match.team1_name}</h5>
                    {match.winner_id === match.team1_id && (
                      <span className="badge bg-warning text-dark small"><i className="bi bi-award-fill"></i> Winner</span>
                    )}
                  </div>
                  <div className="col-auto">
                    {match.status !== 'scheduled' ? (
                      <div className="d-flex align-items-center justify-content-center gap-3">
                        <span className="display-6 fw-bold text-neon">{match.score1}</span>
                        <span className="text-secondary">-</span>
                        <span className="display-6 fw-bold text-neon">{match.score2}</span>
                      </div>
                    ) : (
                      <span className="badge bg-secondary py-2 px-3 fs-6">VS</span>
                    )}
                  </div>
                  <div className="col">
                    <h5 className="fw-bold text-truncate">{match.team2_name}</h5>
                    {match.winner_id === match.team2_id && (
                      <span className="badge bg-warning text-dark small"><i className="bi bi-award-fill"></i> Winner</span>
                    )}
                  </div>
                </div>

                <div className="border-top border-secondary pt-3 d-flex justify-content-between align-items-center text-secondary small">
                  <div>
                    <i className="bi bi-clock me-2"></i>
                    {new Date(match.match_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  {match.status === 'completed' && match.score1 === match.score2 && (
                    <span className="text-warning fw-bold">Draw Match</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedules;
