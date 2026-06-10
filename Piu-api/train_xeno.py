"""
Bird Audio Detection — Xeno-canto dataset
Estrutura esperada:
    wavfiles/
        557838-0.wav
        557838-1.wav
        ...
    bird_songs_metadata.csv   ← colunas: filename, name, genus, species, ...

Uso:
    python train_xeno.py
"""

import os
import random
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from collections import Counter

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchaudio
import torchaudio.transforms as T
import librosa  # fallback para Windows sem FFmpeg

# ─────────────────────────────────────────────
# CONFIGURAÇÃO — ajuste os caminhos aqui
# ─────────────────────────────────────────────
CONFIG = {
    # Caminhos
    "csv_path":    "bird_songs_metadata.csv",
    "wav_dir":     "wavfiles",
    "output_dir":  "output",
    "model_path":  "output/bird_model.pt",
    "labels_path": "output/labels.npy",
  
    # Rótulo a usar: "name" (nome comum) ou "species" (nome científico)
    "label_column": "name",

    # Filtro: mínimo de amostras por espécie (remove espécies com poucos áudios)
    "min_samples_per_class": 10,

    # Áudio
    "sample_rate": 22050,
    "duration":    5,
    "n_mels":      64,
    "n_fft":       2048,
    "hop_length":  512,
    "f_min":       50,
    "f_max":       14000,

    # Treino
    "batch_size":    32,
    "epochs":        50,
    "learning_rate": 1e-3,
    "weight_decay":  1e-4,
    "patience":      10,
    "val_split":     0.15,
    "test_split":    0.15,

    # Augmentação
    "use_augmentation":  True,
    "time_mask_param":   30,
    "freq_mask_param":   15,
}

os.makedirs(CONFIG["output_dir"], exist_ok=True)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"✅ Dispositivo: {DEVICE}")


