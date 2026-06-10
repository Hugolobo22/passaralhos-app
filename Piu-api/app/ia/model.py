"""
app/ia/model.py
Definição da BirdCNN e carregamento do modelo treinado.
"""

import torch
import torch.nn as nn
import numpy as np
from sklearn.preprocessing import LabelEncoder


# ──────────────────────────────────────────────
# ARQUITETURA
# ──────────────────────────────────────────────
class ConvBlock(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class BirdCNN(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.features = nn.Sequential(
            ConvBlock(3, 32),   ConvBlock(32, 32),   nn.MaxPool2d(2), nn.Dropout2d(0.1),
            ConvBlock(32, 64),  ConvBlock(64, 64),   nn.MaxPool2d(2), nn.Dropout2d(0.1),
            ConvBlock(64, 128), ConvBlock(128, 128), nn.MaxPool2d(2), nn.Dropout2d(0.2),
            ConvBlock(128, 256),ConvBlock(256, 256), nn.AdaptiveAvgPool2d((4, 4)),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 4 * 4, 512), nn.ReLU(inplace=True), nn.Dropout(0.5),
            nn.Linear(512, 128),          nn.ReLU(inplace=True), nn.Dropout(0.3),
            nn.Linear(128, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(x))


# ──────────────────────────────────────────────
# CARREGAMENTO (singleton em memória)
# ──────────────────────────────────────────────
_cache: dict = {}


def load_model(
    model_path: str = "models/bird_model.pt",
    labels_path: str = "models/labels.npy",
) -> tuple["BirdCNN", LabelEncoder, torch.device]:
    """
    Carrega modelo e labels uma única vez.
    Chamadas subsequentes retornam do cache.
    """
    if _cache:
        return _cache["model"], _cache["le"], _cache["device"]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    classes = np.load(labels_path, allow_pickle=True)
    le = LabelEncoder()
    le.classes_ = classes

    checkpoint = torch.load(model_path, map_location=device)
    model = BirdCNN(num_classes=checkpoint.get("num_classes", len(classes)))
    model.load_state_dict(checkpoint["model_state"])
    model.to(device).eval()

    _cache.update({"model": model, "le": le, "device": device})
    return model, le, device