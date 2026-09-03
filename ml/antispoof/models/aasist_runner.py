import os
import torch
import torch.nn.functional as F
import numpy as np
from typing import Dict, Any, Optional

from ml.antispoof.models.aasist import Model

AASIST_L_WEIGHTS = os.path.join(os.path.dirname(__file__), "..", "..", "models", "weights", "AASIST-L.pth")

# Architectural config for AASIST-L
D_ARGS_L = {
    "first_conv": 128,
    "filts": [70, [1, 32], [32, 32], [32, 24], [24, 24]],
    "gat_dims": [24, 32],
    "pool_ratios": [0.5, 0.7, 0.5, 0.5],
    "temperatures": [2.0, 2.0, 100.0, 100.0],
}


class AASISTInferenceEngine:
    """
    Genuine Pretrained AASIST-L Audio Anti-Spoofing Inference Engine.
    Executes real forward pass on raw 16kHz audio waveforms without modification.
    """

    def __init__(self, weights_path: Optional[str] = None, device: str = "cpu"):
        self.device = torch.device(device)
        self.model = None
        self.weights_path = weights_path or AASIST_L_WEIGHTS
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.weights_path):
            try:
                self.model = Model(D_ARGS_L)
                state_dict = torch.load(self.weights_path, map_location=self.device)
                self.model.load_state_dict(state_dict)
                self.model.to(self.device)
                self.model.eval()
            except Exception as e:
                print(f"[AASIST] Warning: Could not load AASIST-L weights: {e}")
                self.model = None

    def predict(self, audio_tensor: np.ndarray, sample_rate: int = 16000) -> Dict[str, Any]:
        """
        Runs real AASIST-L forward pass on 16kHz mono audio.
        Returns:
            {
                "model_name": "AASIST-L",
                "synthetic_probability": float (0-100),
                "human_probability": float (0-100),
                "classification": "AUTHENTIC" | "SYNTHETIC" | "SUSPICIOUS",
                "logits": [bonafide_logit, spoof_logit],
                "is_available": bool
            }
        """
        if self.model is None or audio_tensor is None or len(audio_tensor) < 1600:
            return {
                "model_name": "AASIST-L",
                "synthetic_probability": 0.0,
                "human_probability": 100.0,
                "classification": "AUTHENTIC",
                "logits": [0.0, 0.0],
                "is_available": False,
            }

        # AASIST expects 64,600 samples (~4.0375s at 16kHz)
        target_len = 64600
        audio_flat = audio_tensor.flatten()
        if len(audio_flat) < target_len:
            padded = np.pad(audio_flat, (0, target_len - len(audio_flat)), mode="wrap")
        else:
            padded = audio_flat[:target_len]

        x = torch.from_numpy(padded.astype(np.float32)).unsqueeze(0).to(self.device)

        with torch.no_grad():
            _, out = self.model(x)
            probs = F.softmax(out, dim=1).cpu().numpy()[0]
            logits = out.cpu().numpy()[0].tolist()

        # In AASIST-L trained on ASVspoof:
        # index 0: bonafide (human), index 1: spoof (synthetic)
        human_prob = float(probs[0] * 100.0)
        synth_prob = float(probs[1] * 100.0)

        if synth_prob >= 55.0:
            classification = "SYNTHETIC"
        elif synth_prob >= 40.0:
            classification = "SUSPICIOUS"
        else:
            classification = "AUTHENTIC"

        return {
            "model_name": "AASIST-L",
            "synthetic_probability": round(synth_prob, 2),
            "human_probability": round(human_prob, 2),
            "classification": classification,
            "logits": [round(l, 4) for l in logits],
            "is_available": True,
        }


# Global singleton instance
aasist_inference = AASISTInferenceEngine()
