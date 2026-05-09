import threading
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline
from config import HF_MODEL_ID


class ModelProvider:
    def __init__(self):
        self._lock = threading.Lock()
        self._pipeline = None
        self._tokenizer = None
        self._model = None

    def get(self):
        if self._pipeline is None:
            with self._lock:
                if self._pipeline is None:
                    device = 0 if torch.cuda.is_available() else -1
                    self._tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_ID)
                    self._model = AutoModelForSequenceClassification.from_pretrained(HF_MODEL_ID)
                    self._pipeline = pipeline(
                        "text-classification",
                        model=self._model,
                        tokenizer=self._tokenizer,
                        device=device,
                        top_k=None,
                        truncation=True,
                        max_length=512,
                    )
        return self._pipeline, self._tokenizer, self._model


provider = ModelProvider()

