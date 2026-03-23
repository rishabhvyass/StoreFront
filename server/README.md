# Flask Backend

This project now uses a Flask backend with SQLite persistence and JWT auth.

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy environment values from `.env.example`.
4. Start the backend:

```bash
python app.py
```

The API runs on `http://localhost:5001/api` by default.

## Google Auth

Set `GOOGLE_CLIENT_ID` in the backend and `REACT_APP_GOOGLE_CLIENT_ID` in the frontend to the same Google OAuth client ID. The login and signup pages both use Google Identity Services and send the Google credential to `POST /api/auth/google`.
