import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Leaderboard = () => {
  const [standings, setStandings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/tournaments');
      setTournaments(response.data);
      // Select the first tournament if available to make leaderboard look filled
      if (response.data.length > 0) {
        setSelectedTournamentId(response.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/leaderboard', {
        params: { tournament_id: selectedTournamentId }
      });
      setStandings(response.data);
    } catch (err) {
      console.error("Error fetching leaderboard standings:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4 animated-fade-in">
      <div className="mb-4">
        <h1 className="fw-bold">Leaderboard</h1>
        <p className="text-secondary font-monospace">Rankings, scores, and points standings</p>
      </div>

      {/* Select Tournament Filter */}
      <div className="glass-card p-4 mb-4">
        <div className="row align-items-center">
          <div className="col-md-6">
            <label className="form-label text-secondary small">Select Tournament</label>
            <select
              className="form-select form-sports-input"
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
            >
              <option value="">All Tournaments (Combined)</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.sport_type})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading Standings...</span>
          </div>
        </div>
      ) : standings.length === 0 ? (
        <div className="text-center py-5 glass-card">
          <i className="bi bi-award text-secondary fs-1 mb-2"></i>
          <p className="text-secondary">No standings available for this selection.</p>
        </div>
      ) : (
        <div className="glass-card p-4">
          <div className="table-responsive">
            <table className="table table-sports table-hover mb-0">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '80px' }}>Rank</th>
                  <th>Team</th>
                  <th>Tournament</th>
                  <th className="text-center">Played</th>
                  <th className="text-center">Won</th>
                  <th className="text-center">Lost</th>
                  <th className="text-center">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="text-center fw-bold">
                      {idx === 0 ? (
                        <span className="badge bg-warning text-dark px-3 py-2 rounded-circle fs-6">
                          <i className="bi bi-trophy-fill"></i>
                        </span>
                      ) : idx === 1 ? (
                        <span className="badge bg-light text-dark px-3 py-2 rounded-circle fs-6">2</span>
                      ) : idx === 2 ? (
                        <span className="badge bg-danger bg-opacity-75 px-3 py-2 rounded-circle fs-6">3</span>
                      ) : (
                        <span className="px-3 py-2 fs-6 text-secondary">{idx + 1}</span>
                      )}
                    </td>
                    <td>
                      <strong className="text-white">{row.team_name}</strong>
                    </td>
                    <td>{row.tournament_name}</td>
                    <td className="text-center font-monospace">{row.matches_played}</td>
                    <td className="text-center font-monospace text-success">{row.matches_won}</td>
                    <td className="text-center font-monospace text-danger">{row.matches_lost}</td>
                    <td className="text-center font-monospace fw-bold text-info fs-5">{row.points}</td>
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

export default Leaderboard;
