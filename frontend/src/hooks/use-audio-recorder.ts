"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AudioValidationError, ValidatedAudio } from "@/types/audio";
import { validateAudioBlob } from "@/lib/audio-validator";

export interface AudioRecorderState {
  isRecording: boolean;
  recordingTime: number;
  audioData: ValidatedAudio | null;
  error: AudioValidationError | null;
  isValidating: boolean;
  audioLevel: number; // 0.0 - 1.0
  analyserNode: AnalyserNode | null;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<ValidatedAudio | null>(null);
  const [error, setError] = useState<AudioValidationError | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const cleanupAudioNodes = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAnalyserNode(null);
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioData(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    // 1. Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError({
        type: "NO_DEVICE",
        title: "Audio Capture Unsupported",
        message: "Your browser or device does not support standard audio recording APIs.",
        actionHint: "Please try Chrome, Edge, Safari, or Firefox.",
      });
      return;
    }

    try {
      // 2. Request user media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;

      // 3. Setup real-time audio meter using Web Audio API
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(1, avg / 128));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      // 4. Setup MediaRecorder with best supported mimeType
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "",
      ];
      let selectedMime = "";
      for (const mime of mimeTypes) {
        if (!mime || MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        cleanupAudioNodes();
        setIsRecording(false);
        setIsValidating(true);

        const mime = selectedMime || "audio/webm";
        const recordedBlob = new Blob(audioChunksRef.current, { type: mime });

        const validation = await validateAudioBlob(recordedBlob, "microphone");
        setIsValidating(false);

        if (validation.success) {
          setAudioData(validation.data);
          setError(null);
        } else {
          setError(validation.error);
          setAudioData(null);
        }
      };

      recorder.start(100); // 100ms time slice
      setIsRecording(true);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 200);
    } catch (err: unknown) {
      cleanupAudioNodes();
      setIsRecording(false);

      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError({
            type: "PERMISSION_DENIED",
            title: "Microphone Access Denied",
            message: "Microphone permission was rejected. VoiceGuard requires microphone access for live analysis.",
            actionHint: "Click the lock icon in your browser address bar and grant Microphone permission.",
          });
          return;
        }
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError({
            type: "NO_DEVICE",
            title: "No Microphone Detected",
            message: "No audio input hardware was found on your machine.",
            actionHint: "Connect a microphone or use the Upload Audio tab.",
          });
          return;
        }
      }

      setError({
        type: "DECODE_ERROR",
        title: "Audio Initialization Error",
        message: err instanceof Error ? err.message : "Failed to initialize microphone recording.",
        actionHint: "Try restarting your browser or uploading an audio file.",
      });
    }
  }, [cleanupAudioNodes]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (audioData?.url) {
      URL.revokeObjectURL(audioData.url);
    }
    setAudioData(null);
    setError(null);
    setRecordingTime(0);
    setAudioLevel(0);
  }, [audioData]);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setAudioData(null);
    setIsValidating(true);

    const validation = await validateAudioBlob(file, "upload", file.name);
    setIsValidating(false);

    if (validation.success) {
      setAudioData(validation.data);
      setError(null);
    } else {
      setError(validation.error);
      setAudioData(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudioNodes();
      if (audioData?.url) {
        URL.revokeObjectURL(audioData.url);
      }
    };
  }, [cleanupAudioNodes, audioData]);

  return {
    isRecording,
    recordingTime,
    audioData,
    error,
    isValidating,
    audioLevel,
    analyserNode,
    startRecording,
    stopRecording,
    resetRecording,
    handleFileUpload,
  };
}
