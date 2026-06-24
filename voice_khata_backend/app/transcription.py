import torch
import librosa
import os
from transformers import WhisperProcessor, WhisperForConditionalGeneration

class WhisperTranscriber:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Hardcoded base model – ye kaam karega
        model_name = "openai/whisper-small"
        self.processor = WhisperProcessor.from_pretrained(model_name)
        self.model = WhisperForConditionalGeneration.from_pretrained(model_name)
        self.model.to(self.device)
        self.model.eval()

    def transcribe(self, audio_path: str) -> str:
        audio, sr = librosa.load(audio_path, sr=16000)
        input_features = self.processor(audio, sampling_rate=sr, return_tensors="pt").input_features.to(self.device)
        with torch.no_grad():
            generated_ids = self.model.generate(input_features, max_length=128)
        return self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

transcriber = WhisperTranscriber()