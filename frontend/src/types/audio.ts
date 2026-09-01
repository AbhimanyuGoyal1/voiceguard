export interface AudioMetadata {
  duration: number; // in seconds
  sampleRate: number; // e.g. 16000, 44100, 48000
  channels: number; // 1 or 2
  format: string;
  sizeBytes: number;
  rmsLevel: number; // root mean square energy
  peakLevel: number; // max absolute sample value (0.0 - 1.0)
}

export interface ValidatedAudio {
  id: string;
  blob: Blob;
  url: string;
  filename: string;
  source: "microphone" | "upload";
  metadata: AudioMetadata;
  audioBuffer: AudioBuffer;
  recordedAt: string;
}

export type AudioValidationErrorType =
  | "PERMISSION_DENIED"
  | "NO_DEVICE"
  | "UNSUPPORTED_FORMAT"
  | "EMPTY_AUDIO"
  | "AUDIO_TOO_SHORT"
  | "SILENCE_ONLY"
  | "DECODE_ERROR";

export interface AudioValidationError {
  type: AudioValidationErrorType;
  title: string;
  message: string;
  actionHint?: string;
}