# ─────────────────────────────────────────────
# LEITURA DO CSV XENO-CANTO
# ─────────────────────────────────────────────
def load_dataset_from_csv(config: dict) -> tuple[list[str], list[str]]:
    """
    Lê o CSV do Xeno-canto e retorna (file_paths, labels).
    Filtra espécies com menos de min_samples_per_class amostras.
    Verifica se o arquivo .wav realmente existe antes de incluir.
    """
    df = pd.read_csv(config["csv_path"])

    print(f"\n📋 CSV carregado: {len(df)} linhas | colunas: {list(df.columns)}")

    label_col = config["label_column"]
    wav_dir   = Path(config["wav_dir"])

    # Conta amostras por espécie
    counts = Counter(df[label_col])
    valid_species = {sp for sp, n in counts.items() if n >= config["min_samples_per_class"]}
    df_filtered = df[df[label_col].isin(valid_species)].reset_index(drop=True)

    removed = len(counts) - len(valid_species)
    if removed:
        print(f"⚠️  {removed} espécies removidas por ter menos de "
              f"{config['min_samples_per_class']} amostras.")

    # Monta caminhos e verifica existência
    files, labels = [], []
    missing = 0

    for _, row in df_filtered.iterrows():
        path = wav_dir / row["filename"]
        if path.exists():
            files.append(str(path))
            labels.append(row[label_col])
        else:
            missing += 1

    if missing:
        print(f"⚠️  {missing} arquivos não encontrados em '{wav_dir}/' (ignorados).")

    print(f"\n✅ Dataset final: {len(files)} áudios | {len(set(labels))} espécies")

    # Resumo por espécie
    print("\n📊 Distribuição (top 15 espécies):")
    for sp, n in sorted(Counter(labels).items(), key=lambda x: -x[1])[:15]:
        bar = "█" * (n // max(Counter(labels).values()) * 20 + 1)
        print(f"  {sp:<35} {n:>5}  {bar}")

    return files, labels


# ─────────────────────────────────────────────
# DATASET PYTORCH
# ─────────────────────────────────────────────
class XenoCantoDataset(Dataset):
    def __init__(self, file_paths: list[str], labels: list[int], config: dict, augment: bool = False):
        self.file_paths = file_paths
        self.labels     = labels
        self.config     = config
        self.augment    = augment
        self.samples    = config["sample_rate"] * config["duration"]
        self.time_mask  = T.TimeMasking(time_mask_param=config["time_mask_param"])
        self.freq_mask  = T.FrequencyMasking(freq_mask_param=config["freq_mask_param"])

    def __len__(self) -> int:
        return len(self.file_paths)

    def _load_audio(self, path: str) -> torch.Tensor:
        waveform = None

        # 1) Tenta torchaudio (rápido, requer FFmpeg no Windows)
        try:
            waveform, sr = torchaudio.load(path)
            if waveform.shape[0] > 1:
                waveform = waveform.mean(dim=0, keepdim=True)
            if sr != self.config["sample_rate"]:
                waveform = T.Resample(sr, self.config["sample_rate"])(waveform)
        except Exception:
            pass

        # 2) Fallback: librosa — funciona no Windows sem FFmpeg instalado
        if waveform is None:
            try:
                y, _ = librosa.load(path, sr=self.config["sample_rate"], mono=True)
                waveform = torch.FloatTensor(y).unsqueeze(0)
            except Exception:
                return torch.zeros(1, self.samples)  # arquivo corrompido → silêncio

        # Comprimento fixo
        length = waveform.shape[1]
        if length < self.samples:
            waveform = torch.nn.functional.pad(waveform, (0, self.samples - length))
        else:
            if self.augment:
                start = random.randint(0, length - self.samples)
            else:
                start = (length - self.samples) // 2
            waveform = waveform[:, start : start + self.samples]

        return waveform

    def _to_melspec(self, waveform: torch.Tensor) -> torch.Tensor:
        mel = T.MelSpectrogram(
            sample_rate=self.config["sample_rate"],
            n_fft=self.config["n_fft"],
            hop_length=self.config["hop_length"],
            n_mels=self.config["n_mels"],
            f_min=self.config["f_min"],
            f_max=self.config["f_max"],
        )(waveform)
        mel_db = T.AmplitudeToDB(top_db=80)(mel)
        mel_db = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-6)
        return mel_db.repeat(3, 1, 1)   # (3, H, W) — simula RGB

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        waveform = self._load_audio(self.file_paths[idx])

        # Augmentação de waveform (só no treino)
        if self.augment and self.config["use_augmentation"]:
            if random.random() < 0.3:
                waveform = waveform + torch.randn_like(waveform) * 0.005
            if random.random() < 0.2:
                gain = random.uniform(0.7, 1.3)
                waveform = waveform * gain

        spec = self._to_melspec(waveform)

        # SpecAugment (só no treino)
        if self.augment and self.config["use_augmentation"]:
            spec = self.time_mask(spec)
            spec = self.freq_mask(spec)

        return spec, self.labels[idx]


# ─────────────────────────────────────────────
# MODELO CNN
# ─────────────────────────────────────────────
class ConvBlock(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )
    def forward(self, x):
        return self.block(x)


class BirdCNN(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.features = nn.Sequential(
            ConvBlock(3, 32),  ConvBlock(32, 32),  nn.MaxPool2d(2), nn.Dropout2d(0.1),
            ConvBlock(32, 64), ConvBlock(64, 64),  nn.MaxPool2d(2), nn.Dropout2d(0.1),
            ConvBlock(64, 128),ConvBlock(128,128),  nn.MaxPool2d(2), nn.Dropout2d(0.2),
            ConvBlock(128,256),ConvBlock(256,256),  nn.AdaptiveAvgPool2d((4, 4)),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256*4*4, 512), nn.ReLU(inplace=True), nn.Dropout(0.5),
            nn.Linear(512, 128),     nn.ReLU(inplace=True), nn.Dropout(0.3),
            nn.Linear(128, num_classes),
        )
        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, nonlinearity="relu")
            elif isinstance(m, nn.Linear):
                nn.init.xavier_normal_(m.weight)
                nn.init.zeros_(m.bias)

    def forward(self, x):
        return self.classifier(self.features(x))


