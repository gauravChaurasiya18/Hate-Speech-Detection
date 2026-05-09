# Explainable Multilingual Hate Speech Detection Platform

## Overview

This project is a full-stack AI moderation platform that detects hate speech, toxicity, offensive language, threats, and cyberbullying in user-provided text. It supports multilingual and Hinglish-style inputs, provides confidence scores, highlights toxic terms, and suggests safer rewrites for harmful statements.

## Main Features

- User authentication with signup, login, logout, and profile support.
- Real-time text analysis for toxicity and hate speech detection.
- Batch analysis through CSV or TXT file upload.
- Explainable results with toxic word highlighting and SHAP-style token explanations.
- Safer rewrite suggestions that reframe harmful statements into respectful language.
- Analysis history for logged-in users.
- Dashboard with moderation statistics, language distribution, category distribution, trends, and frequent toxic terms.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Recharts, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, JWT authentication
- ML Service: Python, Flask, Hugging Face Transformers, PyTorch, SHAP-style explanations

## Project Structure

```text
frontend/      React dashboard and user interface
backend/       Express API, authentication, history, dashboard routes
ml-service/    Flask ML API for prediction, explanation, and rewrite
```

## ML Service Features

The ML service is the intelligence layer of the platform. It runs as a separate Flask API and is responsible for analyzing text, calculating risk scores, generating explanations, detecting language, and producing safer rewritten statements.

The service uses a Hugging Face Transformer model for text classification. By default, it loads the `martin-ha/toxic-comment-model` model and uses PyTorch for inference. The model output is combined with local rule-based scoring so the system can better detect harmful phrasing that a general model may miss, such as group-targeted blame statements.

The ML service returns a structured result containing:

- Final prediction label such as `non_toxic`, `toxic`, `hate_speech`, `offensive`, `threat`, or `cyberbullying`.
- Confidence score for the final prediction.
- Category-wise scores for hate, toxicity, offensive language, threat, and cyberbullying.
- Detected toxic or high-risk words.
- Detected language with language code, name, and confidence.
- SHAP-style explanation showing important tokens and their contribution.
- Safer rewrite that reframes harmful text into more respectful wording.

The explanation system supports two modes. For full analysis, the service can use SHAP-style token attribution to show which words influenced the prediction. For faster live previews, it can skip full SHAP and use lightweight lexical explanations, which makes real-time typing analysis faster.

The safer rewrite module does not require an external API key. It is currently rule-based and works locally. It detects the type of harmful content and rewrites the sentence into a more neutral, respectful version. For example, a group-blaming statement can be reframed into a concern about the issue without attacking a community.

The ML service also includes contextual detection rules. These rules help catch cases where the base model may under-classify a sentence. For example, phrases that combine a group reference with blame terms such as "ruining this country" can be detected as hate-speech-style rhetoric even when the base model gives a low toxicity score.

Important ML service endpoints:

- `GET /health`: Checks whether the ML service is running and returns the active model name.
- `POST /predict`: Analyzes one text input and returns prediction, explanation, language, and safer rewrite.
- `POST /batch`: Analyzes multiple text inputs in one request.

Example ML response fields:

```json
{
  "prediction": "hate_speech",
  "confidence": 0.64,
  "categories": {
    "hate": 0.62,
    "toxicity": 0.64,
    "offensive": 0.4608,
    "threat": 0,
    "cyberbullying": 0
  },
  "toxic_words": ["community", "ruining"],
  "language": {
    "code": "en",
    "name": "English",
    "confidence": 1
  },
  "safer_rewrite": "I am worried about challenges affecting the country and want to discuss solutions respectfully without blaming any community."
}
```

## Service Flow

1. The user enters text or uploads a file in the frontend.
2. The frontend sends the request to the backend API.
3. The backend forwards the text to the Flask ML service.
4. The ML service returns prediction, confidence, category scores, toxic words, explanation data, language detection, and safer rewrite.
5. The backend optionally saves the result in MongoDB.
6. The frontend displays the analysis result and dashboard data.

## Key API Endpoints

- `POST /api/auth/signup`: Create an account.
- `POST /api/auth/login`: Log in.
- `GET /api/auth/me`: Get current user details.
- `POST /api/analyze`: Analyze text or uploaded files.
- `GET /api/history`: Fetch saved analysis history.
- `GET /api/dashboard/stats`: Fetch dashboard statistics.
- `GET /health`: Check ML service health.
- `POST /predict`: Run ML prediction directly through the ML service.

## Running The Project

Install dependencies:

```powershell
npm install
npm install --workspaces
python -m pip install -r ml-service/requirements.txt
```

Run all services:

```powershell
npm.cmd run dev
```

Default service URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- ML Service: `http://localhost:8000`

## Purpose

The goal of this project is to provide an explainable and user-friendly moderation tool that not only classifies harmful content, but also shows why a statement was flagged and helps rewrite it in a safer, more respectful way.
