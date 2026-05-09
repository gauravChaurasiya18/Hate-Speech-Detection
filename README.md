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
2. Install Node dependencies:

```bash
npm install
npm install --workspaces
```

3. Install Python dependencies:

```bash
python -m pip install -r ml-service/requirements.txt
```

4. Start MongoDB locally or set `MONGODB_URI` to your MongoDB Atlas connection string.
5. Run all services:

```bash
npm run dev
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- ML API: `http://localhost:8000`

The first ML request downloads the Hugging Face model, so it can take a moment on a fresh machine.

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

