import apiClient from "../../../core/api/client";

export type BirdRecord = {
  id: string;
  common_name: string;
  scientific_name: string;
  confidence?: number;
  audio_url?: string | null;
  location?: string | null;
  created_at: string;
};

export async function getMyBirdRecords() {
  const { data } = await apiClient.get<{
    records: BirdRecord[];
    total: number;
  }>("/auth/me/records");

  return data;
}

export async function createBirdRecord(payload: {
  common_name: string;
  scientific_name: string;
  confidence?: number;
  audio_url?: string | null;
  location?: string | null;
}) {
  const { data } = await apiClient.post("/auth/me/records", payload);
  return data;
}