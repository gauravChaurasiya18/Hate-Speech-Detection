# Explainable Multilingual Hate Speech Detection Platform

A production-style full-stack AI SaaS dashboard for detecting hate speech, toxicity, offensive language, threats, and cyberbullying across English, Hindi, and Hinglish text.

## Stack

- Frontend: React 19, Vite 8, Tailwind CSS 4, Framer Motion, Recharts, Axios, React Router DOM, React Icons, Lucide React
- Backend: Node.js, Express 5, MongoDB, Mongoose, JWT, HTTP-only cookies, Helmet, CORS, rate limiting
- ML Service: Flask, Hugging Face Transformers, DistilBERT toxicity model, PyTorch, SHAP-compatible explanations

## Project Structure

```text
backend/       Express API, auth, Mongo models, analysis/history/dashboard routes
frontend/      React app with AI SaaS dashboard UI
ml-service/    Flask model API with preprocessing, inference, explainability, rewrite
```

## Setup

1. Copy `.env.example` to `.env` and update secrets.
2. Install dependencies:

```bash
npm run install:all
```

For a fresh Python setup on Windows:

```bash
py -3.11 -m venv ml-service/.venv
.\ml-service\.venv\Scripts\Activate.ps1
python -m pip install -r ml-service/requirements.txt
```

Use Python 3.11 for the ML service. Python 3.12+ may install incompatible
newer ML packages instead of the pinned stack.

3. Start MongoDB locally or set `MONGODB_URI` to your MongoDB Atlas connection string.
4. Run all services:

```bash
npm run dev
```

This single command starts all three development services:

- React/Vite frontend on `http://localhost:5173`
- Express/Socket.io backend on `http://localhost:5000`
- Flask ML service on `http://localhost:8000`

Run it from either the repository folder or the nested `Hate-Speech-Detection` folder. MongoDB still needs to be running separately, or the backend will stop while trying to connect to `MONGODB_URI`.

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- ML API: `http://localhost:8000`

The first ML request downloads the Hugging Face model, so it can take a moment on a fresh machine.

## Quality Checks

Run the full local check suite:

```bash
npm run check
```

This runs backend unit tests, frontend utility tests, ML text-processing tests,
and the production frontend build.

## API

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/analyze`
- `GET /api/history`
- `DELETE /api/history/:id`
- `GET /api/dashboard/stats`

## Notes

- Authentication uses JWTs stored in HTTP-only cookies.
- CSV/TXT bulk upload is supported on `POST /api/analyze` with multipart field `file`.
- SHAP-style token contribution data is returned by the ML service. When full SHAP is too expensive for the current runtime, the service blends model confidence with deterministic lexical token attribution rather than returning fake empty explanations.
