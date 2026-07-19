import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [profile, setProfile] = useState({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Teams & Players Management
  const [myTeams, setMyTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamMsg, setTeamMsg] = useState('');
  const [teamErr, setTeamErr] = useState('');
  
  // Selected Team for Player Roster view
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState('');
  const [newPlayerAge, setNewPlayerAge] = useState('');
  const [playerMsg, setPlayerMsg] = useState('');
  const [playerErr, setPlayerErr] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProfile();
    fetchMyTeams();
  }, []);

  const fetchProfile = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/auth/profile', { headers });
      setProfile(response.data);
      setEmail(response.data.email);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyTeams = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('https://smart-stadium-1nrv.onrender.com/api/teams', { headers });
      // filter teams captained by the current user
      const captained = response.data.filter(t => t.captain_id === user.id);
      setMyTeams(captained);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');

    if (!email.trim()) {
      setProfileErr('Email cannot be empty.');
      return;
    }

    if (password && password !== confirmPassword) {
      setProfileErr('Passwords do not match.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put('https://smart-stadium-1nrv.onrender.com/api/auth/profile', {
        email,
        password: password || undefined
      }, { headers });

      setProfileMsg(response.data.message);
      setPassword('');
      setConfirmPassword('');
      fetchProfile();
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setTeamMsg('');
    setTeamErr('');

    if (!newTeamName.trim()) {
      setTeamErr('Team name cannot be empty.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post('https://smart-stadium-1nrv.onrender.com/api/teams', {
        name: newTeamName,
        captain_id: user.id
      }, { headers });

      setTeamMsg(response.data.message);
      setNewTeamName('');
      fetchMyTeams();
    } catch (err) {
      setTeamErr(err.response?.data?.message || 'Failed to create team.');
    }
  };

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

    if (!newPlayerName.trim() || !newPlayerAge || !newPlayerPos.trim()) {
      setPlayerErr('All player details are required.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`https://smart-stadium-1nrv.onrender.com/api/teams/${selectedTeam.id}/players`, {
        name: newPlayerName,
        position: newPlayerPos,
        age: parseInt(newPlayerAge)
      }, { headers });

      setPlayerMsg(response.data.message);
      setNewPlayerName('');
      setNewPlayerPos('');
      setNewPlayerAge('');
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
        <h1 className="fw-bold">Profile Management</h1>
        <p className="text-secondary font-monospace">Manage credentials and team rosters</p>
      </div>

      <div className="row g-4">
        {/* Profile Settings card */}
        <div className="col-lg-5">
          <div className="glass-card p-4">
            <h3 className="fw-bold mb-4"><i className="bi bi-person-fill text-info me-2"></i>Account Details</h3>
            
            {profileMsg && <div className="alert alert-success py-2 small">{profileMsg}</div>}
            {profileErr && <div className="alert alert-danger py-2 small">{profileErr}</div>}

            <form onSubmit={handleProfileUpdate}>
              <div className="mb-3">
                <label className="form-label text-secondary small">Username</label>
                <input
                  type="text"
                  className="form-control form-sports-input"
                  value={profile.username || ''}
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small">Email Address</label>
                <input
                  type="email"
                  className="form-control form-sports-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small">Change Password</label>
                <input
                  type="password"
                  className="form-control form-sports-input"
                  placeholder="New password (leave blank to keep current)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control form-sports-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-sports w-100">
                Update Profile Settings
              </button>
            </form>
          </div>
        </div>

        {/* Teams and Roster management card */}
        <div className="col-lg-7">
          <div className="d-flex flex-column gap-4">
            {/* My Teams */}
            <div className="glass-card p-4">
              <h3 className="fw-bold mb-3"><i className="bi bi-shield-shaded text-info me-2"></i>Your Teams</h3>
              
              {teamMsg && <div className="alert alert-success py-2 small">{teamMsg}</div>}
              {teamErr && <div className="alert alert-danger py-2 small">{teamErr}</div>}

              <form onSubmit={handleCreateTeam} className="row g-2 mb-4">
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control form-sports-input"
                    placeholder="Create a new team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-sports w-100">
                    Create Team
                  </button>
                </div>
              </form>

              {myTeams.length === 0 ? (
                <p className="text-secondary small">You haven't created any teams yet.</p>
              ) : (
                <div className="list-group list-group-flush">
                  {myTeams.map((team) => (
                    <div key={team.id} className="list-group-item bg-transparent text-white border-secondary px-0 py-2 d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{team.name}</strong>
                        <span className="small text-secondary d-block">Created on: {new Date(team.created_at).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => handleViewRoster(team)} className="btn btn-outline-info btn-sm rounded-pill px-3">
                        Manage Roster
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Players Roster */}
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
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control form-sports-input form-control-sm"
                      placeholder="Position"
                      value={newPlayerPos}
                      onChange={(e) => setNewPlayerPos(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      type="number"
                      className="form-control form-sports-input form-control-sm"
                      placeholder="Age"
                      value={newPlayerAge}
                      onChange={(e) => setNewPlayerAge(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <button type="submit" className="btn btn-sports btn-sm w-100 h-100">
                      Add
                    </button>
                  </div>
                </form>

                {players.length === 0 ? (
                  <p className="text-secondary small">No players registered. Add players to complete your roster.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sports table-sm table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Name</th>
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
                              <button onClick={() => handleRemovePlayer(p.id)} className="btn btn-outline-danger btn-sm rounded-circle py-1">
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

export default Profile;
