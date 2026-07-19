import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageTeams = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Team Form
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [captainId, setCaptainId] = useState('');

  // Player Roster
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [playerAge, setPlayerAge] = useState('');
  const [playerMsg, setPlayerMsg] = useState('');
  const [playerErr, setPlayerErr] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/teams', { headers });
      setTeams(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/admin/users', { headers });
      setUsers(response.data);
      if (response.data.length > 0) {
        setCaptainId(response.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (team) => {
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setCaptainId(team.captain_id);
  };

  const clearTeamForm = () => {
    setEditingTeamId(null);
    setTeamName('');
    if (users.length > 0) {
      setCaptainId(users[0].id);
    }
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!teamName.trim() || !captainId) {
      setError('Please fill in all team fields.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editingTeamId) {
        const response = await axios.put(`https://smart-stadium-1nrv.onrender.com/api/teams/${editingTeamId}`, {
          name: teamName,
          captain_id: parseInt(captainId)
        }, { headers });
        setMessage(response.data.message);
      } else {
        const response = await axios.post('https://smart-stadium-1nrv.onrender.com/api/teams', {
          name: teamName,
          captain_id: parseInt(captainId)
        }, { headers });
        setMessage(response.data.message);
      }
      clearTeamForm();
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit team details.');
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team? All player rosters and tournament enrollments will be deleted!")) return;
    setMessage('');
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.delete(`https://smart-stadium-1nrv.onrender.com/api/teams/${id}`, { headers });
      setMessage(response.data.message);
      if (selectedTeam?.id === id) {
        setSelectedTeam(null);
      }
      fetchTeams();
    } catch (err) {
      setError('Failed to delete team.');
    }
  };

  // Player Handlers
  const handleViewRoster = async (team) => {
    setSelectedTeam(team);
    setPlayerMsg('');
    setPlayerErr('');
    fetchPlayers(team.id);
  };

  const fetchPlayers = async (teamId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`https://smart-stadium-1nrv.onrender.com/api/teams/${teamId}/players`, { headers });
      setPlayers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    setPlayerMsg('');
    setPlayerErr('');

    if (!playerName.trim() || !playerAge || !playerPosition.trim()) {
      setPlayerErr('All player fields are required.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`https://smart-stadium-1nrv.onrender.com/api/teams/${selectedTeam.id}/players`, {
        name: playerName,
        position: playerPosition,
        age: parseInt(playerAge)
      }, { headers });

      setPlayerMsg(response.data.message);
      setPlayerName('');
      setPlayerPosition('');
      setPlayerAge('');
      fetchPlayers(selectedTeam.id);
    } catch (err) {
      setPlayerErr(err.response?.data?.message || 'Failed to add player.');
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!window.confirm("Are you sure you want to remove this player?")) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`https://smart-stadium-1nrv.onrender.com/api/players/${playerId}`, { headers });
      fetchPlayers(selectedTeam.id);
    } catch (err) {
      setPlayerErr('Failed to delete player.');
    }
  };

  return (
    <div className="container py-4 animated-fade-in">
      <div className="mb-4">
        <h1 className="fw-bold">Manage Teams & Players</h1>
        <p className="text-secondary font-monospace">Control registrations, assign captains, and view rosters</p>
      </div>

      {message && <div className="alert alert-success py-2 small">{message}</div>}
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="row g-4">
        {/* Left: Team Form */}
        <div className="col-lg-4">
          <div className="glass-card p-4 mb-4">
            <h3 className="fw-bold mb-4">
              <i className="bi bi-shield-plus text-info me-2"></i>
              {editingTeamId ? 'Edit Team' : 'Add Team'}
            </h3>

            <form onSubmit={handleTeamSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small">Team Name *</label>
                <input
                  type="text"
                  className="form-control form-sports-input"
                  placeholder="e.g., Strikers FC"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small">Assign Captain *</label>
                <select
                  className="form-select form-sports-input"
                  value={captainId}
                  onChange={(e) => setCaptainId(e.target.value)}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-sports w-100">
                  {editingTeamId ? 'Update' : 'Create'}
                </button>
                {editingTeamId && (
                  <button type="button" className="btn btn-secondary rounded-pill px-3" onClick={clearTeamForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: Teams List & Roster Management */}
        <div className="col-lg-8">
          <div className="d-flex flex-column gap-4">
            {/* Teams Table */}
            <div className="glass-card p-4">
              <h3 className="fw-bold mb-4"><i className="bi bi-list-check text-info me-2"></i>Teams List</h3>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">Loading Teams...</span>
                  </div>
                </div>
              ) : teams.length === 0 ? (
                <p className="text-secondary small">No teams available.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sports table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Team Name</th>
                        <th>Captain Name</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team) => (
                        <tr key={team.id}>
                          <td>
                            <strong className="text-white">{team.name}</strong>
                          </td>
                          <td>{team.captain_name}</td>
                          <td className="text-end">
                            <button
                              onClick={() => handleViewRoster(team)}
                              className="btn btn-outline-info btn-sm me-2 rounded-pill"
                            >
                              Roster
                            </button>
                            <button
                              onClick={() => handleEditClick(team)}
                              className="btn btn-outline-warning btn-sm me-2 rounded-circle"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="btn btn-outline-danger btn-sm rounded-circle"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Selected Team Players Roster */}
            {selectedTeam && (
              <div className="glass-card p-4">
                <h4 className="fw-bold mb-3">
                  <i className="bi bi-people-fill text-info me-2"></i>
                  Roster: <span className="text-neon">{selectedTeam.name}</span>
                </h4>

                {playerMsg && <div className="alert alert-success py-2 small">{playerMsg}</div>}
                {playerErr && <div className="alert alert-danger py-2 small">{playerErr}</div>}

                {/* Add Player Form */}
                <form onSubmit={handleAddPlayer} className="row g-2 mb-4">
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control form-sports-input form-control-sm"
                      placeholder="Player Name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control form-sports-input form-control-sm"
                      placeholder="Position (e.g. Forward)"
                      value={playerPosition}
                      onChange={(e) => setPlayerPosition(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      type="number"
                      className="form-control form-sports-input form-control-sm"
                      placeholder="Age"
                      value={playerAge}
                      onChange={(e) => setPlayerAge(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <button type="submit" className="btn btn-sports btn-sm w-100 h-100">
                      Add Player
                    </button>
                  </div>
                </form>

                {players.length === 0 ? (
                  <p className="text-secondary small">No players registered on this roster.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sports table-hover table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Player Name</th>
                          <th>Position</th>
                          <th className="text-center">Age</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((p) => (
                          <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>{p.position}</td>
                            <td className="text-center">{p.age}</td>
                            <td className="text-end">
                              <button
                                onClick={() => handleRemovePlayer(p.id)}
                                className="btn btn-outline-danger btn-sm rounded-circle py-1"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTeams;
