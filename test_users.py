import os
import io
import soundfile as sf
from backend.services.audio_preprocessor import decode_and_validate_audio
from ml.speaker import speaker_verifier
from ml.speaker.similarity import compute_cosine_similarity

folder = 'authenticatedusers'
embeddings = {}

for f in sorted(os.listdir(folder)):
    path = os.path.join(folder, f)
    with open(path, 'rb') as fp:
        raw = fp.read()
    tensor, meta = decode_and_validate_audio(raw, filename=f)
    print(f"Decoded {f}: {len(tensor)/16000:.2f}s, rms={meta['rms_energy']:.4f}")
    emb = speaker_verifier.extract_embedding(tensor)
    embeddings[f] = emb

print('\nPairwise Cosine Similarities:')
files = sorted(embeddings.keys())
header = f"{'File':<18}" + ''.join([f"{f:<18}" for f in files])
print(header)
for f1 in files:
    row = f"{f1:<18}"
    for f2 in files:
        sim = compute_cosine_similarity(embeddings[f1], embeddings[f2])
        row += f"{sim:<18.4f}"
    print(row)
