from flask import Flask, jsonify, request
from flask_cors import CORS
from config import ML_PORT, HF_MODEL_ID
from inference.classifier import classifier

app = Flask(__name__)
CORS(app)


@app.get("/health")
def health():
    return jsonify({"success": True, "service": "ml-service", "model": HF_MODEL_ID})


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    include_explanation = payload.get("explain", True) is not False
    try:
        result = classifier.analyze(text, include_explanation=include_explanation)
        return jsonify(result)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.post("/batch")
def batch():
    payload = request.get_json(silent=True) or {}
    texts = payload.get("texts", [])
    if not isinstance(texts, list) or not texts:
        return jsonify({"error": "texts must be a non-empty list"}), 400

    try:
        results = [classifier.analyze(text) for text in texts[:200]]
        return jsonify({"success": True, "count": len(results), "results": results})
    except Exception as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=ML_PORT, debug=False)
