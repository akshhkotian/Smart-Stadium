import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TournamentsList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [sportType, setSportType] = useState('');
  const [status, setStatus] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchTournaments();
    fetchMyTeams();
  }, [search, sportType, status]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/tournaments', {
        params: { search, sport_type: sportType, status }
      });
      setTournaments(response.data);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeams = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/api/teams', { headers });
      // Filter teams where current user is the captain
      const captainedTeams = response.data.filter(t => t.captain_id === user.id);
      setMyTeams(captainedTeams);
      if (captainedTeams.length > 0) {
        setSelectedTeamId(captainedTeams[0].id);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  const handleOpenRegisterModal = async (tournament) => {
    setSelectedTournament(tournament);
    setMessage('');
    setError('');
    
    // Fetch registered teams for this tournament
    try {
      const response = await axios.get(`http://localhost:5000/api/tournaments/${tournament.id}/teams`);
      setRegisteredTeams(response.data);
    } catch (err) {
      console.error("Error fetching registered teams:", err);
    }
  };

  const handleRegisterTeamSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!selectedTeamId) {
      setError('Please select a team. If you do not have a team, create one in the Profile or Teams page first.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`http://localhost:5000/api/tournaments/${selectedTournament.id}/register`, {
        team_id: selectedTeamId
      }, { headers });

      setMessage(response.data.message);
      
      // Refresh registered teams list
      const teamsResponse = await axios.get(`http://localhost:5000/api/tournaments/${selectedTournament.id}/teams`);
      setRegisteredTeams(teamsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register team.');
    }
  };

  return (
    <div className="container py-4">

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div>
          <h1 className="fw-bold">Tournaments</h1>
          <p className="text-secondary font-monospace">Explore ongoing and upcoming sports challenges</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-5">
            <label className="form-label text-secondary small">Search</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control form-sports-input"
                placeholder="Search tournament name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label text-secondary small">Sport Type</label>
            <select
              className="form-select form-sports-input"
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
            >
              <option value="">All Sports</option>
              <option value="Soccer">Soccer</option>
              <option value="Cricket">Cricket</option>
              <option value="Basketball">Basketball</option>
              <option value="Tennis">Tennis</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label text-secondary small">Status</label>
            <select
              className="form-select form-sports-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading Tournaments...</span>
          </div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-5 glass-card">
          <i className="bi bi-calendar-x text-secondary fs-1 mb-2"></i>
          <p className="text-secondary">No tournaments match your search/filter criteria.</p>
        </div>
      ) : (
        <div className="row g-4">
          {tournaments.map((tour) => (
            <div className="col-md-6 col-lg-4" key={tour.id}>
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-sports-gradient">{tour.sport_type}</span>
                    <span className={`badge ${
                      tour.status === 'ongoing' ? 'bg-success' : 
                      tour.status === 'upcoming' ? 'bg-warning text-dark' : 'bg-secondary'
                    }`}>
                      {tour.status}
                    </span>
                  </div>
                  <h4 className="fw-bold mb-2 text-white">{tour.name}</h4>
                  <p className="text-secondary small mb-3">{tour.description}</p>
                  <div className="border-top border-secondary pt-3 mb-4 small text-secondary">
                    <div>
                      <i className="bi bi-calendar3 me-2"></i>
                      Starts: {new Date(tour.start_date).toLocaleDateString()}
                    </div>
                    <div className="mt-1">
                      <i className="bi bi-calendar3-event me-2"></i>
                      Ends: {new Date(tour.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    onClick={() => handleOpenRegisterModal(tour)}
                    className="btn btn-sports w-100"
                    data-bs-toggle="modal"
                    data-bs-target="#registrationModal"
                  >
                    View Details & Register
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration & Details Modal */}
      <div className="modal fade" id="registrationModal" tabIndex="-1" aria-labelledby="registrationModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold" id="registrationModalLabel">
                {selectedTournament?.name}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            
            <div className="modal-body p-4">
              <div className="mb-4">
                <h6 className="text-info fw-bold text-uppercase small">Tournament Information</h6>
                <p className="opacity-90">{selectedTournament?.description}</p>
                <div className="row g-3 mt-1 text-secondary small">
                  <div className="col-sm-4">
                    <strong>Sport:</strong> {selectedTournament?.sport_type}
                  </div>
                  <div className="col-sm-4">
                    <strong>Start Date:</strong> {selectedTournament && new Date(selectedTournament.start_date).toLocaleDateString()}
                  </div>
                  <div className="col-sm-4">
                    <strong>End Date:</strong> {selectedTournament && new Date(selectedTournament.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="row g-4 border-top border-secondary pt-4">
                {/* Left side: Register Form */}
                <div className="col-md-6 border-end border-secondary">
                  <h6 className="text-info fw-bold text-uppercase small mb-3">Register Your Team</h6>
                  
                  {message && <div className="alert alert-success py-2 small">{message}</div>}
                  {error && <div className="alert alert-danger py-2 small">{error}</div>}

                  {selectedTournament?.status === 'completed' ? (
                    <div className="alert alert-warning py-2 small">This tournament has completed. Registrations are closed.</div>
                  ) : myTeams.length === 0 ? (
                    <div className="alert alert-warning py-2 small">
                      You aren't the captain of any team. Register or become captain of a team to enroll!
                    </div>
                  ) : (
                    <form onSubmit={handleRegisterTeamSubmit}>
                      <div className="mb-3">
                        <label className="form-label small text-secondary">Choose Team</label>
                        <select
                          className="form-select form-sports-input"
                          value={selectedTeamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                        >
                          {myTeams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="btn btn-sports w-100">
                        Submit Registration
                      </button>
                    </form>
                  )}
                </div>

                {/* Right side: Registered Teams */}
                <div className="col-md-6">
                  <h6 className="text-info fw-bold text-uppercase small mb-3">Registered Roster ({registeredTeams.length})</h6>
                  {registeredTeams.length === 0 ? (
                    <p className="text-secondary small">No teams registered yet. Be the first!</p>
                  ) : (
                    <ul className="list-group list-group-flush bg-transparent">
                      {registeredTeams.map((team, idx) => (
                        <li key={team.id} className="list-group-item bg-transparent border-secondary px-0 py-2 d-flex justify-content-between align-items-center">
                          <span>{idx + 1}. {team.name}</span>
                          <span className="badge bg-secondary rounded-pill small">Captain: {team.captain_name}</span>
                        </li>
                      ))}

                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer border-secondary">
              <button type="button" className="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentsList;
