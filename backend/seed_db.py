import mysql.connector
import bcrypt
import datetime

def seed():
    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3306,
        user='root',
        password='',
        database='stadium_db'
    )
    cursor = conn.cursor(dictionary=True)
    try:
        print("Clearing existing data...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("TRUNCATE TABLE feedback;")
        cursor.execute("TRUNCATE TABLE announcements;")
        cursor.execute("TRUNCATE TABLE bookings;")
        cursor.execute("TRUNCATE TABLE leaderboard;")
        cursor.execute("TRUNCATE TABLE matches;")
        cursor.execute("TRUNCATE TABLE tournament_registrations;")
        cursor.execute("TRUNCATE TABLE players;")
        cursor.execute("TRUNCATE TABLE teams;")
        cursor.execute("TRUNCATE TABLE tournaments;")
        cursor.execute("TRUNCATE TABLE users;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        
        print("Creating password hashes...")
        admin_pass = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode('utf-8')
        user_pass = bcrypt.hashpw(b"user123", bcrypt.gensalt()).decode('utf-8')

        print("Seeding users...")
        users = [
            ("admin", "admin@smartstadium.com", admin_pass, "admin"),
            ("captain_ron", "ron@stadium.com", user_pass, "user"),
            ("captain_messi", "messi@stadium.com", user_pass, "user"),
            ("captain_virat", "virat@stadium.com", user_pass, "user"),
            ("general_user", "user@stadium.com", user_pass, "user")
        ]
        
        user_ids = {}
        for username, email, pwd, role in users:
            cursor.execute(
                "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                (username, email, pwd, role)
            )
            user_ids[username] = cursor.lastrowid
            
        print("Seeding tournaments...")
        tournaments = [
            ("Summer Soccer Tournament", "Unleash the speed on our upgraded grass turf.", "2026-07-01", "2026-07-31", "Soccer", "ongoing"),
            ("Championship Cricket League", "The ultimate tournament for leather-ball cricket lovers.", "2026-08-01", "2026-08-15", "Cricket", "upcoming"),
            ("Pro Basketball Cup", "Indoor wooden court championship with top-seeded teams.", "2026-06-01", "2026-06-15", "Basketball", "completed")
        ]
        
        tour_ids = {}
        for name, desc, start, end, sport, status in tournaments:
            cursor.execute(
                "INSERT INTO tournaments (name, description, start_date, end_date, sport_type, status) VALUES (%s, %s, %s, %s, %s, %s)",
                (name, desc, start, end, sport, status)
            )
            tour_ids[name] = cursor.lastrowid

        print("Seeding teams...")
        teams = [
            ("Team Alpha", user_ids["captain_ron"]),
            ("Team Beta", user_ids["captain_messi"]),
            ("Team Gamma", user_ids["captain_virat"])
        ]
        
        team_ids = {}
        for name, captain_id in teams:
            cursor.execute(
                "INSERT INTO teams (name, captain_id) VALUES (%s, %s)",
                (name, captain_id)
            )
            team_ids[name] = cursor.lastrowid

        print("Seeding players...")
        players = [
            # Team Alpha (Captain Ron)
            (team_ids["Team Alpha"], "Ron Ronaldo", "Forward", 25),
            (team_ids["Team Alpha"], "Bob Builder", "Defender", 24),
            (team_ids["Team Alpha"], "Alice Wonderland", "Midfielder", 23),
            # Team Beta (Captain Messi)
            (team_ids["Team Beta"], "Lionel Messi", "Forward", 32),
            (team_ids["Team Beta"], "Luis Suarez", "Forward", 33),
            (team_ids["Team Beta"], "Neymar Junior", "Winger", 28),
            # Team Gamma (Captain Virat)
            (team_ids["Team Gamma"], "Virat Kohli", "Batsman", 30),
            (team_ids["Team Gamma"], "Rohit Sharma", "Batsman", 31),
            (team_ids["Team Gamma"], "K L Rahul", "Wicketkeeper", 28)
        ]
        
        for team_id, name, pos, age in players:
            cursor.execute(
                "INSERT INTO players (team_id, name, position, age) VALUES (%s, %s, %s, %s)",
                (team_id, name, pos, age)
            )

        print("Seeding tournament registrations...")
        registrations = [
            (tour_ids["Summer Soccer Tournament"], team_ids["Team Alpha"]),
            (tour_ids["Summer Soccer Tournament"], team_ids["Team Beta"]),
            (tour_ids["Championship Cricket League"], team_ids["Team Alpha"]),
            (tour_ids["Championship Cricket League"], team_ids["Team Gamma"]),
            (tour_ids["Pro Basketball Cup"], team_ids["Team Gamma"]),
            # Register team Alpha to Pro Basketball too for match seeding
            (tour_ids["Pro Basketball Cup"], team_ids["Team Alpha"])
        ]
        
        for tour_id, team_id in registrations:
            cursor.execute(
                "INSERT INTO tournament_registrations (tournament_id, team_id) VALUES (%s, %s)",
                (tour_id, team_id)
            )
            cursor.execute(
                "INSERT INTO leaderboard (tournament_id, team_id) VALUES (%s, %s)",
                (tour_id, team_id)
            )

        print("Seeding matches...")
        # Match 1: Summer Soccer - Team Alpha vs Team Beta (Completed, 3-2)
        cursor.execute(
            "INSERT INTO matches (tournament_id, team1_id, team2_id, match_date, score1, score2, winner_id, status) VALUES "
            "(%s, %s, %s, '2026-07-10 18:00:00', 3, 2, %s, 'completed')",
            (tour_ids["Summer Soccer Tournament"], team_ids["Team Alpha"], team_ids["Team Beta"], team_ids["Team Alpha"])
        )
        # Match 2: Summer Soccer - Team Beta vs Team Alpha (Scheduled)
        cursor.execute(
            "INSERT INTO matches (tournament_id, team1_id, team2_id, match_date, status) VALUES "
            "(%s, %s, %s, '2026-07-25 19:30:00', 'scheduled')",
            (tour_ids["Summer Soccer Tournament"], team_ids["Team Beta"], team_ids["Team Alpha"])
        )
        # Match 3: Pro Basketball - Team Gamma vs Team Alpha (Completed, 95-102)
        cursor.execute(
            "INSERT INTO matches (tournament_id, team1_id, team2_id, match_date, score1, score2, winner_id, status) VALUES "
            "(%s, %s, %s, '2026-06-10 14:00:00', 95, 102, %s, 'completed')",
            (tour_ids["Pro Basketball Cup"], team_ids["Team Gamma"], team_ids["Team Alpha"], team_ids["Team Alpha"])
        )

        print("Calculating leaderboard standings...")
        # Summer Soccer
        cursor.execute("UPDATE leaderboard SET matches_played=1, matches_won=1, points=3 WHERE tournament_id=%s AND team_id=%s", (tour_ids["Summer Soccer Tournament"], team_ids["Team Alpha"]))
        cursor.execute("UPDATE leaderboard SET matches_played=1, matches_lost=1, points=0 WHERE tournament_id=%s AND team_id=%s", (tour_ids["Summer Soccer Tournament"], team_ids["Team Beta"]))
        # Pro Basketball
        cursor.execute("UPDATE leaderboard SET matches_played=1, matches_won=1, points=3 WHERE tournament_id=%s AND team_id=%s", (tour_ids["Pro Basketball Cup"], team_ids["Team Alpha"]))
        cursor.execute("UPDATE leaderboard SET matches_played=1, matches_lost=1, points=0 WHERE tournament_id=%s AND team_id=%s", (tour_ids["Pro Basketball Cup"], team_ids["Team Gamma"]))

        print("Seeding announcements...")
        announcements = [
            ("Stadium Turf Renovation Complete", "We are excited to announce that the main soccer turf has been fully upgraded with international standard grass for maximum speed and traction."),
            ("Upcoming Cricket Registrations", "Teams interested in the Championship Cricket League should complete their registration by July 30th. Captains, please register your teams as soon as possible.")
        ]
        for title, content in announcements:
            cursor.execute(
                "INSERT INTO announcements (title, content) VALUES (%s, %s)",
                (title, content)
            )

        print("Seeding feedback...")
        feedbacks = [
            (user_ids["captain_ron"], "Awesome facilities! The new turf is incredibly smooth. Bookings are easy to make too!"),
            (user_ids["captain_messi"], "The lighting during night matches on the outer grounds could be improved. Main pitch is great.")
        ]
        for uid, msg in feedbacks:
            cursor.execute(
                "INSERT INTO feedback (user_id, message) VALUES (%s, %s)",
                (uid, msg)
            )

        print("Seeding bookings...")
        bookings = [
            (user_ids["captain_ron"], "2026-07-20", "08:00 - 10:00", "Team Soccer Practice", "approved"),
            (user_ids["captain_messi"], "2026-07-20", "10:00 - 12:00", "Friendly Match vs Local Club", "pending"),
            (user_ids["captain_virat"], "2026-07-21", "18:00 - 20:00", "Cricket Nets Practice", "rejected")
        ]
        for uid, date, slot, purpose, status in bookings:
            cursor.execute(
                "INSERT INTO bookings (user_id, booking_date, time_slot, purpose, status) VALUES (%s, %s, %s, %s, %s)",
                (uid, date, slot, purpose, status)
            )

        conn.commit()
        print("Database seeded successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error seeding DB: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    seed()