# ─────────────────────────────────────────────
# TREINO / AVALIAÇÃO
# ─────────────────────────────────────────────
class EarlyStopping:
    def __init__(self, patience: int = 10):
        self.patience  = patience
        self.counter   = 0
        self.best_loss = None
        self.stop      = False

    def __call__(self, val_loss: float):
        if self.best_loss is None or val_loss < self.best_loss - 1e-3:
            self.best_loss = val_loss
            self.counter   = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.stop = True


def run_epoch(model, loader, criterion, optimizer=None):
    training = optimizer is not None
    model.train() if training else model.eval()
    total_loss, correct, total = 0.0, 0, 0

    ctx = torch.enable_grad() if training else torch.no_grad()
    with ctx:
        for specs, labels in loader:
            specs, labels = specs.to(DEVICE), labels.to(DEVICE)
            if training:
                optimizer.zero_grad()
            out  = model(specs)
            loss = criterion(out, labels)
            if training:
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
            total_loss += loss.item() * specs.size(0)
            correct    += (out.argmax(1) == labels).sum().item()
            total      += specs.size(0)

    return total_loss / total, correct / total


# ─────────────────────────────────────────────
# PLOTS
# ─────────────────────────────────────────────
def plot_history(history: dict, path: str):
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    for ax, key, title in zip(axes, ["loss", "acc"], ["Loss", "Acurácia"]):
        ax.plot(history[f"train_{key}"], label="Treino",    linewidth=2)
        ax.plot(history[f"val_{key}"],   label="Validação", linewidth=2)
        ax.set_title(title); ax.set_xlabel("Época"); ax.legend(); ax.grid(alpha=0.3)
    plt.suptitle("Bird Detection — Xeno-canto", fontsize=15)
    plt.tight_layout()
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"📊 Histórico salvo: {path}")


def plot_confusion(y_true, y_pred, names: list[str], path: str):
    cm  = confusion_matrix(y_true, y_pred)
    sz  = max(10, len(names) // 2)
    fig, ax = plt.subplots(figsize=(sz, sz - 2))
    sns.heatmap(cm, annot=len(names) <= 20, fmt="d", cmap="Blues",
                xticklabels=names, yticklabels=names, ax=ax)
    ax.set_title("Matriz de Confusão"); ax.set_xlabel("Predição"); ax.set_ylabel("Real")
    plt.tight_layout()
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"📊 Matriz salva: {path}")


