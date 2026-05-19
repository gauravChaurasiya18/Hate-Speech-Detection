import os
from dotenv import load_dotenv

load_dotenv()

ML_PORT = int(os.getenv("ML_PORT", "8000"))
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "martin-ha/toxic-comment-model")
HF_MULTILINGUAL_MODEL_ID = os.getenv("HF_MULTILINGUAL_MODEL_ID", "unitary/multilingual-toxic-xlm-roberta")
ENABLE_SHAP = os.getenv("ENABLE_SHAP", "false").lower() == "true"
MAX_SHAP_TOKENS = int(os.getenv("MAX_SHAP_TOKENS", "80"))
MAX_EXPLANATION_TOKENS = int(os.getenv("MAX_EXPLANATION_TOKENS", "120"))
