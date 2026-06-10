// src/modules/Identification/hooks/useBirdDetection.ts
// Hook principal que gerencia gravação + envio + resultado

import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { predictBird, PredictionResponse } from './../../core/api/birdsApi';

type Status = 'idle' | 'recording' | 'processing' | 'success' | 'error';

interface UseBirdDetectionReturn {
  status: Status;
  result: PredictionResponse | null;
  errorMessage: string | null;
  recordingDuration: number;       // segundos gravados
  startRecording: () => Promise<void>;
  stopAndDetect: () => Promise<void>;
  reset: () => void;
}

export function useBirdDetection(): UseBirdDetectionReturn {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Inicia gravação ──────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      // Pede permissão ao microfone
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setErrorMessage('Permissão ao microfone negada.');
        setStatus('error');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setStatus('recording');
      setRecordingDuration(0);

      // Contador de segundos
      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);

    } catch (e: any) {
      setErrorMessage(e.message ?? 'Erro ao iniciar gravação');
      setStatus('error');
    }
  }, []);

  // ── Para gravação e envia para a API ─────────────────────────
  const stopAndDetect = useCallback(async () => {
    if (!recordingRef.current) return;

    // Para o timer
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      setStatus('processing');

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error('Arquivo de gravação não encontrado');

      // Verifica se o arquivo existe
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) throw new Error('Arquivo de áudio não encontrado');

      // Envia para a API
      const prediction = await predictBird(uri);
      setResult(prediction);
      setStatus('success');

    } catch (e: any) {
      setErrorMessage(e.message ?? 'Erro ao detectar pássaro');
      setStatus('error');
    } finally {
      // Reseta modo de áudio
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }
  }, []);

  // ── Reseta estado ────────────────────────────────────────────
  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
    setRecordingDuration(0);
  }, []);

  return {
    status,
    result,
    errorMessage,
    recordingDuration,
    startRecording,
    stopAndDetect,
    reset,
  };
}