# ⚽ Gunners Pulse

> A full-stack football management platform built with Django — designed to give coaches complete control over squad performance, tactics, training, and medical data, while delivering players a personalized experience to track their own progress.

---

## 📌 Overview

Modern football clubs generate enormous amounts of data across performance analytics, injury records, training sessions, tactical planning, and match history — but this information is rarely unified in one place.

**Gunners Pulse** solves this by providing a centralized web platform with two distinct user experiences:

- **Coaches** get a command center: dashboards, player comparison, performance analysis, tactics management, training session publishing, injury tracking, and calendar management.
- **Players** get a personalized portal: their own dashboard, performance history, assigned tactics, training plans, and upcoming events.

---

## ✨ Features

### Coach Side
- 📊 **Dashboard** — Season overview, match schedule, squad stats, and top performers at a glance
- 📈 **Performance Center** — Player stats, tactical breakdowns, and full match history with filtering
- ⚖️ **Player Comparison** — Side-by-side radar and stat comparison with AI-generated insights
- 🎯 **Tactics Board** — Formation management and role assignment per player
- 🏋️ **Training Manager** — Publish training sessions, assign drills, and manage full session history
- 🏥 **Medical Center** — Log injuries, track recovery status, and update player fitness in real time
- 📅 **Calendar** — Full season calendar with match, training, and recovery event management

### Player Side
- 🏠 **Personal Dashboard** — Individualized stats, upcoming fixtures, and coach notes
- 📉 **Performance Page** — Match-by-match breakdown with Chart.js visualizations (goals, assists, rating trend, minutes played)
- 🎮 **Tactics View** — See assigned role and responsibilities within the team's formation
- 🏋️ **Training View** — Access the latest published training session and assigned drills
- 📅 **Player Calendar** — Personal view of the season schedule and events

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | Django (Python) |
| Database | SQLite (`db.sqlite3`) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js |
| Authentication | Django Auth (Groups + User-Player linking) |
| Data Layer | JSON seed files + Django management commands |
| Admin Panel | Django Admin |

---

## 🏗️ Project Structure

```
Gunners-Pulse/
├── Project/                  # Django project settings and root URLs
├── login/                    # Authentication: coach login, player login, redirect logic
├── index/                    # Coach and player dashboards
├── performance/              # Performance stats, match history, player performance page
├── compare/                  # Player comparison engine
├── tactics/                  # Coach tactics board and player tactics view
├── training/                 # Training session management and player training portal
├── medical/                  # Injury logging, recovery tracking, medical center
├── calender/                 # Season calendar for coaches and players
├── templates/                # Django HTML templates (per app)
├── static/
│   ├── css/                  # Stylesheets
│   ├── js/                   # Page-specific JavaScript
│   └── data/                 # JSON seed data files
└── db.sqlite3                # SQLite database
```

---

## 🔐 User Roles

The system separates users using Django Groups and a one-to-one link between `auth.User` and `training.Player`:

| Role | Access |
|---|---|
| **Coach / Superuser** | Full access to all management pages |
| **Player** | Personal portal only (own stats, tactics, training, calendar) |

After login, `get_redirect_url_for_user()` automatically routes each user to the correct home page.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- pip

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/gunners-pulse.git
cd gunners-pulse

# 2. Activate the virtual environment
source .venv/bin/activate        # macOS / Linux
.venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Apply database migrations
python manage.py migrate

# 5. Load seed data (in order)
python manage.py load_in_data
python manage.py load_in_matches
python manage.py load_player_dashboard
python manage.py load_Perf_players_data
python manage.py load_all_stats
python manage.py load_Perf3_tact_data
python manage.py load_Perf4_match_history_data
python manage.py load_player_performance
python manage.py load_players
python manage.py load_all_data
python manage.py load_player_tactics
python manage.py load_training_seed
python manage.py create_player_users
python manage.py load_med_players
python manage.py load_med_injury_meta
python manage.py load_calendar_data
python manage.py load_player_calendar

# 6. Start the development server
python manage.py runserver
```

Open your browser and navigate to `http://127.0.0.1:8000/`

### Default Player Credentials

Player accounts are auto-generated by `create_player_users`. Default password: `12345678`

---

## 📸 Screenshots

