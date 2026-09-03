"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnalysisResult, AnalysisState } from "@/types/analysis";

interface UseAnalysisSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  analysisState: AnalysisState;
  activeStage: string | null;
  analysisResult: AnalysisResult | null;
  errorMessage: string | null;
  startStreaming: () => void;
  sendAudioChunk: (blob: Blob) => Promise<void>;
  analyzeViaHttp: (blob: Blob, enrolledIdentity?: string) => Promise<AnalysisResult | null>;
  resetState: () => void;
}

export function useAnalysisSocket(wsUrl: string = "ws://localhost:8000/ws/analyze"): UseAnalysisSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("IDLE");
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef<boolean>(false);
  const maxRetries = 5;

  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (isUnmountingRef.current) return;

    // Clean up existing socket if any before recreating
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isUnmountingRef.current) return;
        setIsConnected(true);
        setIsReconnecting(false);
        retryCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (isUnmountingRef.current) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "STATE_CHANGE") {
            setAnalysisState(payload.state);
            setActiveStage(payload.stage || null);
          } else if (payload.type === "PARTIAL_RESULT") {
            setAnalysisState("ANALYZING");
            setActiveStage(payload.stage || "EVALUATING");
          } else if (payload.type === "FINAL_RESULT") {
            setAnalysisState(payload.state || "COMPLETE");
            setAnalysisResult(payload.data);
            setActiveStage(null);
          } else if (payload.type === "ERROR") {
            setAnalysisState("ERROR");
            setErrorMessage(payload.message || "Pipeline processing error");
          }
        } catch {
          // ignore non-json
        }
      };

      ws.onclose = (event) => {
        if (isUnmountingRef.current) return;
        setIsConnected(false);

        // Don't retry if clean close
        if (event.wasClean) {
          setIsReconnecting(false);
          return;
        }

        // Exponential backoff reconnect
        if (retryCountRef.current < maxRetries) {
          setIsReconnecting(true);
          const backoff = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
          retryCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountingRef.current) {
              connectRef.current();
            }
          }, backoff);
        } else {
          setIsReconnecting(false);
        }
      };

      ws.onerror = () => {
        if (isUnmountingRef.current) return;
        try {
          ws.close();
        } catch {
          // ignore
        }
      };
    } catch {
      if (!isUnmountingRef.current) {
        setIsConnected(false);
      }
    }
  }, [wsUrl]);

  useEffect(() => {
    connectRef.current = connect;
    isUnmountingRef.current = false;
    connect();
    return () => {
      isUnmountingRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const startStreaming = useCallback(() => {
    setErrorMessage(null);
    setAnalysisState("RECORDING");
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "START_RECORDING" }));
    }
  }, []);

  const sendAudioChunk = useCallback(async (blob: Blob) => {
    setAnalysisState("ANALYZING");
    setActiveStage("AUDIO_PREPROCESSING");
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const buffer = await blob.arrayBuffer();
      socketRef.current.send(buffer);
    }
  }, []);

  const analyzeViaHttp = useCallback(async (blob: Blob, enrolledIdentity: string = "Primary User"): Promise<AnalysisResult | null> => {
    setAnalysisState("ANALYZING");
    setActiveStage("PREPROCESSING_AND_INFERENCE");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", blob, "captured_voice.wav");
    formData.append("enrolled_speaker_id", enrolledIdentity);

    try {
      const res = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.message || errorData.detail || "Analysis request failed";
        setAnalysisState("ERROR");
        setErrorMessage(msg);
        return null;
      }

      const result: AnalysisResult = await res.json();
      setAnalysisResult(result);
      setAnalysisState(result.state);
      setActiveStage(null);
      return result;
    } catch (err: unknown) {
      setAnalysisState("ERROR");
      setErrorMessage(err instanceof Error ? err.message : "Failed to reach backend analysis service");
      return null;
    }
  }, []);

  const resetState = useCallback(() => {
    setAnalysisState("IDLE");
    setActiveStage(null);
    setAnalysisResult(null);
    setErrorMessage(null);
  }, []);

  return {
    isConnected,
    isReconnecting,
    analysisState,
    activeStage,
    analysisResult,
    errorMessage,
    startStreaming,
    sendAudioChunk,
    analyzeViaHttp,
    resetState,
  };
}
