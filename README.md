# Skilling Outcomes & Impact Measurement System (MERN)

A longitudinal skilling-outcomes tracker: consent-based trainee records, training-to-placement
linkage, automated + assisted follow-ups, self-employment/apprenticeship capture, employer
verification, wage & retention progression, and cohort/course/provider/district/demographic
analytics with skill-gap and non-placement/attrition reason detection.

## Stack

- **MongoDB** (Mongoose ODM)
- **Express** REST API (Node.js)
- **React** (Create React App, React Router, Recharts for charts, Axios for HTTP)
- **node-cron** for the daily automated follow-up job

## Folder structure

```
skilling-outcomes-mern/
├── backend/
│   ├── config/db.js              # Mongo connection
│   ├── models/                   # Trainee, Course, Provider, Employer, Placement,
│   │                              # EmploymentSpell, FollowUp
│   ├── controllers/               # business logic per resource
│   ├── routes/                    # Express routers
│   ├── jobs/
│   │   ├── followupScheduler.js   # creates 30/90/180/365-day follow-up checkpoints
│   │   └── followupCron.js        # daily cron: attempts due follow-ups, escalates after 3 tries
│   ├── middleware/                 # asyncHandler, error handler
│   ├── seed/seedData.js           # demo data generator
│   └── server.js
└── frontend/
    ├── public/index.html
    └── src/
        ├── api/api.js             # all backend calls
        ├── components/            # Sidebar, StatCard, Pill
        ├── pages/                 # Dashboard, Trainees, TraineeDetail, Placements,
        │                          # FollowUps, Analytics
        └── styles/                # global.css, sidebar.css
```

## How the requirements map to the code

| Requirement | Where it lives |
|---|---|
| Consent-based trainee records | `Trainee.consentLedger` (append-only, auditable), consent UI in Trainees/TraineeDetail pages |
| Training ↔ placement ↔ employment linkage | `Placement` and `EmploymentSpell` models reference `Trainee`; `analyticsController` joins them |
| Automated + assisted follow-ups | `FollowUp` model, `followupScheduler.js` (auto-creates checkpoints), `followupCron.js` (daily attempts, escalates to `assisted_call` after 3 tries), FollowUps page UI |
| Self-employment & apprenticeship capture | `Placement.outcomeType` = `self_employment` / `apprenticeship`, with dedicated fields |
| Employer verification | `Employer.verificationStatus`, `PUT /api/employers/:id/verify` |
| Wage & retention progression | `EmploymentSpell` (one row per checkpoint), `/api/analytics/wage-progression`, `/api/analytics/retention-curve` |
| Cohort/course/provider/district/demographic analytics | `/api/analytics/by-course`, `by-district`, `by-provider`, `by-demographic`, Analytics page |
| Skill gaps & non-placement/attrition reasons | `Placement.nonPlacementReason`, `EmploymentSpell.exitReason`, `/api/analytics/skill-gaps`, `non-placement-reasons`, `attrition-reasons` |
| Login / access control | `User` model, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `middleware/auth.js` (`protect`, `authorize`), frontend `AuthContext` + `ProtectedRoute` + `Login` page |

## Setup

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or an Atlas connection string

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env     # edit MONGO_URI / JWT_SECRET if needed
npm run seed              # populates demo trainees, courses, providers, employers, outcomes, and a demo login
npm run dev                # starts API on http://localhost:5000
```

`npm run seed` creates a demo login:

```
email:    admin@skillmission.gov.in
password: password123
```

Every route except `/api/auth/*` and `/api/health` now requires a valid `Authorization: Bearer <token>`
header (see `middleware/auth.js`). To add more users, either call `POST /api/auth/register`
with `{ name, email, password, role }`, or add them to `seed/seedData.js`. Roles are
`admin`, `programme_manager`, `call_center_agent`, `analyst` — use `authorize("admin")` in a
route if you want to restrict a specific action (e.g. employer verification) to a role.

### 3. Frontend

```bash
cd frontend
npm install
npm start                  # starts React app on http://localhost:3000
```

The frontend expects the API at `http://localhost:5000/api` by default. To point elsewhere, create
`frontend/.env` with:

```
REACT_APP_API_URL=http://your-api-host:5000/api
```

## Notes on scope / what's stubbed for a real deployment

- **IVR/SMS/WhatsApp outreach** is stubbed in `followupCron.js` — wire in an actual
  telephony/messaging provider (e.g. an SMS gateway, WhatsApp Business API) where indicated.
- **Employer verification** (`verifyEmployer`) is a manual/admin action here; in production this
  should call EPFO/GSTIN/Udyam lookup APIs before marking `govt_database_verified`.
- **Authentication/authorization** is not included — add JWT-based auth (the `jsonwebtoken` and
  `bcryptjs` packages are already in `package.json`) before exposing this beyond a local demo,
  since trainee data is sensitive personal information.
- **Aadhaar** is only tracked as a boolean (`aadhaarLinked`) — the actual number is never stored,
  in line with data-minimization practice.
