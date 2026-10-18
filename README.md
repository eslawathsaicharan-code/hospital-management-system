Hospital Management System

A full-stack web application for managing hospital patients, bed allocation, occupancy, and discharge workflows.

Live Demo

- Frontend: https://hospital-management-system-sigma-amber.vercel.app
- Backend: https://hospital-management-system-4-ga3k.onrender.com

Tech Stack

- Frontend: React, Vite
- Backend: Python, FastAPI
- Database: PostgreSQL (Neon)
- Deployment: Vercel and Render

Features

- Patient registration
- Hospital bed availability tracking
- Bed allocation
- Prevention of duplicate active bed allocations
- Patient discharge and bed release
- Handling of bed-capacity overflow
- Persistent data storage with PostgreSQL
- Live dashboard for bed occupancy and availability

Project Structure

fullstack-proj/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
├── hospital-frontend-code/
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md

## Screenshots

### Dashboard
![Hospital Dashboard](hospital-frontend-code/dashboard.png)

Run Locally

1. Clone the repository

git clone https://github.com/eslawathsaicharan-code/hospital-management-system.git
cd hospital-management-system

2. Start the backend

Create and activate a Python virtual environment, install the dependencies, and configure the required environment variables in a local ".env" file.

cd backend
python -m venv venv

On Windows PowerShell:

.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload

Backend API documentation: http://127.0.0.1:8000/docs

3. Start the frontend

Open a second terminal:

cd hospital-frontend-code
npm install
npm run dev

Configure the frontend API URL to point to the local backend, following the project's existing environment-variable setup.

Deployment

- Frontend hosted on Vercel.
- Backend hosted on Render.
- PostgreSQL database hosted on Neon.

Security

Never commit database credentials, API keys, secret keys, or ".env" files. Configure production secrets using the deployment providers' environment-variable settings.

License

No license has been specified yet.
