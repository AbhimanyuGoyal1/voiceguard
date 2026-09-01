# Machine Learning & Model Utilities

This directory contains standalone model loading, feature extraction, and inference wrappers.
As mandated by `RULES.md` and `PRD.md`, ML code is kept separate from FastAPI routing logic.

## Structure (Planned for PR-04 & PR-05)
- `speaker/`: Speaker verification models (e.g., ECAPA-TDNN)
- `antispoof/`: Audio authenticity / deepfake detection models (e.g., AASIST / RawNet2)
- `common/`: Audio preprocessing, embedding calibration, and tensor utilities
