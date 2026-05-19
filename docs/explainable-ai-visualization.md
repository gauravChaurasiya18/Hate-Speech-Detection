# Explainable AI Visualization Contract

The analyzer response now includes a structured `explanation` object for the React visualization layer while preserving the existing `shapExplanation`, `toxicWords`, `categories`, and `saferRewrite` fields.

```json
{
  "success": true,
  "mode": "single",
  "count": 1,
  "result": {
    "text": "you are an idiot",
    "prediction": "offensive",
    "confidence": 0.82,
    "categories": {
      "hate": 0,
      "toxicity": 0.82,
      "offensive": 0.59,
      "threat": 0,
      "cyberbullying": 0
    },
    "toxicWords": ["idiot"],
    "shapExplanation": [
      {
        "token": "idiot",
        "score": 0.78,
        "polarity": "toxic"
      }
    ],
    "explanation": {
      "schemaVersion": "xai-v1",
      "confidence": 82,
      "tokens": [
        {
          "index": 0,
          "word": "you",
          "normalized": "you",
          "score": 0,
          "signedScore": 0,
          "polarity": "neutral",
          "category": "neutral",
          "categoryInfluence": {},
          "confidence": 82,
          "attention": [
            {
              "index": 3,
              "word": "idiot",
              "strength": 0.48
            }
          ]
        },
        {
          "index": 3,
          "word": "idiot",
          "normalized": "idiot",
          "score": 0.91,
          "signedScore": 0.91,
          "polarity": "toxic",
          "category": "toxicity",
          "categoryInfluence": {
            "toxicity": 0.91
          },
          "confidence": 91,
          "attention": [
            {
              "index": 0,
              "word": "you",
              "strength": 0.48
            },
            {
              "index": 2,
              "word": "an",
              "strength": 0.35
            }
          ]
        }
      ],
      "topToxicWords": [
        {
          "word": "idiot",
          "score": 0.91,
          "category": "toxicity",
          "percentage": 91
        }
      ],
      "categorySummary": [
        {
          "category": "toxicity",
          "score": 0.82,
          "percentage": 82,
          "tokenCount": 1
        }
      ]
    },
    "language": {
      "code": "en",
      "name": "English",
      "confidence": 0.98
    },
    "saferRewrite": "Please keep the discussion respectful and focused on the issue."
  }
}
```

Frontend structure:

```text
frontend/src/components/explainability/
  ContributionGraph.jsx
  ExplainabilityDashboard.jsx
  ExplanationScorePanel.jsx
  ToxicityHeatmap.jsx
frontend/src/utils/explainability.js
```
