# Project Summary

## Problem Statement

Online platforms, communities, classrooms, gaming chats, and social networks receive large volumes of user-generated messages every day. Some of these messages contain hate speech, offensive language, threats, cyberbullying, or toxic statements that can harm individuals and groups. Manual moderation is slow, inconsistent, and difficult to scale, especially when messages are written in multilingual or code-mixed language such as English, Hindi, Hinglish, Telugu, or Tamil.

Many automated moderation systems only return a final label such as toxic or non-toxic. This creates another problem: users and moderators may not understand why a message was flagged, which words contributed to the decision, how confident the model is, or how the harmful message can be rewritten in a safer way. A moderation tool should therefore not only classify harmful content, but also explain the decision and support better communication.

This project addresses that problem by building an explainable multilingual hate-speech detection and moderation platform. It combines machine learning, rule-based contextual checks, token-level explanations, language detection, safer rewrite suggestions, saved analysis history, dashboards, and real-time chat moderation so users and administrators can detect, understand, track, and respond to harmful content more effectively.

The main goals are:

- Detect hate speech, toxicity, offensive content, threats, and cyberbullying in text.
- Support multilingual and code-mixed inputs used in real online conversations.
- Explain predictions through toxic terms, token scores, category influence, and contribution graphs.
- Help users rewrite harmful text into safer and more respectful language.
- Save analysis history and provide dashboard insights for moderation trends.
- Moderate live chat messages in real time with alerts and admin actions.

This project is a full-stack explainable multilingual hate-speech moderation platform. It lets users analyze text or uploaded CSV/TXT files for hate speech, toxicity, offensive content, threats, and cyberbullying, then shows confidence scores, category scores, toxic terms, token-level explanations, language detection, and safer rewrite suggestions.

The frontend is a React/Vite dashboard with protected pages for the analyzer, saved history, profile, analytics dashboard, and live moderation chat. The analyzer supports real-time preview while typing, saved full analysis, bulk file analysis, toxicity meters, category bars, a token heatmap, SHAP-style contribution graph, and explanation score panels.

The backend is an Express API with JWT authentication in HTTP-only cookies, MongoDB/Mongoose persistence, validation, request sanitization, rate limiting, analysis history, dashboard statistics, and Socket.io chat support. Logged-in users can save analyses, review history, and use real-time moderated chat rooms. Admin users can review moderation queues, toxic history, analytics, delete messages, mute users, and flag users.

The ML service is a Flask API powered by Hugging Face Transformers and PyTorch. It combines model predictions with lexicon and contextual rules for stronger detection of harmful patterns, especially group-targeted blame. It returns normalized prediction labels, category scores, toxic words, visual explanation data, language metadata, and a local rule-based safer rewrite.

The system runs as three services:

- `frontend/`: React UI on Vite.
- `backend/`: Express REST API and Socket.io server.
- `ml-service/`: Flask prediction, explanation, language, and rewrite service.

Typical flow:

1. The user logs in and submits text, a file, or a chat message.
2. The backend validates the request and forwards text to the ML service.
3. The ML service returns prediction, explanation, language, and rewrite data.
4. The backend stores analysis or chat records in MongoDB when needed.
5. The frontend renders moderation results, explanations, history, charts, or live chat updates.

Core technologies include React, Vite, Tailwind CSS, Framer Motion, Recharts, Axios, Socket.io, Node.js, Express, MongoDB, Mongoose, Flask, Hugging Face Transformers, PyTorch, and Python 3.11.
