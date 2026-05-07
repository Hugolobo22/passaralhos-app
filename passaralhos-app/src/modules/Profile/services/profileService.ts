import apiClient from "../../../core/api/client";

export type UserProfileResponse = {
  id: string;
  name: string;
  email: string;
  username: string;
  title: string;
  bio: string;
  location: string;
  xp: number;
  level: number;
  species_count: number;
  recordings_count: number;
  rare_count: number;
};

export async function getMyProfile(): Promise<UserProfileResponse> {
  const { data } = await apiClient.get<UserProfileResponse>("/auth/me");
  return data;
}

export async function updateMyProfile(payload: Partial<UserProfileResponse>) {
  const { data } = await apiClient.put<UserProfileResponse>("/auth/me", payload);
  return data;
}

export async function deleteMyProfile() {
  await apiClient.delete("/auth/me");
}