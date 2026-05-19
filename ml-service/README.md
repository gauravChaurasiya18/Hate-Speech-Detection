# ML Service

Flask API for hate speech detection, toxicity scoring, language detection, safer rewrites, and token-level explanations.

## Requirements

- Python 3.11
- Internet access for the first model download from Hugging Face

## Setup

From the project root:

```powershell
cd ml-service
python -m pip install -r requirements.txt
```

Optional, but recommended, use a virtual environment:

```powershell
cd ml-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Avoid Python 3.12+ for this service. The pinned PyTorch, Transformers, NumPy,
Pandas, scikit-learn, and SHAP versions are intended for Python 3.11.

## Run

```powershell
cd ml-service
python app.py
```

The service starts on:

```text
http://localhost:8000
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Expected response:

```json
{
  "success": true,
  "service": "ml-service",
  "model": "martin-ha/toxic-comment-model"
}
```

## Test Prediction

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8000/predict `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"text":"This is a test message"}'
```

The first prediction can take longer because the Hugging Face model is loaded and may be downloaded.

## Environment Variables

Create a `.env` file in `ml-service` or in the project root if you want to override defaults:

```env
ML_PORT=8000
HF_MODEL_ID=martin-ha/toxic-comment-model
HF_MULTILINGUAL_MODEL_ID=unitary/multilingual-toxic-xlm-roberta
ENABLE_SHAP=true
MAX_SHAP_TOKENS=80
```

Useful options:

- `ML_PORT`: Port used by Flask.
- `HF_MODEL_ID`: Main Hugging Face toxicity model.
- `ENABLE_SHAP`: Set to `false` for faster lexical explanations.
- `MAX_SHAP_TOKENS`: Maximum number of tokens considered for explanations.

## API Endpoints

- `GET /health`: Check service status.
- `POST /predict`: Analyze one text input.
- `POST /batch`: Analyze up to 200 texts.

Batch example:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8000/batch `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"texts":["hello","sample text"]}'
```

## Stop The Service

If the service is running in the current terminal, press `Ctrl+C`.

If it is running in the background, find and stop the Python process:

```powershell
Get-Process python
Stop-Process -Id <PID>
```

## Troubleshooting

- If port `8000` is already in use, set another port with `ML_PORT`, for example:

```powershell
$env:ML_PORT = "8001"
python app.py
```

- If startup works but prediction is slow, wait for the model load to finish.
- If startup fails while importing `transformers`, `sklearn`, or `pandas`,
  check `python --version`. Recreate the virtual environment with Python 3.11,
  then run `python -m pip install -r requirements.txt` again.
- If model download fails, check your internet connection and Hugging Face access.
- If SHAP explanations are too slow, set `ENABLE_SHAP=false`.
