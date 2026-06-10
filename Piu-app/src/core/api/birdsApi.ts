// src/core/api/birdsApi.ts
// Chamadas para os endpoints de detecção de pássaros

import apiClient from "./client";
import { tokenManager } from "../auth/tokenManager";

// ── Tipos ──────────────────────────────────────────────────────
export interface SpeciesProbability {
  species: string;
  probability: number;
}

export interface PredictionResponse {
  species: string;
  confidence: number;
  filename: string;
  detected_by: string;
  top5: SpeciesProbability[];
}

export interface SpeciesListResponse {
  species: string[];
  total: number;
}

export interface ModelHealth {
  status: string;
  model: string;
  species_count: number;
  device: string;
}

// ── Detectar espécie por áudio (multipart/form-data) ──────────
// Usa fetch nativo do React Native — o axios tem problemas com FormData
// multipart no Android (não gera o boundary corretamente).
export async function predictBird(audioUri: string): Promise<PredictionResponse> {
  const baseUrl = apiClient.defaults.baseURL;
  const url = `${baseUrl}/birds/predict`;
  console.log("[API] predictBird → POST", url);
  console.log("[API] uri do arquivo:", audioUri);

  const token = await tokenManager.getAccessToken();

  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    name: "recording.m4a",
    type: "audio/m4a",
  } as any);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // NÃO definir Content-Type aqui — o fetch nativo adiciona o boundary
    },
    body: formData,
  });

  console.log("[API] status HTTP:", response.status);

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    console.log("[API] erro do servidor:", body);
    const err: any = new Error(body?.detail ?? `HTTP ${response.status}`);
    err.response = { status: response.status, data: body };
    throw err;
  }

  const data: PredictionResponse = await response.json();
  console.log("[API] predição recebida:", data.species, data.confidence);
  return data;
}

// ── Listar espécies que o modelo conhece ─────────────────────
export async function listSpecies(): Promise<SpeciesListResponse> {
  const { data } = await apiClient.get<SpeciesListResponse>("/birds/species");
  return data;
}

// ── Health check do modelo (sem auth) ────────────────────────
export async function checkModelHealth(): Promise<ModelHealth> {
  const { data } = await apiClient.get<ModelHealth>("/birds/health");
  return data;
}
