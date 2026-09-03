import { AudioMetadata, AudioValidationError, ValidatedAudio } from "@/types/audio";

const MIN_AUDIO_DURATION_SECONDS = 1.5;
const MIN_RMS_THRESHOLD = 0.005; // Minimum average energy to not be silence
const MIN_PEAK_THRESHOLD = 0.02; // Minimum peak sample

/**
 * Encodes an AudioBuffer into standard 16-bit linear PCM WAV format.
 * This guarantees any browser-decoded audio stream (WebM, Opus, MP3, AAC, OGG)
 * is converted to a clean standard WAV blob before transmission.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  // Interleave channels
  let interleaved: Float32Array;
  if (numChannels === 1) {
    interleaved = buffer.getChannelData(0);
  } else {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    interleaved = new Float32Array(left.length + right.length);
    for (let i = 0, j = 0; i < left.length; i++) {
      interleaved[j++] = left[i];
      interleaved[j++] = right[i];
    }
  }

  const dataByteCount = interleaved.length * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataByteCount);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, "RIFF");
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataByteCount, true);
  /* RIFF type */
  writeString(8, "WAVE");
  /* format chunk identifier */
  writeString(12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, "data");
  /* data chunk length */
  view.setUint32(40, dataByteCount, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([wavBuffer], { type: "audio/wav" });
}

/**
 * Validates an audio Blob or File using browser Web Audio API.
 * Decodes the audio stream, checks duration, format, and volume/energy.
 */
export async function validateAudioBlob(
  blob: Blob,
  source: "microphone" | "upload",
  originalFilename?: string
): Promise<{ success: true; data: ValidatedAudio } | { success: false; error: AudioValidationError }> {
  // 1. Check size
  if (!blob || blob.size === 0) {
    return {
      success: false,
      error: {
        type: "EMPTY_AUDIO",
        title: "Empty Audio Stream",
        message: "The provided audio input contains 0 bytes of data.",
        actionHint: "Check your microphone input or select a non-empty audio file.",
      },
    };
  }

  // 2. Decode using AudioContext
  let audioCtx: AudioContext | null = null;
  let audioBuffer: AudioBuffer;

  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
    const arrayBuffer = await blob.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err: unknown) {
    return {
      success: false,
      error: {
        type: "DECODE_ERROR",
        title: "Audio Decoding Failed",
        message:
          err instanceof Error
            ? `The audio codec could not be decoded: ${err.message}`
            : "The selected audio file is corrupted or in an unsupported format.",
        actionHint: "Please provide standard PCM WAV, MP3, OGG, FLAC, or WebM audio.",
      },
    };
  } finally {
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close().catch(() => {});
    }
  }

  // 3. Duration check
  const duration = audioBuffer.duration;
  if (duration < MIN_AUDIO_DURATION_SECONDS) {
    return {
      success: false,
      error: {
        type: "AUDIO_TOO_SHORT",
        title: "Audio Too Short for Forensic Analysis",
        message: `Captured audio duration is ${duration.toFixed(2)}s (minimum required is ${MIN_AUDIO_DURATION_SECONDS}s).`,
        actionHint: "Please speak a full phrase or upload an audio sample of at least 2 seconds.",
      },
    };
  }

  // 4. Energy & Silence check (calculate RMS and Peak from channel data)
  const channelData = audioBuffer.getChannelData(0);
  let sumSquares = 0;
  let peak = 0;
  const step = Math.max(1, Math.floor(channelData.length / 50000)); // sample up to 50k points for efficiency

  let sampledCount = 0;
  for (let i = 0; i < channelData.length; i += step) {
    const val = Math.abs(channelData[i]);
    if (val > peak) peak = val;
    sumSquares += val * val;
    sampledCount++;
  }

  const rms = Math.sqrt(sumSquares / Math.max(1, sampledCount));

  if (rms < MIN_RMS_THRESHOLD || peak < MIN_PEAK_THRESHOLD) {
    return {
      success: false,
      error: {
        type: "SILENCE_ONLY",
        title: "Silent Audio Detected",
        message: `Audio energy (RMS: ${rms.toFixed(4)}, Peak: ${peak.toFixed(4)}) is below speech activity thresholds.`,
        actionHint: "Check that your microphone is not muted and speak clearly into the device.",
      },
    };
  }

  // 5. Convert decoded AudioBuffer into a standardized PCM WAV blob
  const wavBlob = audioBufferToWavBlob(audioBuffer);

  const metadata: AudioMetadata = {
    duration: parseFloat(duration.toFixed(2)),
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    format: "AUDIO/WAV",
    sizeBytes: wavBlob.size,
    rmsLevel: parseFloat(rms.toFixed(4)),
    peakLevel: parseFloat(peak.toFixed(4)),
  };

  const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const url = URL.createObjectURL(wavBlob);
  const filename = originalFilename ? `${originalFilename.replace(/\.[^/.]+$/, "")}.wav` : `capture_${new Date().toISOString().replace(/[:.]/g, "-")}.wav`;

  return {
    success: true,
    data: {
      id,
      blob: wavBlob,
      url,
      filename,
      source,
      metadata,
      audioBuffer,
      recordedAt: new Date().toISOString(),
    },
  };
}