def plot_class_distribution(labels: list[str], path: str):
    counts  = Counter(labels)
    species = [s for s, _ in sorted(counts.items(), key=lambda x: -x[1])]
    values  = [counts[s] for s in species]
    fig, ax = plt.subplots(figsize=(14, max(6, len(species) * 0.35)))
    ax.barh(species[::-1], values[::-1], color="#4A90D9")
    ax.set_xlabel("Número de amostras")
    ax.set_title(f"Distribuição por espécie ({len(species)} espécies)")
    plt.tight_layout()
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"📊 Distribuição salva: {path}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    print("\n" + "="*60)
    print("   🐦 BIRD DETECTION — XENO-CANTO TRAINING")
    print("="*60 + "\n")

    # 1. Carrega dataset do CSV
    files, raw_labels = load_dataset_from_csv(CONFIG)

    # Plot distribuição
    plot_class_distribution(raw_labels, f"{CONFIG['output_dir']}/class_distribution.png")

    # 2. Encode labels
    le = LabelEncoder()
    enc_labels = le.fit_transform(raw_labels)
    num_classes = len(le.classes_)
    np.save(CONFIG["labels_path"], le.classes_)
    print(f"\n🏷️  {num_classes} espécies: {list(le.classes_[:5])}{'...' if num_classes > 5 else ''}")

    # 3. Splits estratificados
    X_tr, X_tmp, y_tr, y_tmp = train_test_split(
        files, enc_labels,
        test_size=CONFIG["val_split"] + CONFIG["test_split"],
        stratify=enc_labels, random_state=42,
    )
    test_ratio = CONFIG["test_split"] / (CONFIG["val_split"] + CONFIG["test_split"])
    X_val, X_te, y_val, y_te = train_test_split(
        X_tmp, y_tmp, test_size=test_ratio, stratify=y_tmp, random_state=42,
    )
    print(f"📊 Treino: {len(X_tr)} | Validação: {len(X_val)} | Teste: {len(X_te)}\n")

    # 4. DataLoaders
    def make_loader(paths, labels, augment, shuffle):
        ds = XenoCantoDataset(paths, labels, CONFIG, augment=augment)
        # num_workers=0 no Windows (multiprocessing tem limitações no Windows)
        import platform
        nw = 0 if platform.system() == "Windows" else 4
        pw = False if nw == 0 else True
        return DataLoader(ds, batch_size=CONFIG["batch_size"], shuffle=shuffle,
                          num_workers=nw, pin_memory=True, persistent_workers=pw)

    train_loader = make_loader(X_tr,  y_tr,  augment=True,  shuffle=True)
    val_loader   = make_loader(X_val, y_val, augment=False, shuffle=False)
    test_loader  = make_loader(X_te,  y_te,  augment=False, shuffle=False)

    # 5. Modelo
    model = BirdCNN(num_classes=num_classes).to(DEVICE)
    params = sum(p.numel() for p in model.parameters())
    print(f"🧠 BirdCNN — {params:,} parâmetros | {num_classes} classes\n")

    # 6. Otimização
    criterion  = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer  = optim.AdamW(model.parameters(),
                             lr=CONFIG["learning_rate"],
                             weight_decay=CONFIG["weight_decay"])
    scheduler  = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=CONFIG["epochs"])
    early_stop = EarlyStopping(patience=CONFIG["patience"])

    # 7. Loop de treino
    history = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}
    best_val_acc = 0.0

    print(f"{'Época':>6} | {'Tr Loss':>8} | {'Tr Acc':>7} | {'Vl Loss':>8} | {'Vl Acc':>7} | {'LR':>9}")
    print("─" * 60)

    for epoch in range(1, CONFIG["epochs"] + 1):
        tr_loss, tr_acc = run_epoch(model, train_loader, criterion, optimizer)
        vl_loss, vl_acc = run_epoch(model, val_loader,   criterion)
        scheduler.step()

        for k, v in zip(["train_loss","val_loss","train_acc","val_acc"],
                        [tr_loss, vl_loss, tr_acc, vl_acc]):
            history[k].append(v)

        lr = optimizer.param_groups[0]["lr"]
        print(f"{epoch:>6} | {tr_loss:>8.4f} | {tr_acc:>7.4f} | "
              f"{vl_loss:>8.4f} | {vl_acc:>7.4f} | {lr:>9.2e}")

        if vl_acc > best_val_acc:
            best_val_acc = vl_acc
            torch.save({
                "epoch": epoch,
                "model_state": model.state_dict(),
                "num_classes": num_classes,
                "config": CONFIG,
            }, CONFIG["model_path"])

        early_stop(vl_loss)
        if early_stop.stop:
            print(f"\n⏹️  Early stopping na época {epoch}")
            break

    print(f"\n✅ Melhor val acc: {best_val_acc:.4f}")

    # 8. Avaliação no conjunto de teste
    ckpt = torch.load(CONFIG["model_path"], map_location=DEVICE)
    model.load_state_dict(ckpt["model_state"])

    all_preds, all_true = [], []
    model.eval()
    with torch.no_grad():
        for specs, labels in test_loader:
            preds = model(specs.to(DEVICE)).argmax(1).cpu().numpy()
            all_preds.extend(preds)
            all_true.extend(labels.numpy())

    print("\n" + "="*60)
    print("📋 RELATÓRIO DE CLASSIFICAÇÃO — TESTE")
    print("="*60)
    print(classification_report(all_true, all_preds,
                                 target_names=le.classes_,
                                 zero_division=0))

    # 9. Plots finais
    plot_history(history, f"{CONFIG['output_dir']}/training_history.png")
    plot_confusion(all_true, all_preds, list(le.classes_),
                   f"{CONFIG['output_dir']}/confusion_matrix.png")

    print(f"\n🎉 Concluído! Modelo salvo em: {CONFIG['model_path']}")
    print(f"📁 Outputs em: {CONFIG['output_dir']}/")


if __name__ == "__main__":
    main()