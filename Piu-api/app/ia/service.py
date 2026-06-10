"""
app/ia/service.py
Lógica de inferência: bytes de áudio → espécie detectada.
"""

import io
import av
import torch
import numpy as np
import torchaudio.transforms as T
from dataclasses import dataclass

from app.ia.model import load_model
from app.core.config import MODEL_PATH, LABELS_PATH


AUDIO_CONFIG = {
    "sample_rate": 22050,
    "duration":    5,
    "n_mels":      128,
    "n_fft":       1024,
    "hop_length":  512,
    "f_min":       50,
    "f_max":       14000,
}


@dataclass
class PredictionResult:
    species:    str
    confidence: float
    top5:       list[dict]


class BirdDetectionService:
    """Singleton — instancie uma vez na startup via lifespan."""

    def __init__(self):
        self.model, self.le, self.device = load_model(
            model_path=MODEL_PATH,
            labels_path=LABELS_PATH,
        )
        self._samples = AUDIO_CONFIG["sample_rate"] * AUDIO_CONFIG["duration"]

    # ── pré-processamento ──────────────────────────────────────
    def _load_waveform(self, audio_bytes: bytes) -> torch.Tensor:
        # PyAV decodifica qualquer formato que o FFmpeg suporte (m4a, wav, mp3, ogg…)
        container = av.open(io.BytesIO(audio_bytes))
        stream = next((s for s in container.streams if s.type == "audio"), None)
        if stream is None:
            raise ValueError("Nenhuma stream de áudio encontrada no arquivo.")

        sr = stream.codec_context.sample_rate
        frames = []
        for frame in container.decode(stream):
            arr = frame.to_ndarray()   # shape: (channels, samples)
            frames.append(arr)
        container.close()

        if not frames:
            raise ValueError("Arquivo de áudio sem dados.")

        audio_np = np.concatenate(frames, axis=1)

        # Normaliza para float32 [-1, 1]
        if audio_np.dtype == np.int16:
            audio_np = audio_np.astype(np.float32) / 32768.0
        elif audio_np.dtype == np.int32:
            audio_np = audio_np.astype(np.float32) / 2147483648.0
        else:
            audio_np = audio_np.astype(np.float32)

        waveform = torch.from_numpy(audio_np)

        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        if sr != AUDIO_CONFIG["sample_rate"]:
            waveform = T.Resample(sr, AUDIO_CONFIG["sample_rate"])(waveform)

        length = waveform.shape[1]
        if length < self._samples:
            waveform = torch.nn.functional.pad(waveform, (0, self._samples - length))
        else:
            start = (length - self._samples) // 2   # corte central
            waveform = waveform[:, start: start + self._samples]

        return waveform

    def _to_melspec(self, waveform: torch.Tensor) -> torch.Tensor:
        mel = T.MelSpectrogram(
            sample_rate=AUDIO_CONFIG["sample_rate"],
            n_fft=AUDIO_CONFIG["n_fft"],
            hop_length=AUDIO_CONFIG["hop_length"],
            n_mels=AUDIO_CONFIG["n_mels"],
            f_min=AUDIO_CONFIG["f_min"],
            f_max=AUDIO_CONFIG["f_max"],
        )(waveform)
        mel_db = T.AmplitudeToDB(top_db=80)(mel)
        mel_db = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-6)
        return mel_db.repeat(3, 1, 1)   # (3, H, W)

    # ── inferência pública ─────────────────────────────────────
    def predict(self, audio_bytes: bytes) -> PredictionResult:
        """Recebe bytes de .wav/.mp3/.flac/.ogg e retorna espécie."""
        waveform = self._load_waveform(audio_bytes)
        spec = self._to_melspec(waveform).unsqueeze(0).to(self.device)

        with torch.no_grad():
            probs = torch.softmax(self.model(spec), dim=1).squeeze().cpu().numpy()

        top5_idx = probs.argsort()[::-1][:5]
        top5 = [
            {
                "species":     self.le.inverse_transform([i])[0],
                "probability": float(round(probs[i], 4)),
            }
            for i in top5_idx
        ]

        return PredictionResult(
            species=top5[0]["species"],
            confidence=top5[0]["probability"],
            top5=top5,
        )

    def list_species(self) -> list[str]:
        return list(self.le.classes_)


# ── instância global (carregada na startup do FastAPI) ────────
bird_service: BirdDetectionService | None = None


def get_bird_service() -> BirdDetectionService:
    """Dependência FastAPI — retorna o serviço já inicializado."""
    if bird_service is None:
        raise RuntimeError("BirdDetectionService não inicializado. Verifique o lifespan.")
    return bird_service