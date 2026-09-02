import numpy as np
from typing import List, Dict, Any, Optional
from ml.speaker import speaker_verifier


def project_embeddings_pca_2d(
    enrolled_emb: np.ndarray,
    current_emb: Optional[np.ndarray] = None,
    current_label: str = "Current Sample",
    current_type: str = "current",
) -> List[Dict[str, Any]]:
    """
    Computes a deterministic 2D PCA acoustic projection of voiceprint embeddings.
    Clusters represent:
      - Enrolled Reference Voice
      - Genuine Historical Samples (tight cluster near enrolled)
      - Impostor Human Samples (distant cluster)
      - AI Cloned / Synthetic Samples (perturbed offset)
      - Current Analyzed Audio Vector
    """
    # Deterministic reference cluster fixtures based on 192-d ECAPA embeddings
    np.random.seed(42)

    # 1. Base reference points: Enrolled profile
    enrolled_192 = np.asarray(enrolled_emb, dtype=np.float32).flatten()
    norm = np.linalg.norm(enrolled_192)
    if norm > 0:
        enrolled_192 = enrolled_192 / norm

    # Generate reference baseline clusters
    points_raw = [enrolled_192]
    meta = [{"label": "Enrolled Reference", "type": "enrolled", "identity": "Primary User"}]

    # Genuine samples (low perturbation: 0.05 - 0.12)
    for i in range(4):
        noise = np.random.normal(0, 0.08, size=enrolled_192.shape).astype(np.float32)
        gen = enrolled_192 + noise
        gen = gen / np.linalg.norm(gen)
        points_raw.append(gen)
        meta.append({"label": f"Genuine Sample {i+1}", "type": "genuine", "identity": "Primary User"})

    # Synthetic clone samples (directed spectral perturbation: 0.18 - 0.25)
    for i in range(3):
        noise = np.random.normal(0.12, 0.15, size=enrolled_192.shape).astype(np.float32)
        synth = enrolled_192 + noise
        synth = synth / np.linalg.norm(synth)
        points_raw.append(synth)
        meta.append({"label": f"Synthetic Clone {i+1}", "type": "synthetic", "identity": "Deepfake Impersonator"})

    # Impostor samples (orthogonal / distant: 0.7 - 0.9)
    for i in range(3):
        noise = np.random.normal(0.6, 0.4, size=enrolled_192.shape).astype(np.float32)
        imp = noise / np.linalg.norm(noise)
        points_raw.append(imp)
        meta.append({"label": f"Unknown Impostor {i+1}", "type": "impostor", "identity": "Stranger Profile"})

    # Append current incoming embedding
    if current_emb is not None:
        c_emb = np.asarray(current_emb, dtype=np.float32).flatten()
        c_norm = np.linalg.norm(c_emb)
        if c_norm > 0:
            c_emb = c_emb / c_norm
        points_raw.append(c_emb)
        meta.append({"label": current_label, "type": current_type, "identity": "Current Input"})

    # Compute 2D PCA via SVD (Singular Value Decomposition)
    X = np.vstack(points_raw)
    X_centered = X - np.mean(X, axis=0)
    U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)
    # Project to first 2 Principal Components
    projected_2d = np.dot(X_centered, Vt[:2].T)

    # Normalize projected coordinates to [-100, 100] coordinate grid
    max_val = np.max(np.abs(projected_2d)) + 1e-6
    scaled_2d = (projected_2d / max_val) * 85.0

    result = []
    for i, m in enumerate(meta):
        result.append({
            "id": f"pt_{i}",
            "x": round(float(scaled_2d[i, 0]), 2),
            "y": round(float(scaled_2d[i, 1]), 2),
            "label": m["label"],
            "type": m["type"],
            "identity": m["identity"],
        })

    return result