### 🔐 Login
![Login](https://github.com/user-attachments/assets/84233962-1985-4646-876d-620bfea12bb5)

---

### 🏠 Coach Dashboard
![Coach Dashboard 1](https://github.com/user-attachments/assets/51aba50f-e515-4ede-b4a3-8edf030cf8e4)
![Coach Dashboard 2](https://github.com/user-attachments/assets/d684e9e0-579c-4ba5-b822-9013f909e71d)

---

### 📈 Coach Performance
![Coach Performance 1](https://github.com/user-attachments/assets/6d06e17d-8eb7-4ea4-baa3-2eeebf2068a9)
![Coach Performance 2](https://github.com/user-attachments/assets/60ca0935-c5b7-449f-a206-b44349593af9)

---

### ⚖️ Coach Compare
![Coach Compare](https://github.com/user-attachments/assets/5928bbd4-2796-4a1c-8e21-4f70fedd3214)

---

### 🎯 Coach Tactics
![Coach Tactics](https://github.com/user-attachments/assets/5d6bc1f6-8503-4401-b3bb-63be20a6a4e1)

---

### 🏋️ Coach Training
![Coach Training 1](https://github.com/user-attachments/assets/2b924faa-c81c-4f6e-8fb9-29cb91d4eb6c)
![Coach Training 2](https://github.com/user-attachments/assets/be7e5f4e-ac19-4b45-a9bf-3b6449c5ea22)
![Coach Training 3](https://github.com/user-attachments/assets/b3bb92b0-1d37-4e3d-969e-3c6b7d947540)

---

### 🏥 Coach Medical
![Coach Medical 1](https://github.com/user-attachments/assets/98421c2f-11ad-4fc7-b439-80521892a939)
![Coach Medical 2](https://github.com/user-attachments/assets/0a694e52-ca8d-4ea5-a4e9-788edcfa9a76)
![Coach Medical 3](https://github.com/user-attachments/assets/f46674d4-c33f-486d-8bb9-acc82cf7643b)

---

### 📅 Coach Calendar
![Coach Calendar](https://github.com/user-attachments/assets/e9dbd784-8957-4df1-b50c-b7087f231e15)

---

### 🏠 Player Dashboard
![Player Dashboard](https://github.com/user-attachments/assets/f12c2bab-0b10-4bb4-8724-c6a57cf64b7f)

---

### 📉 Player Performance
![Player Performance 1](https://github.com/user-attachments/assets/5335e95e-a725-4bad-b452-ecd37111db6a)
![Player Performance 2](https://github.com/user-attachments/assets/58fe9854-7b91-4337-88dc-4ec65d2bb341)

---

### 🎮 Player Tactics
![Player Tactics](https://github.com/user-attachments/assets/30131297-49e5-4495-a8e3-8e706ee6d8b2)

---

### 🏋️ Player Training
![Player Training](https://github.com/user-attachments/assets/e3c7ee27-061e-47e0-a5b3-fac8d4deef43)

---

## 🔄 How Data Flows

```
JSON files (static/data/)
        ↓
Management Commands (load_*)
        ↓
Django Models (SQLite)
        ↓
Django Views (query + serialize)
        ↓
Templates (inject as window.* JSON)
        ↓
JavaScript (render charts, tables, filters)
```

This architecture allowed the project to migrate cleanly from a static frontend prototype into a fully backend-driven Django application.

---

## 🔮 Future Improvements

- **REST API** — Expose data through Django REST Framework to support mobile clients or third-party integrations
- **Real-time notifications** — WebSocket-based alerts for published training sessions and injury updates
- **Unified player model** — Consolidate duplicated player models across apps into a shared `core` app
- **Role-based permissions** — Granular permission control per feature (e.g., assistant coaches, medical staff)
- **Advanced analytics** — Predictive injury risk and form trend models using historical match data
- **Export reports** — PDF/Excel export for performance reports and medical records

---

## 🤝 Contributing

This project was developed as a university graduation project. Feedback, suggestions, and pull requests are welcome.

If you find a bug or have a feature idea, feel free to open an issue or reach out directly.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Built with ❤️ as a graduation project &nbsp;|&nbsp; Gunners Pulse © 2025
</div>
