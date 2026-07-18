import os
import datetime
from functools import wraps
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling
import jwt
import bcrypt

app = Flask(__name__)
# Enable CORS for frontend running on localhost:5173
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

@app.route('/')
def home_redirect():
    return redirect('http://localhost:5173')


JWT_SECRET = "stadium_super_secret_key_123"

# Initialize MySQL connection pool
try:
    db_pool = pooling.MySQLConnectionPool(
        pool_name="stadium_pool",
        pool_size=5,
        host='127.0.0.1',
        port=3306,
        user='root',
        password='',
        database='stadium_db'
    )
except Exception as e:
    print(f"Error initializing DB Pool: {e}")
    db_pool = None

def get_db_connection():
    if not db_pool:
        raise Exception("Database Connection Pool is not initialized.")
    return db_pool.get_connection()

# Middleware to require JWT authentication
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Authorization token is missing!'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = {
                'id': data['user_id'],
                'username': data['username'],
                'role': data['role']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid!'}), 401
        except Exception as e:
            return jsonify({'message': f'Token error: {str(e)}'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Middleware to require admin access
def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({'message': 'Admin privilege required!'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# --- 1. AUTHENTICATION MODULE ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user') # default is user, can be 'admin'

    if not username or not email or not password:
        return jsonify({'message': 'All fields are required!'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
        if cursor.fetchone():
            return jsonify({'message': 'Username or Email already registered!'}), 400

        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert user
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (username, email, password_hash, role)
        )
        conn.commit()
        return jsonify({'message': 'User registered successfully!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required!'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'message': 'Invalid username or password!'}), 401

        # Generate JWT Token
        token = jwt.encode({
            'user_id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, JWT_SECRET, algorithm='HS256')

        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
    except Exception as e:
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/auth/profile', methods=['GET', 'PUT'])
@token_required
def profile(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == 'GET':
            cursor.execute("SELECT id, username, email, role, created_at FROM users WHERE id = %s", (current_user['id'],))
            user = cursor.fetchone()
            if not user:
                return jsonify({'message': 'User not found!'}), 404
            return jsonify(user), 200

        elif request.method == 'PUT':
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')

            if not email:
                return jsonify({'message': 'Email is required!'}), 400

            # Check if email is taken by another user
            cursor.execute("SELECT id FROM users WHERE email = %s AND id != %s", (email, current_user['id']))
            if cursor.fetchone():
                return jsonify({'message': 'Email already in use!'}), 400

            if password:
                # Update email and password
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                cursor.execute(
                    "UPDATE users SET email = %s, password_hash = %s WHERE id = %s",
                    (email, password_hash, current_user['id'])
                )
            else:
                # Update email only
                cursor.execute("UPDATE users SET email = %s WHERE id = %s", (email, current_user['id']))

            conn.commit()
            return jsonify({'message': 'Profile updated successfully!'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# --- 2. TOURNAMENTS MODULE ---

@app.route('/api/tournaments', methods=['GET'])
def get_tournaments():
    search = request.args.get('search', '')
    sport_type = request.args.get('sport_type', '')
    status = request.args.get('status', '')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM tournaments WHERE 1=1"
        params = []

        if search:
            query += " AND (name LIKE %s OR description LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
        if sport_type:
            query += " AND sport_type = %s"
            params.append(sport_type)
        if status:
            query += " AND status = %s"
            params.append(status)

        query += " ORDER BY start_date DESC"
        cursor.execute(query, tuple(params))
        tournaments = cursor.fetchall()
        return jsonify(tournaments), 200
    except Exception as e:
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/tournaments/<int:id>', methods=['GET'])
def get_tournament_by_id(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM tournaments WHERE id = %s", (id,))
        tournament = cursor.fetchone()
        if not tournament:
            return jsonify({'message': 'Tournament not found!'}), 404
        return jsonify(tournament), 200
    except Exception as e:
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/tournaments', methods=['POST'])
@token_required
@admin_required
def create_tournament(current_user):
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    sport_type = data.get('sport_type')
    status = data.get('status', 'upcoming')

    if not name or not start_date or not end_date or not sport_type:
        return jsonify({'message': 'Name, Dates, and Sport type are required!'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO tournaments (name, description, start_date, end_date, sport_type, status) VALUES (%s, %s, %s, %s, %s, %s)",
            (name, description, start_date, end_date, sport_type, status)
        )
        conn.commit()
        return jsonify({'message': 'Tournament created successfully!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/tournaments/<int:id>', methods=['PUT', 'DELETE'])
@token_required
@admin_required
def update_or_delete_tournament(current_user, id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == 'PUT':
            data = request.get_json()
            name = data.get('name')
            description = data.get('description')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            sport_type = data.get('sport_type')
            status = data.get('status')

            if not name or not start_date or not end_date or not sport_type or not status:
                return jsonify({'message': 'All fields are required!'}), 400

            cursor.execute(
                "UPDATE tournaments SET name = %s, description = %s, start_date = %s, end_date = %s, sport_type = %s, status = %s WHERE id = %s",
                (name, description, start_date, end_date, sport_type, status, id)
            )
            conn.commit()
            return jsonify({'message': 'Tournament updated successfully!'}), 200

        elif request.method == 'DELETE':
            cursor.execute("DELETE FROM tournaments WHERE id = %s", (id,))
            conn.commit()
            return jsonify({'message': 'Tournament deleted successfully!'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/tournaments/<int:id>/register', methods=['POST'])
@token_required
def register_team_for_tournament(current_user, id):
    data = request.get_json()
    team_id = data.get('team_id')

    if not team_id:
        return jsonify({'message': 'Team ID is required!'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if tournament exists
        cursor.execute("SELECT * FROM tournaments WHERE id = %s", (id,))
        tournament = cursor.fetchone()
        if not tournament:
            return jsonify({'message': 'Tournament not found!'}), 404

        # Check if team exists
        cursor.execute("SELECT * FROM teams WHERE id = %s", (team_id,))
        team = cursor.fetchone()
        if not team:
            return jsonify({'message': 'Team not found!'}), 404

        # Verify registering user is captain
        if team['captain_id'] != current_user['id'] and current_user['role'] != 'admin':
            return jsonify({'message': 'Only the team captain or admin can register this team!'}), 403

        # Check if already registered
        cursor.execute("SELECT id FROM tournament_registrations WHERE tournament_id = %s AND team_id = %s", (id, team_id))
        if cursor.fetchone():
            return jsonify({'message': 'Team is already registered for this tournament!'}), 400

        # Register team
        cursor.execute(
            "INSERT INTO tournament_registrations (tournament_id, team_id) VALUES (%s, %s)",
            (id, team_id)
        )
        # Create default entry in leaderboard
        cursor.execute(
            "INSERT INTO leaderboard (tournament_id, team_id) VALUES (%s, %s) ON DUPLICATE KEY UPDATE team_id=team_id",
            (id, team_id)
        )
        conn.commit()
        return jsonify({'message': 'Team registered successfully for tournament!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# Get registered teams for a tournament
@app.route('/api/tournaments/<int:id>/teams', methods=['GET'])
def get_tournament_teams(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT t.*, u.username as captain_name FROM teams t "
            "JOIN tournament_registrations r ON t.id = r.team_id "
            "JOIN users u ON t.captain_id = u.id "
            "WHERE r.tournament_id = %s", (id,)
        )
        teams = cursor.fetchall()
        return jsonify(teams), 200
    except Exception as e:
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# --- 3. TEAMS & PLAYERS MODULE ---

@app.route('/api/teams', methods=['GET', 'POST'])
@token_required
def manage_teams(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == 'GET':
            # List all teams
            cursor.execute(
                "SELECT t.*, u.username as captain_name, u.email as captain_email FROM teams t "
                "JOIN users u ON t.captain_id = u.id"
            )
            teams = cursor.fetchall()
            return jsonify(teams), 200

        elif request.method == 'POST':
            # Create team
            data = request.get_json()
            name = data.get('name')
            captain_id = data.get('captain_id', current_user['id']) # defaults to current user

            if not name:
                return jsonify({'message': 'Team name is required!'}), 400

            # Check if name unique
            cursor.execute("SELECT id FROM teams WHERE name = %s", (name,))
            if cursor.fetchone():
                return jsonify({'message': 'Team name already exists!'}), 400

            cursor.execute("INSERT INTO teams (name, captain_id) VALUES (%s, %s)", (name, captain_id))
            conn.commit()
            return jsonify({'message': 'Team created successfully!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/teams/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def team_detail(current_user, id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM teams WHERE id = %s", (id,))
        team = cursor.fetchone()
        if not team:
            return jsonify({'message': 'Team not found!'}), 404

        if request.method == 'GET':
            return jsonify(team), 200

        # Edit/Delete only allowed by Captain or Admin
        if team['captain_id'] != current_user['id'] and current_user['role'] != 'admin':
            return jsonify({'message': 'Unauthorized action on team!'}), 403

        if request.method == 'PUT':
            data = request.get_json()
            name = data.get('name')
            captain_id = data.get('captain_id', team['captain_id'])
            
            if not name:
                return jsonify({'message': 'Team name is required!'}), 400

            # Check unique if changed
            cursor.execute("SELECT id FROM teams WHERE name = %s AND id != %s", (name, id))
            if cursor.fetchone():
                return jsonify({'message': 'Team name already exists!'}), 400

            cursor.execute("UPDATE teams SET name = %s, captain_id = %s WHERE id = %s", (name, captain_id, id))
            conn.commit()
            return jsonify({'message': 'Team details updated!'}), 200

        elif request.method == 'DELETE':
            cursor.execute("DELETE FROM teams WHERE id = %s", (id,))
            conn.commit()
            return jsonify({'message': 'Team deleted successfully!'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# Players Sub-routes
@app.route('/api/teams/<int:team_id>/players', methods=['GET', 'POST'])
@token_required
def manage_players(current_user, team_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM teams WHERE id = %s", (team_id,))
        team = cursor.fetchone()
        if not team:
            return jsonify({'message': 'Team not found!'}), 404

        if request.method == 'GET':
            cursor.execute("SELECT * FROM players WHERE team_id = %s", (team_id,))
            players = cursor.fetchall()
            return jsonify(players), 200

        elif request.method == 'POST':
            # Create player (only captain or admin)
            if team['captain_id'] != current_user['id'] and current_user['role'] != 'admin':
                return jsonify({'message': 'Only captain or admin can add players!'}), 403

            data = request.get_json()
            name = data.get('name')
            position = data.get('position', '')
            age = data.get('age')

            if not name or not age:
                return jsonify({'message': 'Player name and age are required!'}), 400

            cursor.execute(
                "INSERT INTO players (team_id, name, position, age) VALUES (%s, %s, %s, %s)",
                (team_id, name, position, age)
            )
            conn.commit()
            return jsonify({'message': 'Player added successfully!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/players/<int:id>', methods=['PUT', 'DELETE'])
@token_required
def player_details(current_user, id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT p.*, t.captain_id FROM players p JOIN teams t ON p.team_id = t.id WHERE p.id = %s", (id,)
        )
        player = cursor.fetchone()
        if not player:
            return jsonify({'message': 'Player not found!'}), 404

        if player['captain_id'] != current_user['id'] and current_user['role'] != 'admin':
            return jsonify({'message': 'Unauthorized action!'}), 403

        if request.method == 'PUT':
            data = request.get_json()
            name = data.get('name')
            position = data.get('position')
            age = data.get('age')

            if not name or not age:
                return jsonify({'message': 'Player name and age are required!'}), 400

            cursor.execute(
                "UPDATE players SET name = %s, position = %s, age = %s WHERE id = %s",
                (name, position, age, id)
            )
            conn.commit()
            return jsonify({'message': 'Player updated!'}), 200

        elif request.method == 'DELETE':
            cursor.execute("DELETE FROM players WHERE id = %s", (id,))
            conn.commit()
            return jsonify({'message': 'Player removed!'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# --- 4. MATCH SCHEDULING & RESULTS MODULE ---

@app.route('/api/matches', methods=['GET', 'POST'])
def manage_matches():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == 'GET':
            tournament_id = request.args.get('tournament_id')
            status = request.args.get('status')
            
            query = (
                "SELECT m.*, t1.name as team1_name, t2.name as team2_name, tour.name as tournament_name "
                "FROM matches m "
                "JOIN teams t1 ON m.team1_id = t1.id "
                "JOIN teams t2 ON m.team2_id = t2.id "
                "JOIN tournaments tour ON m.tournament_id = tour.id "
                "WHERE 1=1"
            )
            params = []
            if tournament_id:
                query += " AND m.tournament_id = %s"
                params.append(tournament_id)
            if status:
                query += " AND m.status = %s"
                params.append(status)

            query += " ORDER BY m.match_date ASC"
            cursor.execute(query, tuple(params))
            matches = cursor.fetchall()
            return jsonify(matches), 200

        elif request.method == 'POST':
            # Create a match (Admin only)
            # Fetch authorization token to check details manually
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'message': 'Authorization header missing!'}), 401
            
            token = auth_header.split(" ")[1]
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            if data['role'] != 'admin':
                return jsonify({'message': 'Admin privilege required!'}), 403

            body = request.get_json()
            tournament_id = body.get('tournament_id')
            team1_id = body.get('team1_id')
            team2_id = body.get('team2_id')
            match_date = body.get('match_date')

            if not tournament_id or not team1_id or not team2_id or not match_date:
                return jsonify({'message': 'All scheduling details are required!'}), 400

            if team1_id == team2_id:
                return jsonify({'message': 'Teams cannot play against themselves!'}), 400

            cursor.execute(
                "INSERT INTO matches (tournament_id, team1_id, team2_id, match_date, status) VALUES (%s, %s, %s, %s, 'scheduled')",
                (tournament_id, team1_id, team2_id, match_date)
            )
            conn.commit()
            return jsonify({'message': 'Match scheduled successfully!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# Update Match Scores and Update Leaderboard
@app.route('/api/matches/<int:id>/score', methods=['PUT'])
@token_required
@admin_required
def update_match_score(current_user, id):
    data = request.get_json()
    score1 = data.get('score1')
    score2 = data.get('score2')
    status = data.get('status') # 'live' or 'completed'
    winner_id = data.get('winner_id') # Nullable

    if score1 is None or score2 is None or not status:
        return jsonify({'message': 'Scores and status are required!'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Fetch current match details
        cursor.execute("SELECT * FROM matches WHERE id = %s", (id,))
        match = cursor.fetchone()
        if not match:
            return jsonify({'message': 'Match not found!'}), 404

        was_completed = (match['status'] == 'completed')

        # Automatically determine winner_id if status is completed and winner_id not explicitly set
        if status == 'completed' and winner_id is None:
            if int(score1) > int(score2):
                winner_id = match['team1_id']
            elif int(score2) > int(score1):
                winner_id = match['team2_id']
            else:
                winner_id = None # Draw

        # Update Match Details
        cursor.execute(
            "UPDATE matches SET score1 = %s, score2 = %s, status = %s, winner_id = %s WHERE id = %s",
            (score1, score2, status, winner_id, id)
        )

        # Update Leaderboard only if transition to completed is new or score updated
        # To keep it simple and correct, we recalculate leaderboard points for this tournament
        if status == 'completed':
            recalculate_leaderboard(cursor, match['tournament_id'])

        conn.commit()
        return jsonify({'message': 'Match score updated successfully!'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

def recalculate_leaderboard(cursor, tournament_id):
    # Reset leaderboard stats for this tournament
    cursor.execute("UPDATE leaderboard SET matches_played = 0, matches_won = 0, matches_lost = 0, points = 0 WHERE tournament_id = %s", (tournament_id,))

    # Select all completed matches for this tournament
    cursor.execute("SELECT * FROM matches WHERE tournament_id = %s AND status = 'completed'", (tournament_id,))
    completed_matches = cursor.fetchall()

    for m in completed_matches:
        t1, t2 = m['team1_id'], m['team2_id']
        s1, s2 = int(m['score1']), int(m['score2'])

        # Ensure teams have a row in leaderboard
        for t_id in [t1, t2]:
            cursor.execute(
                "INSERT INTO leaderboard (tournament_id, team_id, matches_played, matches_won, matches_lost, points) "
                "VALUES (%s, %s, 0, 0, 0, 0) "
                "ON DUPLICATE KEY UPDATE team_id=team_id", (tournament_id, t_id)
            )

        if s1 > s2:
            # Team 1 wins
            cursor.execute("UPDATE leaderboard SET matches_played = matches_played + 1, matches_won = matches_won + 1, points = points + 3 WHERE tournament_id = %s AND team_id = %s", (tournament_id, t1))
            cursor.execute("UPDATE leaderboard SET matches_played = matches_played + 1, matches_lost = matches_lost + 1 WHERE tournament_id = %s AND team_id = %s", (tournament_id, t2))
        elif s2 > s1:
            # Team 2 wins
            cursor.execute("UPDATE leaderboard SET matches_played = matches_played + 1, matches_won = matches_won + 1, points = points + 3 WHERE tournament_id = %s AND team_id = %s", (tournament_id, t2))
            cursor.execute("UPDATE leaderboard SET matches_played = matches_played + 1, matches_lost = matches_lost + 1 WHERE tournament_id = %s AND team_id = %s", (tournament_id, t1))
        else:
            # Draw
            cursor.execute("UPDATE leaderboard SET matches_played = matches_played + 1, points = points + 1 WHERE tournament_id = %s AND team_id = %s", (tournament_id, t1))
            cursor.execute("UPDATE leaderboard SET matches_played = matches_played + 1, points = points + 1 WHERE tournament_id = %s AND team_id = %s", (tournament_id, t2))

# --- 5. STADIUM BOOKINGS MODULE ---

@app.route('/api/bookings', methods=['GET', 'POST'])
@token_required
def manage_bookings(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == 'GET':
            if current_user['role'] == 'admin':
                # Admin sees all bookings
                cursor.execute(
                    "SELECT b.*, u.username as user_name, u.email as user_email "
                    "FROM bookings b JOIN users u ON b.user_id = u.id ORDER BY b.booking_date DESC"
                )
            else:
                # User sees their own bookings
                cursor.execute(
                    "SELECT b.*, u.username as user_name FROM bookings b "
                    "JOIN users u ON b.user_id = u.id "
                    "WHERE b.user_id = %s ORDER BY b.booking_date DESC", (current_user['id'],)
                )
            bookings = cursor.fetchall()
            return jsonify(bookings), 200

        elif request.method == 'POST':
            data = request.get_json()
            booking_date = data.get('booking_date')
            time_slot = data.get('time_slot')
            purpose = data.get('purpose')

            if not booking_date or not time_slot or not purpose:
                return jsonify({'message': 'Date, time slot, and purpose are required!'}), 400

            # Double booking check (Approved bookings)
            cursor.execute(
                "SELECT id FROM bookings WHERE booking_date = %s AND time_slot = %s AND status = 'approved'",
                (booking_date, time_slot)
            )
            if cursor.fetchone():
                return jsonify({'message': 'This time slot is already booked and approved!'}), 400

            cursor.execute(
                "INSERT INTO bookings (user_id, booking_date, time_slot, purpose, status) VALUES (%s, %s, %s, %s, 'pending')",
                (current_user['id'], booking_date, time_slot, purpose)
            )
            conn.commit()
            return jsonify({'message': 'Booking request submitted. Awaiting admin approval!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# Approve/Reject Bookings
@app.route('/api/bookings/<int:id>', methods=['PUT'])
@token_required
@admin_required
def update_booking_status(current_user, id):
    data = request.get_json()
    status = data.get('status') # 'approved' or 'rejected'

    if status not in ['approved', 'rejected']:
        return jsonify({'message': 'Invalid status update! Use approved or rejected.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if booking exists
        cursor.execute("SELECT * FROM bookings WHERE id = %s", (id,))
        booking = cursor.fetchone()
        if not booking:
            return jsonify({'message': 'Booking not found!'}), 404

        # If approving, reject other pending bookings for the same date and slot
        if status == 'approved':
            cursor.execute(
                "UPDATE bookings SET status = 'rejected' "
                "WHERE booking_date = %s AND time_slot = %s AND id != %s AND status = 'pending'",
                (booking['booking_date'], booking['time_slot'], id)
            )

        cursor.execute("UPDATE bookings SET status = %s WHERE id = %s", (status, id))
        conn.commit()
        return jsonify({'message': f'Booking has been {status} successfully!'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# Check Slot Availability
@app.route('/api/bookings/availability', methods=['GET'])
def get_availability():
    booking_date = request.args.get('date')
    if not booking_date:
        return jsonify({'message': 'Date parameter is required!'}), 400

    slots = [
        "08:00 - 10:00",
        "10:00 - 12:00",
        "12:00 - 14:00",
        "14:00 - 16:00",
        "16:00 - 18:00",
        "18:00 - 20:00"
    ]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT time_slot, status FROM bookings WHERE booking_date = %s", (booking_date,))
        records = cursor.fetchall()
        
        status_map = {r['time_slot']: r['status'] for r in records}
        availability = []

        for slot in slots:
            status = status_map.get(slot, 'available')
            availability.append({
                'time_slot': slot,
                'status': status
            })

        return jsonify(availability), 200
    except Exception as e:
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# --- 6. LEADERBOARD MODULE ---

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    tournament_id = request.args.get('tournament_id')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = (
            "SELECT l.*, t.name as team_name, tour.name as tournament_name "
            "FROM leaderboard l "
            "JOIN teams t ON l.team_id = t.id "
            "JOIN tournaments tour ON l.tournament_id = tour.id "
        )
        params = []
        if tournament_id:
            query += " WHERE l.tournament_id = %s"
            params.append(tournament_id)
        
        query += " ORDER BY tour.id ASC, l.points DESC, l.matches_won DESC"
        cursor.execute(query, tuple(params))
        rankings = cursor.fetchall()
        return jsonify(rankings), 200
    except Exception as e:
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# --- 7. ANNOUNCEMENTS MODULE ---

@app.route('/api/announcements', methods=['GET', 'POST'])
@token_required
def manage_announcements(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == 'GET':
            cursor.execute("SELECT * FROM announcements ORDER BY created_at DESC")
            announcements = cursor.fetchall()
            return jsonify(announcements), 200

        elif request.method == 'POST':
            if current_user['role'] != 'admin':
                return jsonify({'message': 'Admin privilege required!'}), 403

            data = request.get_json()
            title = data.get('title')
            content = data.get('content')

            if not title or not content:
                return jsonify({'message': 'Title and content are required!'}), 400

            cursor.execute("INSERT INTO announcements (title, content) VALUES (%s, %s)", (title, content))
            conn.commit()
            return jsonify({'message': 'Announcement created!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/announcements/<int:id>', methods=['DELETE'])
@token_required
@admin_required
def delete_announcement(current_user, id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("DELETE FROM announcements WHERE id = %s", (id,))
        conn.commit()
        return jsonify({'message': 'Announcement deleted successfully!'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# --- 8. FEEDBACK MODULE ---

@app.route('/api/feedback', methods=['GET', 'POST'])
@token_required
def manage_feedback(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == 'GET':
            if current_user['role'] != 'admin':
                return jsonify({'message': 'Admin privilege required!'}), 403
            cursor.execute(
                "SELECT f.*, u.username as user_name, u.email as user_email "
                "FROM feedback f JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC"
            )
            feedback_list = cursor.fetchall()
            return jsonify(feedback_list), 200

        elif request.method == 'POST':
            data = request.get_json()
            message = data.get('message')

            if not message:
                return jsonify({'message': 'Feedback message cannot be empty!'}), 400

            cursor.execute("INSERT INTO feedback (user_id, message) VALUES (%s, %s)", (current_user['id'], message))
            conn.commit()
            return jsonify({'message': 'Feedback submitted successfully. Thank you!'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# --- 9. ADMIN METRICS, REPORTS & CHARTS ---

@app.route('/api/reports/dashboard-stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if current_user['role'] == 'admin':
            # 1. Total users
            cursor.execute("SELECT COUNT(*) as count FROM users")
            total_users = cursor.fetchone()['count']

            # 2. Total tournaments
            cursor.execute("SELECT COUNT(*) as count FROM tournaments")
            total_tournaments = cursor.fetchone()['count']

            # 3. Total teams
            cursor.execute("SELECT COUNT(*) as count FROM teams")
            total_teams = cursor.fetchone()['count']

            # 4. Total bookings
            cursor.execute("SELECT COUNT(*) as count FROM bookings")
            total_bookings = cursor.fetchone()['count']

            # 5. Pending bookings
            cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'")
            pending_bookings = cursor.fetchone()['count']

            # 6. Booking stats by status (for visual chart)
            cursor.execute("SELECT status, COUNT(*) as count FROM bookings GROUP BY status")
            booking_status_counts = cursor.fetchall()

            # 7. Registrations per tournament (for visual chart)
            cursor.execute(
                "SELECT t.name as tournament_name, COUNT(tr.id) as count "
                "FROM tournaments t LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id "
                "GROUP BY t.id"
            )
            tournament_registrations_counts = cursor.fetchall()

            return jsonify({
                'total_users': total_users,
                'total_tournaments': total_tournaments,
                'total_teams': total_teams,
                'total_bookings': total_bookings,
                'pending_bookings': pending_bookings,
                'charts': {
                    'booking_status': booking_status_counts,
                    'registrations_by_tournament': tournament_registrations_counts
                }
            }), 200
        else:
            # User dashboard stats
            cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE user_id = %s", (current_user['id'],))
            user_bookings = cursor.fetchone()['count']

            cursor.execute(
                "SELECT COUNT(*) as count FROM tournament_registrations tr "
                "JOIN teams t ON tr.team_id = t.id "
                "WHERE t.captain_id = %s", (current_user['id'],)
            )
            user_registered_tournaments = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM announcements")
            total_announcements = cursor.fetchone()['count']

            return jsonify({
                'user_bookings': user_bookings,
                'user_registered_tournaments': user_registered_tournaments,
                'total_announcements': total_announcements
            }), 200

    except Exception as e:
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# Admin endpoint to list all users (Manage Users module)
@app.route('/api/admin/users', methods=['GET', 'PUT', 'DELETE'])
@token_required
@admin_required
def manage_users_admin(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == 'GET':
            cursor.execute("SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC")
            users = cursor.fetchall()
            return jsonify(users), 200

        elif request.method == 'PUT':
            data = request.get_json()
            user_id = data.get('id')
            role = data.get('role')

            if not user_id or role not in ['user', 'admin']:
                return jsonify({'message': 'Invalid data!'}), 400

            cursor.execute("UPDATE users SET role = %s WHERE id = %s", (role, user_id))
            conn.commit()
            return jsonify({'message': 'User role updated successfully!'}), 200

        elif request.method == 'DELETE':
            user_id = request.args.get('id')
            if not user_id:
                return jsonify({'message': 'User ID is required!'}), 400

            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            return jsonify({'message': 'User deleted successfully!'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    # Run backend on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
