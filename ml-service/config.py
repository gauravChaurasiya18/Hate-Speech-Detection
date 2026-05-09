import os
from dotenv import load_dotenv

load_dotenv()

ML_PORT = int(os.getenv("ML_PORT", "8000"))
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "martin-ha/toxic-comment-model")
HF_MULTILINGUAL_MODEL_ID = os.getenv("HF_MULTILINGUAL_MODEL_ID", "unitary/multilingual-toxic-xlm-roberta")
ENABLE_SHAP = os.getenv("ENABLE_SHAP", "true").lower() == "true"
MAX_SHAP_TOKENS = int(os.getenv("MAX_SHAP_TOKENS", "80"))

