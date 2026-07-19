import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ScheduleMatches = () => {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]); // Teams registered for the SELECTED tournament
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Schedule Match Form Fields
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [matchDate, setMatchDate] = useState('');

  // Update Score Modal / Form Fields
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [status, setStatus] = useState('scheduled');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTournaments();
    fetchMatches();
  }, []);

  // Fetch teams when tournament changes in the schedule form
  useEffect(() => {
    if (selectedTournamentId) {
      fetchRegisteredTeams(selectedTournamentId);
    } else {
      setTeams([]);
    }
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/tournaments');
      setTournaments(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRegisteredTeams = async (tourId) => {
    try {
      const response = await axios.get(`https://smart-stadium-1nrv.onrender.com/api/tournaments/${tourId}/teams`);
      setTeams(response.data);
      if (response.data.length >= 2) {
        setTeam1Id(response.data[0].id);
        setTeam2Id(response.data[1].id);
      } else {
        setTeam1Id('');
        setTeam2Id('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/matches');
      setMatches(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!selectedTournamentId || !team1Id || !team2Id || !matchDate) {
      setError('All fields are required.');
      return;
    }

    if (team1Id === team2Id) {
      setError('Teams cannot play against themselves.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post('https://smart-stadium-1nrv.onrender.com/api/matches', {
        tournament_id: parseInt(selectedTournamentId),
        team1_id: parseInt(team1Id),
        team2_id: parseInt(team2Id),
        match_date: matchDate
      }, { headers });

      setMessage(response.data.message);
      setMatchDate('');
      fetchMatches();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule match.');
    }
  };

  const handleScoreEditClick = (match) => {
    setSelectedMatch(match);
    setScore1(match.score1 !== null ? match.score1.toString() : '0');
    setScore2(match.score2 !== null ? match.score2.toString() : '0');
    setStatus(match.status);
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put(`https://smart-stadium-1nrv.onrender.com/api/matches/${selectedMatch.id}/score`, {
        score1: parseInt(score1),
        score2: parseInt(score2),
        status: status
      }, { headers });

      setMessage(response.data.message);
      
      // Close modal (standard Bootstrap logic)
      const closeBtn = document.getElementById('closeModalBtn');
      if (closeBtn) closeBtn.click();
      
      fetchMatches();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update score.');
    }
  };

  return (
    <div className="container py-4">

      <div className="mb-4">
        <h1 className="fw-bold">Schedule & Score Updates</h1>
        <p className="text-secondary font-monospace">Manage fixtures, broadcast live statuses, and submit match scores</p>
      </div>

      {message && <div className="alert alert-success py-2 small">{message}</div>}
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="row g-4">
        {/* Left Side: Schedule Match Form */}
        <div className="col-lg-4">
          <div className="glass-card p-4">
            <h3 className="fw-bold mb-4"><i className="bi bi-calendar-plus-fill text-info me-2"></i>Schedule Match</h3>
            
            <form onSubmit={handleScheduleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small">Tournament</label>
                <select
                  className="form-select form-sports-input"
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                >
                  <option value="">Select Tournament</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.sport_type})</option>
                  ))}
                </select>
              </div>

              {selectedTournamentId && (
                <>
                  <div className="mb-3">
                    <label className="form-label text-secondary small">Team 1</label>
                    <select
                      className="form-select form-sports-input"
                      value={team1Id}
                      onChange={(e) => setTeam1Id(e.target.value)}
                    >
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small">Team 2</label>
                    <select
                      className="form-select form-sports-input"
                      value={team2Id}
                      onChange={(e) => setTeam2Id(e.target.value)}
                    >
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>

                  {teams.length < 2 && (
                    <div className="alert alert-warning py-1 small mb-3">
                      Minimum 2 teams must register for this tournament to schedule a match.
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="form-label text-secondary small">Match Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-control form-sports-input"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-sports w-100"
                    disabled={teams.length < 2}
                  >
                    Schedule Match
                  </button>
                </>
              )}
            </form>
          </div>
        </div>

        {/* Right Side: Matches List */}
        <div className="col-lg-8">
          <div className="glass-card p-4">
            <h3 className="fw-bold mb-4"><i className="bi bi-list-columns text-info me-2"></i>Match Fixtures</h3>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading Matches...</span>
                </div>
              </div>
            ) : matches.length === 0 ? (
              <p className="text-secondary small">No matches scheduled yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sports table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Tournament</th>
                      <th>Match Details</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => (
                      <tr key={match.id}>
                        <td>
                          <span className="badge bg-secondary">{match.tournament_name}</span>
                        </td>
                        <td>
                          <strong className="text-white">{match.team1_name}</strong>
                          <span className="text-info font-monospace mx-2">
                            {match.status !== 'scheduled' ? `${match.score1} - ${match.score2}` : 'VS'}
                          </span>
                          <strong className="text-white">{match.team2_name}</strong>
                        </td>
                        <td className="small text-secondary">
                          {new Date(match.match_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td>
                          <span className={`badge px-2 py-1 rounded-pill ${
                            match.status === 'live' ? 'bg-danger' :
                            match.status === 'completed' ? 'bg-success' : 'bg-info text-dark'
                          }`}>
                            {match.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            onClick={() => handleScoreEditClick(match)}
                            className="btn btn-outline-info btn-sm rounded-pill"
                            data-bs-toggle="modal"
                            data-bs-target="#scoreModal"
                          >
                            Update Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Score Modal */}
      <div className="modal fade" id="scoreModal" tabIndex="-1" aria-labelledby="scoreModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold" id="scoreModalLabel">
                Update Match Score
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModalBtn"></button>
            </div>

            
            <form onSubmit={handleScoreSubmit}>
              <div className="modal-body p-4">
                {selectedMatch && (
                  <>
                    <div className="text-center mb-4">
                      <h6>{selectedMatch.tournament_name}</h6>
                      <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
                        <strong className="fs-5">{selectedMatch.team1_name}</strong>
                        <span className="badge bg-secondary">VS</span>
                        <strong className="fs-5">{selectedMatch.team2_name}</strong>
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label text-secondary small">{selectedMatch.team1_name} Score</label>
                        <input
                          type="number"
                          className="form-control form-sports-input"
                          min="0"
                          value={score1}
                          onChange={(e) => setScore1(e.target.value)}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label text-secondary small">{selectedMatch.team2_name} Score</label>
                        <input
                          type="number"
                          className="form-control form-sports-input"
                          min="0"
                          value={score2}
                          onChange={(e) => setScore2(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-secondary small">Match Status</label>
                      <select
                        className="form-select form-sports-input"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live / Ongoing</option>
                        <option value="completed">Completed / Finished</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-sports px-4">Save Changes</button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMatches;
